// =============================================================================
// SyncFit by Synclat — Songstats adapter (OPTIONAL market signal)
// =============================================================================
// Runs SERVER-SIDE only. Optional: if SONGSTATS_API_KEY is not configured, this
// returns demo-safe placeholder data so the rest of the app keeps working.
//
// Verified against the official Songstats Enterprise API + Python SDK:
//   • Base URL : https://api.songstats.com/enterprise/v1
//   • Auth     : `apikey` request header
//   • Search   : GET tracks/search?q=<text>   → { result, results: [...] }
//   • Stats    : GET tracks/stats?songstats_track_id=<id>  (or isrc / spotify_track_id)
//   • Errors   : { result: "error", message } with a non-200 status
// (If a future plan moves the host to data.songstats.com, only SONGSTATS_BASE
//  needs to change.)
// =============================================================================

import { env, isConfigured } from "../env";
import { getItunesPreview } from "./itunes";
import { fetchWithTimeout } from "../fetchWithTimeout";
import type { MarketSignal, StreamMetrics, TrendingTrack } from "../types";

const SONGSTATS_BASE = "https://api.songstats.com/enterprise/v1";

export const SONGSTATS_ENDPOINTS = {
  search: "tracks/search",
  stats: "tracks/stats",
} as const;

const PLACEHOLDER: MarketSignal = {
  status: "Unknown",
  summary:
    "Songstats API key not configured. Market signal not included in this demo result.",
  confidence: 0,
};

export type MarketSignalParams = { artist: string; title: string };

function songstatsUrl(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): string {
  const url = new URL(`${SONGSTATS_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && `${v}`.length > 0) url.searchParams.set(k, `${v}`);
  }
  return url.toString();
}

async function songstatsGet(url: string, retryOn429 = true): Promise<any> {
  // Never cache (freshness + we don't persist provider responses).
  const res = await fetchWithTimeout(
    url,
    {
      cache: "no-store",
      headers: { apikey: env.songstats(), Accept: "application/json" },
    },
    10000,
  );
  // One short backoff on rate-limit before giving up, so a momentary 429 during
  // the trending burst doesn't drop the row entirely.
  if (res.status === 429 && retryOn429) {
    const ra = Number(res.headers.get("retry-after"));
    const waitMs = Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 500, 2000);
    await new Promise((r) => setTimeout(r, waitMs));
    return songstatsGet(url, false);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.result === "error") {
    const msg = json?.message || `HTTP ${res.status}`;
    throw new Error(`Songstats ${msg}`);
  }
  return json;
}

/**
 * Best-effort extraction of a Spotify-ish stream total from a `tracks/stats`
 * response. The stats payload shape varies by plan/source, so we walk it
 * defensively for any numeric value under a stream-like key and take the max.
 * Returns null if nothing stream-like is found.
 */
function extractStreams(statsJson: any): number | null {
  let best: number | null = null;
  const visit = (node: any, keyHint = ""): void => {
    if (node == null) return;
    if (typeof node === "number") {
      if (/stream/i.test(keyHint) && Number.isFinite(node)) {
        best = best === null ? node : Math.max(best, node);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, keyHint));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) visit(v, k);
    }
  };
  visit(statsJson);
  return best;
}

/** Deep-scan a subtree for the MAX numeric value under a key matching `keyRe`
 * (optionally excluding keys matching `antiRe`). Robust to schema nesting. */
function scanMax(node: any, keyRe: RegExp, antiRe?: RegExp): number | null {
  let best: number | null = null;
  const visit = (n: any, hint = ""): void => {
    if (n == null) return;
    if (typeof n === "number") {
      if (keyRe.test(hint) && (!antiRe || !antiRe.test(hint)) && Number.isFinite(n)) {
        best = best === null ? n : Math.max(best, n);
      }
      return;
    }
    if (Array.isArray(n)) {
      n.forEach((x) => visit(x, hint));
      return;
    }
    if (typeof n === "object") {
      for (const [k, v] of Object.entries(n)) visit(v, k);
    }
  };
  visit(node);
  return best;
}

/**
 * Pull the full cross-platform streaming + popularity picture from a Songstats
 * `tracks/stats` response. Songstats returns a `stats: [{ source, data }]` array;
 * we index it by source and deep-scan each source's subtree for the relevant
 * metric so it survives field-name / nesting changes. Anything missing stays
 * null and is simply not displayed.
 */
function extractMetrics(statsJson: any): StreamMetrics {
  const arr: any[] = Array.isArray(statsJson?.stats)
    ? statsJson.stats
    : Array.isArray(statsJson?.track_info?.stats)
      ? statsJson.track_info.stats
      : Array.isArray(statsJson?.data)
        ? statsJson.data
        : [];
  const bySource: Record<string, any> = {};
  for (const item of arr) {
    const src = String(item?.source ?? "").toLowerCase();
    if (src) bySource[src] = item?.data ?? item;
  }
  const sp = bySource.spotify ?? statsJson;
  const yt = bySource.youtube;
  const tt = bySource.tiktok;
  const sz = bySource.shazam ?? statsJson;

  // Popularity is a 0-100 index — reject anything outside that range.
  const popRaw = scanMax(sp, /popularity/i);
  const spotifyPopularity =
    popRaw !== null && popRaw >= 0 && popRaw <= 100 ? Math.round(popRaw) : null;

  return {
    totalStreams: extractStreams(statsJson),
    spotifyPopularity,
    spotifyStreams: scanMax(sp, /stream/i),
    playlists: scanMax(sp, /playlist/i, /reach/i),
    playlistReach: scanMax(sp, /playlist.*reach|reach.*playlist/i),
    shazams: scanMax(sz, /shazam/i),
    youtubeViews: yt ? scanMax(yt, /view/i) : null,
    tiktokViews: tt ? scanMax(tt, /view/i) : null,
  };
}

function statusFromStreams(streams: number | null): {
  status: MarketSignal["status"];
  confidence: number;
} {
  if (streams === null) return { status: "Emerging", confidence: 45 };
  if (streams >= 50_000_000) return { status: "Established", confidence: 90 };
  if (streams >= 2_000_000) return { status: "Rising", confidence: 75 };
  if (streams > 0) return { status: "Emerging", confidence: 60 };
  return { status: "Emerging", confidence: 40 };
}

/**
 * Get a normalized market signal for a track.
 * Two-step: search by title/artist → fetch current stats for the top match.
 * Returns a safe placeholder when no key is configured, and degrades gracefully
 * (never throws) on any error — SyncFit never fails because an optional API does.
 */
export async function getMarketSignal(
  params: MarketSignalParams,
): Promise<MarketSignal> {
  if (!isConfigured.songstats()) return PLACEHOLDER;

  try {
    // 1) Resolve the track in the Songstats catalogue.
    const q = `${params.title} ${params.artist}`.trim();
    const searchJson = await songstatsGet(
      songstatsUrl(SONGSTATS_ENDPOINTS.search, { q, limit: 1 }),
    );
    const top =
      searchJson?.results?.[0] ?? searchJson?.tracks?.[0] ?? null;

    if (!top) {
      return {
        status: "Unknown",
        summary:
          "Track not found in the Songstats catalogue — no market signal available.",
        confidence: 0,
      };
    }

    const trackId: string | undefined =
      top.songstats_track_id ?? top.id ?? undefined;
    const isrc: string | undefined = top.isrc ?? undefined;

    // Cover artwork comes straight off the search result.
    let artworkUrl: string | null = top.avatar ?? null;

    // 2) Track info (with links) → artwork fallback + Spotify id for preview.
    let spotifyTrackId: string | null = null;
    if (trackId || isrc) {
      try {
        const infoJson = await songstatsGet(
          songstatsUrl("tracks/info", {
            songstats_track_id: trackId,
            isrc: trackId ? undefined : isrc,
            with_links: "true",
          }),
        );
        const ti = infoJson?.track_info ?? {};
        if (!artworkUrl && ti.avatar) artworkUrl = ti.avatar;
        const links: any[] = Array.isArray(ti.links) ? ti.links : [];
        const spotify = links.find((l) => l?.source === "spotify");
        if (spotify?.external_id) spotifyTrackId = String(spotify.external_id);
      } catch {
        // Links/artwork unavailable — fall back to whatever the search gave us.
      }
    }

    // 3) Pull current stats for the matched track — full streaming + popularity.
    let streams: number | null = null;
    let metrics: StreamMetrics | null = null;
    if (trackId || isrc) {
      try {
        const statsJson = await songstatsGet(
          songstatsUrl(SONGSTATS_ENDPOINTS.stats, {
            songstats_track_id: trackId,
            isrc: trackId ? undefined : isrc,
          }),
        );
        metrics = extractMetrics(statsJson);
        streams = metrics.totalStreams ?? extractStreams(statsJson);
      } catch {
        // Found the track but stats unavailable on this plan — still a signal.
      }
    }

    const { status, confidence } = statusFromStreams(streams);
    const streamsNote =
      streams !== null
        ? ` (~${Intl.NumberFormat("en-US", { notation: "compact" }).format(streams)} streams)`
        : "";
    return {
      status,
      summary: `Songstats: "${top.title ?? params.title}" is present in the catalogue${streamsNote}. Market status assessed as ${status}.`,
      confidence,
      artworkUrl,
      spotifyTrackId,
      streams,
      metrics,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "lookup error";
    return {
      status: "Unknown",
      summary: `Songstats lookup failed (${msg}). Market signal omitted from this result.`,
      confidence: 0,
    };
  }
}

/**
 * Resolve a Spotify track id for a title/artist via Songstats (search → info
 * links). Powers keyless inline playback for ANY track in the app. Returns null
 * when Songstats isn't configured or no match is found — never throws.
 */
export async function resolveSpotifyId(
  title: string,
  artist: string,
): Promise<string | null> {
  if (!isConfigured.songstats() || !title.trim()) return null;
  try {
    const q = `${title} ${artist}`.trim();
    const searchJson = await songstatsGet(
      songstatsUrl(SONGSTATS_ENDPOINTS.search, { q, limit: 1 }),
    );
    const top = searchJson?.results?.[0] ?? null;
    const trackId: string | undefined = top?.songstats_track_id;
    if (!trackId) return null;
    const infoJson = await songstatsGet(
      songstatsUrl("tracks/info", {
        songstats_track_id: trackId,
        with_links: "true",
      }),
    );
    const links: any[] = Array.isArray(infoJson?.track_info?.links)
      ? infoJson.track_info.links
      : [];
    const spotify = links.find((l) => l?.source === "spotify");
    return spotify?.external_id ? String(spotify.external_id) : null;
  } catch {
    return null;
  }
}

// =============================================================================
// Trending Latin — curated current hits enriched with live Songstats data
// (real artwork + stream counts). Songstats has no global chart endpoint, so
// the SELECTION is curated; the numbers/artwork are live. Cached server-side.
// =============================================================================

// Curated pool of well-catalogued WORLDWIDE trending tracks across genres
// (Songstats has no global chart endpoint); artwork + streams are live. The
// dashboard rotates through this pool a few at a time. Capped at 100.
const TRENDING_SEED: { title: string; artist: string; genre: string }[] = [
  // ---- Global Trending (worldwide hits across genres) ----
  // Pop
  { title: "Blinding Lights", artist: "The Weeknd", genre: "Pop" },
  { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
  { title: "As It Was", artist: "Harry Styles", genre: "Pop" },
  { title: "Anti-Hero", artist: "Taylor Swift", genre: "Pop" },
  { title: "Espresso", artist: "Sabrina Carpenter", genre: "Pop" },
  { title: "Levitating", artist: "Dua Lipa", genre: "Pop" },
  { title: "Shape of You", artist: "Ed Sheeran", genre: "Pop" },
  { title: "Vampire", artist: "Olivia Rodrigo", genre: "Pop" },
  // Hip-Hop / Rap
  { title: "God's Plan", artist: "Drake", genre: "Hip-Hop" },
  { title: "SICKO MODE", artist: "Travis Scott", genre: "Hip-Hop" },
  { title: "HUMBLE.", artist: "Kendrick Lamar", genre: "Hip-Hop" },
  { title: "First Person Shooter", artist: "Drake", genre: "Hip-Hop" },
  // R&B
  { title: "Kill Bill", artist: "SZA", genre: "R&B" },
  { title: "Snooze", artist: "SZA", genre: "R&B" },
  { title: "Leave The Door Open", artist: "Bruno Mars", genre: "R&B" },
  // K-Pop
  { title: "Dynamite", artist: "BTS", genre: "K-Pop" },
  { title: "Butter", artist: "BTS", genre: "K-Pop" },
  { title: "Pink Venom", artist: "BLACKPINK", genre: "K-Pop" },
  { title: "Seven", artist: "Jung Kook", genre: "K-Pop" },
  // Afrobeats
  { title: "Calm Down", artist: "Rema", genre: "Afrobeats" },
  { title: "Last Last", artist: "Burna Boy", genre: "Afrobeats" },
  { title: "Essence", artist: "Wizkid", genre: "Afrobeats" },
  { title: "Unavailable", artist: "Davido", genre: "Afrobeats" },
  // Amapiano
  { title: "Water", artist: "Tyla", genre: "Amapiano" },
  { title: "Mnike", artist: "Tyler ICU", genre: "Amapiano" },
  // Dance / EDM
  { title: "I'm Good (Blue)", artist: "David Guetta", genre: "Dance" },
  { title: "Wake Me Up", artist: "Avicii", genre: "Dance" },
  { title: "Titanium", artist: "David Guetta", genre: "Dance" },
  // Rock
  { title: "Believer", artist: "Imagine Dragons", genre: "Rock" },
  { title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock" },
  // Country
  { title: "Last Night", artist: "Morgan Wallen", genre: "Country" },
  // Indian
  { title: "Jalebi Baby", artist: "Tesher", genre: "Indian" },

  // ---- Latin (kept in the rotation) ----
  // Reggaeton
  { title: "Me Porto Bonito", artist: "Bad Bunny", genre: "Reggaeton" },
  { title: "Gasolina", artist: "Daddy Yankee", genre: "Reggaeton" },
  { title: "Con Calma", artist: "Daddy Yankee", genre: "Reggaeton" },
  { title: "Tusa", artist: "Karol G", genre: "Reggaeton" },
  { title: "Despacito", artist: "Luis Fonsi", genre: "Reggaeton" },
  { title: "Pepas", artist: "Farruko", genre: "Reggaeton" },
  { title: "Hawái", artist: "Maluma", genre: "Reggaeton" },
  { title: "Yonaguni", artist: "Bad Bunny", genre: "Reggaeton" },
  // Salsa
  { title: "Vivir Mi Vida", artist: "Marc Anthony", genre: "Salsa" },
  { title: "Idilio", artist: "Willie Colón", genre: "Salsa" },
  { title: "El Cantante", artist: "Héctor Lavoe", genre: "Salsa" },
  { title: "La Vida Es Un Carnaval", artist: "Celia Cruz", genre: "Salsa" },
  { title: "Lloraras", artist: "Oscar D'León", genre: "Salsa" },
  { title: "Pedro Navaja", artist: "Rubén Blades", genre: "Salsa" },
  { title: "Quimbara", artist: "Celia Cruz", genre: "Salsa" },
  { title: "Valió la Pena", artist: "Marc Anthony", genre: "Salsa" },
  // Cumbia
  { title: "Nunca Es Suficiente", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "El Listón de Tu Pelo", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Cumbia Sobre el Río", artist: "Celso Piña", genre: "Cumbia" },
  { title: "La Pollera Colorá", artist: "Wilson Choperena", genre: "Cumbia" },
  { title: "17 Años", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Cómo Te Voy a Olvidar", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Y La Hice Llorar", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Amor a Primera Vista", artist: "Los Ángeles Azules", genre: "Cumbia" },
  // Dembow
  { title: "La Mamá de la Mamá", artist: "El Alfa", genre: "Dembow" },
  { title: "Suave", artist: "El Alfa", genre: "Dembow" },
  { title: "4K", artist: "El Alfa", genre: "Dembow" },
  { title: "Pa Romper la Discoteca", artist: "Farruko", genre: "Dembow" },
  { title: "Coronao Now", artist: "El Alfa", genre: "Dembow" },
  { title: "Singapur", artist: "El Alfa", genre: "Dembow" },
  { title: "Mera", artist: "El Alfa", genre: "Dembow" },
  { title: "La Romana", artist: "Bad Bunny", genre: "Dembow" },
  // Brazilian Funk
  { title: "Bum Bum Tam Tam", artist: "MC Fioti", genre: "Brazilian Funk" },
  { title: "Vai Malandra", artist: "Anitta", genre: "Brazilian Funk" },
  { title: "Envolver", artist: "Anitta", genre: "Brazilian Funk" },
  { title: "Baile de Favela", artist: "MC João", genre: "Brazilian Funk" },
  { title: "Bang", artist: "Anitta", genre: "Brazilian Funk" },
  { title: "Show das Poderosas", artist: "Anitta", genre: "Brazilian Funk" },
  { title: "Onda Diferente", artist: "Anitta", genre: "Brazilian Funk" },
  { title: "Deu Onda", artist: "MC G15", genre: "Brazilian Funk" },
];

let trendingCache: { data: TrendingTrack[]; ts: number } | null = null;
const TRENDING_TTL_MS = 60 * 60 * 1000; // 1h session

/**
 * Map an async fn over items with at most `limit` in flight at once. The trending
 * seed list is ~74 entries, each up to 3 sequential Songstats calls; firing them
 * all at once would burst ~220 requests and draw 429s. A small worker pool keeps
 * the documented throttled-enrichment behaviour while still degrading per-item.
 */
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return out;
}

export async function getTrendingLatin(): Promise<TrendingTrack[]> {
  if (trendingCache && Date.now() - trendingCache.ts < TRENDING_TTL_MS) {
    return trendingCache.data;
  }

  // Songstats not configured — enrich with iTunes artwork only (keyless fallback).
  if (!isConfigured.songstats()) {
    const results = await mapPool(
      TRENDING_SEED.slice(0, 30),
      8,
      async (s): Promise<TrendingTrack> => {
        let artworkUrl: string | null = null;
        try {
          const it = await getItunesPreview(s.title, s.artist);
          artworkUrl = it?.artworkUrl ?? null;
        } catch { /* no artwork — placeholder renders */ }
        return {
          title: s.title,
          artist: s.artist,
          artworkUrl,
          streams: null,
          status: "Emerging",
          genre: s.genre,
          spotifyTrackId: null,
        };
      },
    );
    const data = results.filter((t): t is TrendingTrack => Boolean(t));
    trendingCache = { data, ts: Date.now() };
    return data;
  }

  const results = await mapPool(
    TRENDING_SEED,
    5,
    async (s): Promise<TrendingTrack> => {
      let title = s.title;
      let artworkUrl: string | null = null;
      let streams: number | null = null;
      let spotifyTrackId: string | null = null;

      // Songstats — streams, market status, Spotify id, and artwork when present.
      try {
        const searchJson = await songstatsGet(
          songstatsUrl(SONGSTATS_ENDPOINTS.search, {
            q: `${s.title} ${s.artist}`,
            limit: 1,
          }),
        );
        const top = searchJson?.results?.[0] ?? null;
        if (top) {
          title = top.title ?? s.title;
          artworkUrl = top.avatar ?? null;
          const trackId: string | undefined = top.songstats_track_id;
          if (trackId) {
            try {
              const statsJson = await songstatsGet(
                songstatsUrl(SONGSTATS_ENDPOINTS.stats, {
                  songstats_track_id: trackId,
                }),
              );
              streams = extractStreams(statsJson);
            } catch {
              /* stats optional */
            }
            try {
              const infoJson = await songstatsGet(
                songstatsUrl("tracks/info", {
                  songstats_track_id: trackId,
                  with_links: "true",
                }),
              );
              const links: any[] = Array.isArray(infoJson?.track_info?.links)
                ? infoJson.track_info.links
                : [];
              const spotify = links.find((l) => l?.source === "spotify");
              if (spotify?.external_id) spotifyTrackId = String(spotify.external_id);
            } catch {
              /* links optional */
            }
          }
        }
      } catch {
        /* Songstats lookup failed — fall through to the artwork fallback */
      }

      // Artwork fallback — keyless iTunes, so (nearly) every track gets a cover
      // and joins the rotation instead of being filtered out as a placeholder.
      if (!artworkUrl) {
        try {
          const it = await getItunesPreview(s.title, s.artist);
          artworkUrl = it?.artworkUrl ?? null;
        } catch {
          /* iTunes unavailable — track stays cover-less and is skipped */
        }
      }

      return {
        title,
        artist: s.artist,
        artworkUrl,
        streams,
        status: statusFromStreams(streams).status,
        genre: s.genre,
        spotifyTrackId,
      };
    },
  );

  // Keep the curated order; cap the rotating pool at 100.
  const data = results
    .filter((t): t is TrendingTrack => Boolean(t))
    .slice(0, 100);

  trendingCache = { data, ts: Date.now() };
  return data;
}
