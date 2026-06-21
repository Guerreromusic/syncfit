// =============================================================================
// SyncFit by Synclat — TrackFit discovery orchestration
// =============================================================================
// Runs when the user submits a brief WITHOUT naming a track: returns up to 10
// ranked track recommendations. Uses OpenRouter when configured, otherwise a
// local heuristic over the demo catalogue. Runs SERVER-SIDE only.
// =============================================================================

import { runTrackDiscovery, OpenRouterNotConfiguredError } from "./api/openrouter";
import { verifyTrackStatus } from "./api/itunes";
import { searchTrack } from "./api/musixmatch";
import { heuristicAnalysis, labelForScore } from "./scoring";
import { DEMO_TRACKS } from "./demo";
import type {
  AudioReadiness,
  Brief,
  DiscoverResult,
  MarketSignal,
  NormalizedTrack,
  RankedTrack,
} from "./types";

// Fast model for the 10-track discovery list (kept well under the 60s cap).
const DISCOVER_MODEL = "openai/gpt-5-mini";

const PLACEHOLDER_MARKET: MarketSignal = {
  status: "Unknown",
  summary: "",
  confidence: 0,
};
const PLACEHOLDER_AUDIO: AudioReadiness = {
  instrumentalPotential: "Unknown",
  vocalDominance: "Unknown",
  dialogueFriendliness: "Unknown",
  summary: "",
};

export async function discover(input: {
  brief: Brief;
  model?: string;
  /** Track labels to avoid (so "show 10 more" returns a different set). */
  exclude?: string[];
}): Promise<DiscoverResult> {
  // Discovery generates a 10-track LIST that Musixmatch then verifies, so a strong
  // (slow) model would blow Vercel's 60s cap with no real accuracy gain — use a
  // FAST model here. The deep single-track analysis keeps the user's chosen model.
  void input.model;
  const resolvedModel = DISCOVER_MODEL;

  try {
    const raw = await runTrackDiscovery({
      brief: input.brief,
      model: resolvedModel,
      exclude: input.exclude,
    });
    // API TEAM: confirm each track is real via Musixmatch + enrich with real
    // metadata, drop hallucinations, re-rank on the truth.
    const tracks = await enrichRankedTracks(raw, input.brief);
    return {
      tracks,
      modelUsed: resolvedModel,
      openrouterError: null,
      usedDemoData: { openrouter: false },
    };
  } catch (err) {
    // Not configured → ordinary demo mode. A real failure → surface the message.
    const openrouterError =
      err instanceof OpenRouterNotConfiguredError
        ? null
        : err instanceof Error
          ? err.message
          : "AI discovery failed";
    return {
      tracks: heuristicDiscover(input.brief),
      modelUsed: null,
      openrouterError,
      usedDemoData: { openrouter: true },
    };
  }
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, "").replace(/[^a-z0-9]/g, "");

/** Loose title equality for matching an AI suggestion to a catalogue result. */
function titleMatches(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y && (x === y || x.includes(y) || y.includes(x)));
}

/** Run async work with bounded concurrency so we never burst-trip API rate limits. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * THE API TEAM, per recommended track (throttled to avoid rate limits):
 *  1. Musixmatch — confirm the real catalogue track + take canonical title/artist
 *     and real language / genre / explicit / popularity (the discover market proxy).
 *  2. Re-score against the brief on the REAL data (language match, explicit vs
 *     requested brand-safety, popularity), so the ranking is accurate not guessed.
 * IMPORTANT: a failed/rate-limited lookup must NOT drop a real track — we keep it
 * (flagged unverified). NOTE: Songstats is intentionally NOT called per discovery
 * track — 10× its two sequential calls blew past Vercel's 60s cap. The deep
 * Songstats market signal runs on the single-track analysis instead.
 */
async function enrichRankedTracks(
  tracks: RankedTrack[],
  brief: Brief,
): Promise<RankedTrack[]> {
  const enriched = await mapLimit(tracks, 6, (t) => enrichOne(t, brief));
  // NEVER drop a real recommendation. The iTunes (US) catalogue misses many
  // regional / brand-new / trending tracks, so an unverifiable track is KEPT
  // (just lightly demoted), not removed — absence from one catalogue is NOT proof
  // a track is fake. Quality comes from the prompt (real, notable tracks) +
  // re-scoring on real data; verified tracks rank first.
  enriched.sort((a, b) => b.syncFitScore - a.syncFitScore);
  return enriched.slice(0, 10);
}

async function enrichOne(t: RankedTrack, brief: Brief): Promise<RankedTrack> {
  let title = t.title;
  let artist = t.artist;
  let verified = false;
  let artworkUrl: string | null = t.artworkUrl ?? null;

  // 1) MUSIXMATCH — real catalogue + metadata. Only accept an actual TITLE match
  //    (no falling back to an unrelated result, which would "verify" a wrong song).
  let mxm: NormalizedTrack | undefined;
  try {
    const { tracks, demo } = await searchTrack({ title: t.title, artist: t.artist });
    if (!demo && tracks.length) {
      mxm = tracks.find((m) => titleMatches(m.title, t.title));
    }
  } catch {
    /* Musixmatch unavailable — fall through to the iTunes existence check */
  }

  if (mxm) {
    verified = true;
    title = mxm.title;
    artist = mxm.artist;
    artworkUrl = mxm.artworkUrl ?? artworkUrl;
  } else {
    // 2) iTunes existence check (keyless). When it confirms the track, take its
    //    canonical title/artist + artwork. When it can't, KEEP the track anyway —
    //    the US catalogue isn't a global source of truth, so a miss must never
    //    discard a real regional / new / trending recommendation.
    const st = await verifyTrackStatus(t.title, t.artist).catch(
      () => ({ status: "error" as const }),
    );
    if (st.status === "found") {
      verified = true;
      title = st.title ?? title;
      artist = st.artist ?? artist;
      artworkUrl = st.artworkUrl ?? artworkUrl;
    }
  }

  const streams: number | null = null;
  const marketStatus: MarketSignal["status"] = "Unknown";
  const spotifyTrackId: string | null = mxm?.spotifyId ?? null;

  // 3) Re-score on the REAL data so the ranking is accurate, not a guess.
  const realLang = mxm?.language ?? t.language;
  let score = t.syncFitScore;
  if (
    brief.language &&
    brief.language !== "Any" &&
    brief.language !== "Instrumental" &&
    realLang &&
    norm(realLang) !== norm(brief.language)
  ) {
    score -= 12; // wrong language for the brief
  }
  if (mxm?.explicit && brief.brandSafety === "Strict") score -= 16; // explicit vs strict
  if (typeof mxm?.popularity === "number") score += (mxm.popularity - 50) * 0.06; // recognizable helps
  if (!verified) score -= 4; // unverified — slight discount, never a drop
  score = Math.round(clamp(score));

  return {
    ...t,
    title,
    artist,
    syncFitScore: score,
    scoreLabel: labelForScore(score),
    verified,
    genre: mxm?.genre ?? t.genre,
    explicit: mxm?.explicit,
    popularity: mxm?.popularity,
    language: realLang,
    streams,
    marketStatus,
    spotifyTrackId,
    artworkUrl,
  };
}

/** Demo fallback: rank the built-in demo catalogue against the brief. */
function heuristicDiscover(brief: Brief): RankedTrack[] {
  return DEMO_TRACKS.map((t) => {
    const a = heuristicAnalysis({
      brief,
      track: t,
      marketSignal: PLACEHOLDER_MARKET,
      audioReadiness: PLACEHOLDER_AUDIO,
    });
    return {
      title: t.title,
      artist: t.artist,
      syncFitScore: a.syncFitScore,
      scoreLabel: a.scoreLabel,
      reason: a.pitchSummary,
      bestUse: a.bestUseCases[0],
      language: t.language,
      brandSafety: a.brandSafety.level,
    };
  }).sort((x, y) => y.syncFitScore - x.syncFitScore);
}
