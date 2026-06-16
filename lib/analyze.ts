// =============================================================================
// SyncFit by Synclat — analysis orchestration
// =============================================================================
// Ties the adapters together for a single analyze request:
//   Musixmatch (metadata + short lyric context)  → required
//   Songstats (market signal)                    → optional
//   LALAL.AI (audio readiness)                   → optional
//   OpenRouter (AI reasoning) OR local heuristic  → required (heuristic in demo)
//
// Runs SERVER-SIDE only (called from /app/api/analyze).
// =============================================================================

import {
  getTrackMetadata,
  getTrackLyricsContext,
  searchTrack,
} from "./api/musixmatch";
import { getDemoTrack } from "./demo";
import { getMarketSignal } from "./api/songstats";
import { getAudioReadiness } from "./api/lalal";
import { runSyncFitAnalysis, OpenRouterNotConfiguredError } from "./api/openrouter";
import { heuristicAnalysis } from "./scoring";
import { isConfigured, env } from "./env";
import { isAllowedModel } from "./models";
import type { AnalyzeResult, Brief, ClientTrack, NormalizedTrack } from "./types";

export type AnalyzeInput = {
  brief: Brief;
  /** Provide either a known track (from search/demo) or enough to fetch one. */
  track?: NormalizedTrack;
  trackId?: string;
  title?: string;
  artist?: string;
  previewUrl?: string;
  /** Optional OpenRouter model slug chosen in the UI. */
  model?: string;
};

/**
 * Run a full SyncFit analysis. Always returns a result, even with zero API keys
 * (demo mode). Optional signals degrade gracefully to placeholders.
 */
export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
  const { brief } = input;

  // ---- TASK 1 · MUSIXMATCH — resolve & enrich the track -----------------------
  // Runs in the SAME request as the AI task below, but stays a distinct step:
  // identify/enrich the track via Musixmatch first, then reason over it.
  let track: NormalizedTrack;
  if (input.track) {
    // A track object was supplied directly (kept for API compatibility).
    track = input.track;
  } else if (input.trackId) {
    track = await getTrackMetadata(input.trackId);
  } else if (input.title && input.title.trim()) {
    // Single-run flow: the user just typed a title, so we do the Musixmatch
    // lookup HERE — one Run click performs search + analyze together.
    track = await resolveTrackByName(input.title.trim(), input.artist?.trim());
  } else {
    track = manualTrack(input.title, input.artist);
  }

  // 2) Hydrate a SHORT lyric context for analysis ONLY (never stored/displayed).
  if (!track.lyricsContext) {
    if (track.source === "demo") {
      // Demo context is Synclat-authored synthetic text (not real lyrics). It
      // may have been stripped in transit, so restore it from the demo source.
      const d = getDemoTrack(track.trackId);
      if (d?.lyricsContext) track = { ...track, lyricsContext: d.lyricsContext };
    } else if (track.source === "musixmatch") {
      try {
        track = { ...track, lyricsContext: await getTrackLyricsContext(track.trackId) };
      } catch {
        // Lyric context is optional — proceed with metadata only.
      }
    }
    // source === "manual": no lookup; analysis proceeds on the typed fields.
  }

  // 3) Optional signals (parallel) — both return safe placeholders if missing.
  const [marketSignal, audioReadiness] = await Promise.all([
    getMarketSignal({ artist: track.artist, title: track.title }),
    getAudioReadiness({ audioUrl: input.previewUrl }),
  ]);

  // ---- TASK 2 · OPENROUTER — AI reasoning (or local heuristic in demo) --------
  // Resolve the model once: validated UI choice, else env/default.
  const resolvedModel = isAllowedModel(input.model)
    ? input.model
    : env.openrouterModel();
  let openrouterDemo = false;
  let openrouterError: string | null = null;
  let modelUsed: string | null = null;
  let analysis;
  try {
    analysis = await runSyncFitAnalysis({
      brief,
      track,
      marketSignal,
      audioReadiness,
      model: resolvedModel,
    });
    modelUsed = resolvedModel;
  } catch (err) {
    openrouterDemo = true;
    if (!(err instanceof OpenRouterNotConfiguredError)) {
      // A CONFIGURED call genuinely failed (bad key, 5xx, invalid JSON). Don't
      // fail the request, but surface the error instead of silently presenting
      // the heuristic fallback as ordinary demo mode.
      openrouterError = err instanceof Error ? err.message : "AI analysis failed";
    }
    analysis = heuristicAnalysis({ brief, track, marketSignal, audioReadiness });
  }

  // COMPLIANCE: strip the short lyric context before the result leaves the
  // server. lyricsContext is used in-memory ABOVE (prompt + heuristic) only and
  // must never cross the network boundary into the browser.
  const clientTrack: ClientTrack = { ...track };
  delete (clientTrack as { lyricsContext?: string }).lyricsContext;

  return {
    track: clientTrack,
    marketSignal,
    audioReadiness,
    analysis,
    openrouterError,
    modelUsed,
    usedDemoData: {
      // "Not real Musixmatch data" = demo track, manual entry, or no key.
      musixmatch: track.source !== "musixmatch" || !isConfigured.musixmatch(),
      openrouter: openrouterDemo,
      songstats: !isConfigured.songstats(),
      lalal: !isConfigured.lalal() || !input.previewUrl,
    },
  };
}

/** Build an unverified, hand-entered track (no Musixmatch lookup happened). */
function manualTrack(title?: string, artist?: string): NormalizedTrack {
  return {
    trackId: `manual-${Date.now()}`,
    title: title?.trim() || "Untitled track",
    artist: artist?.trim() || "Unknown artist",
    source: "manual",
  };
}

/**
 * Resolve a typed title/artist to a track via a Musixmatch search, so a single
 * Run click performs search + analyze together.
 *  - Live key: uses the top Musixmatch match.
 *  - Demo mode: uses a demo track only when its title genuinely matches the
 *    query; otherwise reflects what the user typed (a manual track), so the demo
 *    never silently scores a different song.
 * Never throws — a Musixmatch hiccup degrades to a manual track so the single
 * request still completes the AI step.
 */
async function resolveTrackByName(
  title: string,
  artist?: string,
): Promise<NormalizedTrack> {
  try {
    const { tracks, demo } = await searchTrack({ title, artist });
    const top = tracks[0];
    if (top) {
      const titleMatches = top.title.toLowerCase().includes(title.toLowerCase());
      if (!demo || titleMatches) return top;
    }
  } catch {
    // Fall through to a manual track — keep the single request resilient.
  }
  return manualTrack(title, artist);
}
