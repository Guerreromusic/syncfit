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
import { fetchWithTimeout } from "../fetchWithTimeout";
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
  // Lyric mood/emotion (premium tiers only — 403 on free/dev, handled gracefully).
  trackMood: "track.lyrics.mood.get",
} as const;

export type SearchTrackParams = { title?: string; artist?: string };

type MxmGenreList = {
  music_genre_list?: {
    music_genre?: {
      music_genre_name?: string;
      music_genre_name_extended?: string;
    };
  }[];
};

/** A raw Musixmatch track node (only the fields we read). */
type MxmTrack = {
  track_id?: number;
  commontrack_id?: number;
  track_name?: string;
  artist_name?: string;
  album_name?: string;
  explicit?: number;
  has_lyrics?: number;
  has_subtitles?: number;
  has_richsync?: number;
  instrumental?: number;
  track_rating?: number;
  track_length?: number;
  num_favourite?: number;
  track_isrc?: string;
  commontrack_isrcs?: string[][] | string[];
  track_spotify_id?: string;
  album_coverart_500x500?: string;
  album_coverart_350x350?: string;
  album_coverart_800x800?: string;
  track_lyrics_translation_options?: unknown;
  // Language if the plan exposes it on the node.
  track_language?: string;
  language?: string;
  primary_genres?: MxmGenreList;
  secondary_genres?: MxmGenreList;
};

/** Collect genre display names (extended where available) from a genre list. */
function genreNames(...lists: (MxmGenreList | undefined)[]): string[] {
  const out: string[] = [];
  for (const list of lists) {
    for (const entry of list?.music_genre_list ?? []) {
      const g = entry.music_genre;
      const name = g?.music_genre_name_extended || g?.music_genre_name;
      if (name && !out.includes(name)) out.push(name);
    }
  }
  return out;
}

/** First ISRC from either the track_isrc field or the commontrack_isrcs matrix. */
function firstIsrc(t: MxmTrack): string | undefined {
  if (t.track_isrc && t.track_isrc.trim()) return t.track_isrc.trim();
  const flat = (t.commontrack_isrcs ?? []).flat?.() ?? [];
  const found = (flat as string[]).find((x) => typeof x === "string" && x.trim());
  return found?.trim() || undefined;
}

// ISO 639-1 language codes → display names (covers the languages SyncFit sees).
const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  en: "English",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  de: "German",
  ca: "Catalan",
  gl: "Galician",
};

function langName(code?: string): string | undefined {
  if (!code) return undefined;
  const c = code.trim().toLowerCase();
  if (!c) return undefined;
  return LANGUAGE_NAMES[c] ?? code.toUpperCase();
}

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
  const genres = genreNames(t.primary_genres, t.secondary_genres);
  const num = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) ? v : undefined;
  const flag = (v: unknown): boolean | undefined =>
    typeof v === "number" ? v === 1 : undefined;

  return {
    trackId: String(t.commontrack_id ?? t.track_id ?? ""),
    title: t.track_name ?? "Unknown title",
    artist: t.artist_name ?? "Unknown artist",
    album: t.album_name || undefined,
    explicit: flag(t.explicit),
    genre: genres[0],
    genres: genres.length ? genres : undefined,
    // Language is read from the node here; enrichTrackMetadata() resolves it from
    // the lyrics endpoint when the node omits it.
    language: langName(t.track_language ?? t.language),
    popularity: num(t.track_rating),
    durationSec: num(t.track_length),
    instrumental: flag(t.instrumental),
    isrc: firstIsrc(t),
    spotifyId: t.track_spotify_id || undefined,
    artworkUrl:
      t.album_coverart_500x500 ||
      t.album_coverart_350x350 ||
      t.album_coverart_800x800 ||
      undefined,
    favourites: num(t.num_favourite),
    hasLyrics: flag(t.has_lyrics),
    hasSubtitles: flag(t.has_subtitles),
    hasRichsync: flag(t.has_richsync),
    lyricsContext: lyricsContext || undefined,
    source: "musixmatch",
  };
}

/**
 * Best-effort lyric mood/emotion (premium endpoint). Returns null on free/dev
 * plans (403) or any error — never throws, never blocks the analysis.
 */
async function getTrackMood(
  trackId: string,
): Promise<NormalizedTrack["mood"]> {
  try {
    const body = await mxmGet(
      mxmUrl(MUSIXMATCH_ENDPOINTS.trackMood, { commontrack_id: trackId }),
    );
    const mood = body?.mood_list?.[0] ?? body?.mood;
    const label: string | undefined =
      mood?.label || body?.mood_list?.[0]?.label || undefined;
    const valence = body?.raw_data?.valence ?? mood?.valence;
    const arousal = body?.raw_data?.arousal ?? mood?.arousal;
    if (!label && valence == null && arousal == null) return null;
    return {
      label,
      valence: typeof valence === "number" ? valence : undefined,
      arousal: typeof arousal === "number" ? arousal : undefined,
    };
  } catch {
    return null; // not on this plan — silently skip.
  }
}

/**
 * Resolve the track's LANGUAGE when the basic search/get payload omits it —
 * first from track.get (track_language), then from the lyrics endpoint
 * (lyrics_language). Best-effort and resilient.
 *
 * V1 SCOPE: Musixmatch supplies language / explicit / genre only. BPM and artist
 * origin are NOT sourced here (BPM comes from the Spotify fallback).
 */
export async function enrichTrackMetadata(
  track: NormalizedTrack,
): Promise<NormalizedTrack> {
  if (track.source !== "musixmatch" || !isConfigured.musixmatch() || !track.trackId) {
    return track;
  }

  let language = track.language;

  // 1) Resolve LANGUAGE when the search node omitted it: track.get first, then
  //    the lyrics endpoint (lyrics_language). Skipped when already known.
  if (!language) {
    try {
      const body = await mxmGet(
        mxmUrl(MUSIXMATCH_ENDPOINTS.trackGet, { commontrack_id: track.trackId }),
      );
      const t: MxmTrack | undefined = body?.track;
      if (t) language = langName(t.track_language ?? t.language);
    } catch {
      // track.get unavailable — continue.
    }
    if (!language) {
      try {
        const body = await mxmGet(
          mxmUrl(MUSIXMATCH_ENDPOINTS.trackLyrics, { commontrack_id: track.trackId }),
        );
        language = langName(body?.lyrics?.lyrics_language);
      } catch {
        // No lyric access on this plan — language stays undefined.
      }
    }
  }

  // 2) Lyric mood/emotion — best-effort (premium; null on free/dev plans).
  const mood = await getTrackMood(track.trackId);

  return { ...track, language, mood };
}

async function mxmGet(url: string, retryOn429 = true): Promise<any> {
  // No-store: never cache Musixmatch responses (compliance + freshness).
  const res = await fetchWithTimeout(url, { cache: "no-store" }, 10000);
  // One short backoff on rate-limit before failing (Musixmatch is the busiest
  // provider). Callers are best-effort and swallow errors, so this just lifts the
  // hit rate during bursts.
  if (res.status === 429 && retryOn429) {
    const ra = Number(res.headers.get("retry-after"));
    const waitMs = Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 500, 2000);
    await new Promise((r) => setTimeout(r, waitMs));
    return mxmGet(url, false);
  }
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
    // Wider candidate pool so the caller can match the EXACT track, not just the
    // most popular hit.
    page_size: 15,
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
