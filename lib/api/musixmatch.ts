// =============================================================================
// SyncFit by Synclat — Musixmatch adapter (the REQUIRED hackathon data layer)
// =============================================================================
//
// COMPLIANCE — READ BEFORE EDITING:
//   • Musixmatch data is used in REAL TIME ONLY.
//   • Do NOT store, cache, bulk-download, scrape, redistribute, or commercially
//     reuse Musixmatch lyrics or proprietary content.
//   • Do NOT persist full lyrics anywhere (DB, JSON, logs, commits).
//   • Do NOT display full lyrics in the UI.
//   • We extract only a SHORT lyric CONTEXT snippet for in-memory analysis, and
//     even that is never written to the saved report (see lib/types SavedReport).
//
// All calls run SERVER-SIDE only (invoked from /app/api routes). The API key is
// read from process.env.MUSIXMATCH_API_KEY and never exposed to the browser.
//
// ENDPOINT PATHS:
//   The Musixmatch API base + endpoint names below follow the documented
//   commercial/developer API shape. They are centralized in MUSIXMATCH_ENDPOINTS
//   and read the key from the `apikey` query param so you can update them in ONE
//   place after confirming your plan's exact endpoints in the official docs:
//   https://developer.musixmatch.com/documentation
// =============================================================================

import { env, isConfigured } from "../env";
import { searchDemoTracks, getDemoTrack } from "../demo";
import type { NormalizedTrack } from "../types";

const MUSIXMATCH_BASE = "https://api.musixmatch.com/ws/1.1";

/**
 * Centralized endpoint paths. Update these if your Musixmatch plan exposes
 * different names. Each value is the path appended to MUSIXMATCH_BASE.
 */
export const MUSIXMATCH_ENDPOINTS = {
  trackSearch: "track.search",
  trackGet: "track.get",
  // Lyric context. On most plans this returns a snippet or a portion of lyrics.
  // We only ever extract a SHORT context string — never the full lyric body.
  trackSnippet: "track.snippet.get",
  trackLyrics: "track.lyrics.get",
} as const;

export type SearchTrackParams = { title?: string; artist?: string };

/** A raw Musixmatch track node (only the fields we read). */
type MxmTrack = {
  track_id?: number;
  commontrack_id?: number;
  track_name?: string;
  artist_name?: string;
  album_name?: string;
  explicit?: number;
  has_lyrics?: number;
  primary_genres?: { music_genre_list?: { music_genre?: { music_genre_name?: string } }[] };
};

/** Build a Musixmatch URL with the API key + params. */
function mxmUrl(endpoint: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(`${MUSIXMATCH_BASE}/${endpoint}`);
  url.searchParams.set("apikey", env.musixmatch());
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}`.length > 0) {
      url.searchParams.set(k, `${v}`);
    }
  }
  return url.toString();
}

/** Map a raw Musixmatch track to our NormalizedTrack (no lyrics stored). */
function normalizeMxmTrack(t: MxmTrack, lyricsContext?: string): NormalizedTrack {
  const genre =
    t.primary_genres?.music_genre_list?.[0]?.music_genre?.music_genre_name;
  return {
    trackId: String(t.commontrack_id ?? t.track_id ?? ""),
    title: t.track_name ?? "Unknown title",
    artist: t.artist_name ?? "Unknown artist",
    album: t.album_name || undefined,
    explicit: typeof t.explicit === "number" ? t.explicit === 1 : undefined,
    genre: genre || undefined,
    // language/bpm are not in the basic track payload; left undefined unless a
    // plan/endpoint provides them. lyricsContext is short-only and in-memory.
    lyricsContext: lyricsContext || undefined,
    source: "musixmatch",
  };
}

async function mxmGet(url: string): Promise<any> {
  // No-store: never cache Musixmatch responses (compliance + freshness).
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Musixmatch HTTP ${res.status}`);
  }
  const json = await res.json();
  const code = json?.message?.header?.status_code;
  if (code && code !== 200) {
    throw new Error(`Musixmatch API status ${code}`);
  }
  return json?.message?.body;
}

/**
 * Search for tracks by title and/or artist.
 * Falls back to demo tracks when no API key is configured.
 */
export async function searchTrack(
  params: SearchTrackParams,
): Promise<{ tracks: NormalizedTrack[]; demo: boolean }> {
  if (!isConfigured.musixmatch()) {
    return { tracks: searchDemoTracks(params.title, params.artist), demo: true };
  }

  const url = mxmUrl(MUSIXMATCH_ENDPOINTS.trackSearch, {
    q_track: params.title,
    q_artist: params.artist,
    page_size: 8,
    page: 1,
    s_track_rating: "desc",
  });

  const body = await mxmGet(url);
  const list: { track?: MxmTrack }[] = body?.track_list ?? [];
  const tracks = list
    .map((entry) => entry.track)
    .filter((t): t is MxmTrack => Boolean(t))
    .map((t) => normalizeMxmTrack(t));

  return { tracks, demo: false };
}

/**
 * Fetch full metadata for a single track id.
 * Falls back to demo data for demo ids or when no key is configured.
 */
export async function getTrackMetadata(trackId: string): Promise<NormalizedTrack> {
  const demo = getDemoTrack(trackId);
  if (demo) return demo;

  if (!isConfigured.musixmatch()) {
    // No key and not a known demo id — return a minimal placeholder track.
    return {
      trackId,
      title: "Unknown title",
      artist: "Unknown artist",
      source: "demo",
    };
  }

  const url = mxmUrl(MUSIXMATCH_ENDPOINTS.trackGet, { commontrack_id: trackId });
  const body = await mxmGet(url);
  const t: MxmTrack | undefined = body?.track;
  if (!t) throw new Error("Track not found");
  return normalizeMxmTrack(t);
}

/**
 * Fetch a SHORT lyric context snippet for analysis ONLY.
 *
 * COMPLIANCE: We deliberately truncate to a short context string and NEVER
 * return or store the full lyric body. The returned string is used in-memory by
 * the AI/heuristic layer and is NOT persisted to the saved report.
 *
 * Returns `undefined` if no key is configured, the track has no lyrics, or the
 * endpoint is unavailable — analysis still works without it.
 */
export async function getTrackLyricsContext(
  trackId: string,
): Promise<string | undefined> {
  // Demo tracks carry their own synthetic context.
  const demo = getDemoTrack(trackId);
  if (demo) return demo.lyricsContext;

  if (!isConfigured.musixmatch()) return undefined;

  try {
    // Prefer the snippet endpoint (already short by design).
    const snippetUrl = mxmUrl(MUSIXMATCH_ENDPOINTS.trackSnippet, {
      commontrack_id: trackId,
    });
    const body = await mxmGet(snippetUrl);
    const snippet: string | undefined = body?.snippet?.snippet_body;
    if (snippet && snippet.trim().length > 0) {
      return toShortContext(snippet);
    }
  } catch {
    // Snippet endpoint not available on this plan — fall through.
  }

  try {
    // Fallback: lyrics endpoint, but we TRUNCATE hard to a short context only.
    const lyricsUrl = mxmUrl(MUSIXMATCH_ENDPOINTS.trackLyrics, {
      commontrack_id: trackId,
    });
    const body = await mxmGet(lyricsUrl);
    const raw: string | undefined = body?.lyrics?.lyrics_body;
    if (raw && raw.trim().length > 0) {
      return toShortContext(raw);
    }
  } catch {
    // No lyric access — analysis proceeds with metadata only.
  }

  return undefined;
}

/**
 * Reduce any returned text to a SHORT, non-reproducible context string.
 * Strips Musixmatch tracking/disclaimer footers and caps length so we never
 * hold or pass along a full lyric body.
 */
function toShortContext(text: string): string {
  const cleaned = text
    // Musixmatch appends a "*** This Lyrics is NOT for Commercial use ***" footer
    // and a tracking number — remove anything from the first asterisk block on.
    .split("***")[0]
    .replace(/\s+/g, " ")
    .trim();
  const MAX = 180; // short context only — never the full lyric
  return cleaned.length > MAX ? `${cleaned.slice(0, MAX).trim()}…` : cleaned;
}
