// =============================================================================
// SyncFit by Synclat — Spotify adapter (OPTIONAL metadata fallback)
// =============================================================================
// Runs SERVER-SIDE only. Used as a LAST-RESORT metadata source: when Musixmatch
// and Songstats can't supply a field (BPM, artwork, genre, explicit), we fill it
// from Spotify. App-level Client Credentials flow — no user login, no secrets in
// the browser. Degrades to a no-op when SPOTIFY_CLIENT_ID/SECRET aren't set.
//
//   • Token : POST https://accounts.spotify.com/api/token (client_credentials)
//   • Search: GET  /v1/search?type=track
//   • Track : GET  /v1/tracks/{id}
//   • Audio : GET  /v1/audio-features/{id}   → tempo (BPM)
//   • Artist: GET  /v1/artists/{id}          → genres
// =============================================================================

import { env, isConfigured } from "../env";
import { fetchWithTimeout } from "../fetchWithTimeout";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

export type SpotifyMetadata = {
  spotifyTrackId?: string;
  bpm?: number;
  artworkUrl?: string | null;
  explicit?: boolean;
  genre?: string;
  durationMs?: number;
};

export type SpotifyTrackDetail = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  durationMs: number | null;
};

// Cache the app token in-memory until shortly before it expires.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!isConfigured.spotify()) return null;
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const basic = Buffer.from(
    `${env.spotifyClientId()}:${env.spotifyClientSecret()}`,
  ).toString("base64");

  const res = await fetchWithTimeout(
    SPOTIFY_TOKEN_URL,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
    8000,
  );
  if (!res.ok) throw new Error(`Spotify token HTTP ${res.status}`);
  const json = await res.json();
  const token: string | undefined = json?.access_token;
  if (!token) throw new Error("Spotify token missing");
  const ttl = (Number(json?.expires_in) || 3600) * 1000;
  tokenCache = { token, expiresAt: Date.now() + ttl - 60_000 };
  return token;
}

async function spotifyGet(path: string, token: string): Promise<any> {
  const res = await fetchWithTimeout(
    `${SPOTIFY_API}${path}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    },
    8000,
  );
  if (!res.ok) throw new Error(`Spotify HTTP ${res.status}`);
  return res.json();
}

function pickArtwork(images: { url?: string }[] | undefined): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  return images[0]?.url ?? null;
}

/**
 * Resolve Spotify metadata for a track. Prefer a known Spotify id (e.g. from
 * Songstats); otherwise search by title/artist. Best-effort and resilient — any
 * failure returns whatever was gathered (possibly empty). Never throws.
 */
export async function getSpotifyMetadata(params: {
  title: string;
  artist?: string;
  spotifyTrackId?: string | null;
}): Promise<SpotifyMetadata> {
  if (!isConfigured.spotify()) return {};
  try {
    const token = await getToken();
    if (!token) return {};

    // 1) Resolve a track object — by id, else by search.
    let track: any = null;
    if (params.spotifyTrackId) {
      try {
        track = await spotifyGet(`/tracks/${params.spotifyTrackId}`, token);
      } catch {
        track = null;
      }
    }
    if (!track) {
      if (!params.title.trim()) return {};
      const q = encodeURIComponent(
        `${params.title} ${params.artist ?? ""}`.trim(),
      );
      const search = await spotifyGet(
        `/search?q=${q}&type=track&limit=1`,
        token,
      );
      track = search?.tracks?.items?.[0] ?? null;
    }
    if (!track?.id) return {};

    const out: SpotifyMetadata = {
      spotifyTrackId: String(track.id),
      artworkUrl: pickArtwork(track.album?.images),
      explicit: typeof track.explicit === "boolean" ? track.explicit : undefined,
      durationMs:
        typeof track.duration_ms === "number" ? track.duration_ms : undefined,
    };

    // 2) Audio features → BPM (the field Musixmatch rarely exposes).
    try {
      const feat = await spotifyGet(`/audio-features/${track.id}`, token);
      const tempo = Number(feat?.tempo);
      if (Number.isFinite(tempo) && tempo > 0) out.bpm = Math.round(tempo);
    } catch {
      /* audio-features unavailable — skip BPM */
    }

    // 3) Artist genres → genre (Spotify tags genre at the artist level).
    try {
      const artistId = track.artists?.[0]?.id;
      if (artistId) {
        const a = await spotifyGet(`/artists/${artistId}`, token);
        const g = Array.isArray(a?.genres) ? a.genres[0] : undefined;
        if (typeof g === "string" && g.trim()) {
          out.genre = g.replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      }
    } catch {
      /* artist genres unavailable — skip */
    }

    return out;
  } catch {
    return {};
  }
}

/** Find a Spotify track URI by title/artist via the app token — used by the Web
 *  Playback SDK for full-track playback. Returns null when unconfigured/no match. */
export async function searchSpotifyTrackUri(
  title: string,
  artist: string,
): Promise<string | null> {
  if (!isConfigured.spotify() || !title.trim()) return null;
  try {
    const token = await getToken();
    if (!token) return null;
    const q = encodeURIComponent(`${title} ${artist}`.trim());
    const search = await spotifyGet(`/search?q=${q}&type=track&limit=1`, token);
    const id = search?.tracks?.items?.[0]?.id;
    return id ? `spotify:track:${id}` : null;
  } catch {
    return null;
  }
}

/** Extract a Spotify track id from a URL or URI (returns null if none). */
export function extractSpotifyTrackId(text: string): string | null {
  if (!text) return null;
  // https://open.spotify.com/track/<id>?... | spotify:track:<id> | intl-xx/track/<id>
  const m = text.match(/(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/);
  return m ? m[1] : null;
}

/** True when the text contains ANY Spotify link — track, album, playlist, URI, or
 *  a mobile short-link. */
export function hasSpotifyLink(text: string): boolean {
  if (!text) return false;
  return (
    Boolean(extractSpotifyTrackId(text)) ||
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:album|playlist)\/[A-Za-z0-9]{22}/i.test(text) ||
    /spotify:(?:album|playlist):[A-Za-z0-9]{22}/i.test(text) ||
    /https?:\/\/(?:spotify\.link|spotify\.app\.link)\/\S+/i.test(text)
  );
}

/** First track URL referenced anywhere in an HTML body or URL string. */
function firstTrackUrlIn(s: string): string | null {
  const m =
    s.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]{22})/) ||
    s.match(/spotify:track:([A-Za-z0-9]{22})/);
  return m ? `https://open.spotify.com/track/${m[1]}` : null;
}

// Only these hosts may be fetched while expanding a Spotify share short-link.
// The short-link's redirect target is attacker-mintable (Branch.io), so we must
// re-validate every hop or the chain could be used to make the server fetch an
// internal/arbitrary host (SSRF).
const SHORTLINK_HOSTS = [
  /(^|\.)spotify\.link$/,
  /(^|\.)spotify\.app\.link$/,
  /(^|\.)spotify\.com$/,
];
function shortLinkHostAllowed(u: URL): boolean {
  return u.protocol === "https:" && SHORTLINK_HOSTS.some((re) => re.test(u.hostname));
}

/** Follow a spotify.link / spotify.app.link short URL to its real Spotify URL. */
async function expandShortLink(text: string): Promise<string | null> {
  const m = text.match(/https?:\/\/(?:spotify\.link|spotify\.app\.link)\/\S+/i);
  if (!m) return null;
  let url: URL;
  try {
    url = new URL(m[0]);
  } catch {
    return null;
  }
  try {
    // Follow redirects MANUALLY, re-validating the host on EVERY hop (including
    // the first) so a 30x can never steer the fetch onto a forbidden host.
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      if (!shortLinkHostAllowed(url)) return null;
      res = await fetchWithTimeout(
        url.toString(),
        { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (SyncFit)" } },
        8000,
      );
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) break;
        try {
          url = new URL(loc, url); // resolve relative redirects, re-validate next loop
        } catch {
          return null;
        }
        continue;
      }
      break; // non-redirect response — inspect it below
    }
    if (!res) return null;
    // HTTP-redirect case: the resolved URL is the real Spotify URL.
    if (/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:track|album|playlist)\//.test(url.toString())) {
      return url.toString();
    }
    // Branch.io case: an HTML page with a JS/meta redirect — the destination is
    // embedded in the body (parsed only, never fetched here).
    const html = await res.text();
    const um = html.match(
      /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:track|album|playlist)\/[A-Za-z0-9]{22}/,
    );
    if (um) return um[0];
    // Otherwise only surface the resolved URL when it is itself a Spotify host.
    return /(^|\.)spotify\.com$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Album/playlist link → the first track on the page (the album/single's song). */
async function firstTrackOfCollection(text: string): Promise<string | null> {
  const m =
    text.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(album|playlist)\/([A-Za-z0-9]{22})/) ||
    text.match(/spotify:(album|playlist):([A-Za-z0-9]{22})/);
  if (!m) return null;
  const kind = m[1];
  const id = m[2];
  try {
    const res = await fetchWithTimeout(
      `https://open.spotify.com/${kind}/${id}`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (SyncFit)" } },
      8000,
    );
    if (!res.ok) return null;
    const html = await res.text();
    return firstTrackUrlIn(html); // album pages embed their track URIs
  } catch {
    return null;
  }
}

/**
 * Resolve a Spotify track LINK to { title, artist } so the rest of the API team
 * (Musixmatch, Songstats, OpenRouter) can work from a real track. Handles full
 * links, URIs, AND mobile share short-links (spotify.link). Uses the Spotify API
 * when configured; otherwise the keyless oEmbed endpoint (reliable title) plus
 * the track page's OpenGraph tags (artist). Never throws.
 */
export async function resolveSpotifyTrackUrl(
  text: string,
): Promise<{ id: string; title: string; artist: string; artworkUrl: string | null } | null> {
  // Expand mobile short links to the real Spotify URL, then get a track id —
  // directly, or the first track of an album / playlist / single.
  let working = text;
  if (/(?:spotify\.link|spotify\.app\.link)\//i.test(working)) {
    const expanded = await expandShortLink(working);
    if (expanded) working = expanded;
  }
  let id = extractSpotifyTrackId(working);
  if (!id) {
    const trackUrl = await firstTrackOfCollection(working);
    if (trackUrl) id = extractSpotifyTrackId(trackUrl);
  }
  if (!id) return null;

  // 1) Precise path — Spotify Web API (when credentials are set).
  if (isConfigured.spotify()) {
    const detail = await getSpotifyTrackById(id);
    if (detail?.title) {
      return { id, title: detail.title, artist: detail.artist, artworkUrl: detail.artworkUrl };
    }
  }

  let title = "";
  let artist = "";
  let artworkUrl: string | null = null;
  const trackUrl = `https://open.spotify.com/track/${id}`;

  // 2) oEmbed — a stable JSON endpoint (not scraping) → reliable track title.
  try {
    const oe = await fetchWithTimeout(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`,
      { cache: "no-store" },
      8000,
    );
    if (oe.ok) {
      const j = await oe.json();
      if (typeof j?.title === "string") title = j.title.trim();
      if (typeof j?.thumbnail_url === "string") artworkUrl = j.thumbnail_url;
    }
  } catch {
    /* oEmbed unavailable — try OpenGraph next */
  }

  // 3) OpenGraph scrape — fills the ARTIST (og:description = "Artist · Song · …")
  //    and a title fallback.
  try {
    const res = await fetchWithTimeout(
      trackUrl,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (SyncFit)" } },
      8000,
    );
    if (res.ok) {
      const html = await res.text();
      const meta = (prop: string) => {
        const m = html.match(
          new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
        );
        return m ? decodeHtml(m[1]) : null;
      };
      if (!title) title = meta("og:title") || "";
      if (!artworkUrl) artworkUrl = meta("og:image");
      const head = (meta("og:description") || "").split("·")[0]?.trim();
      if (head) artist = head;
    }
  } catch {
    /* OpenGraph unavailable — proceed with whatever we have */
  }

  // A title alone is enough for the API team to research the track.
  if (!title) return null;
  return { id, title, artist, artworkUrl };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Full track detail (incl. 30s preview URL + artwork) for the in-app footer
 * player. Returns null when Spotify isn't configured or the track isn't found.
 * Never throws.
 */
export async function getSpotifyTrackById(
  id: string,
): Promise<SpotifyTrackDetail | null> {
  if (!isConfigured.spotify() || !id) return null;
  try {
    const token = await getToken();
    if (!token) return null;
    const t = await spotifyGet(`/tracks/${id}`, token);
    if (!t?.id) return null;
    return {
      id: String(t.id),
      title: typeof t.name === "string" ? t.name : "",
      artist: Array.isArray(t.artists)
        ? t.artists.map((a: any) => a?.name).filter(Boolean).join(", ")
        : "",
      artworkUrl: pickArtwork(t.album?.images),
      previewUrl: typeof t.preview_url === "string" ? t.preview_url : null,
      durationMs: typeof t.duration_ms === "number" ? t.duration_ms : null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch album artwork for a set of Spotify track ids → map of trackId → artworkUrl.
 * Used to put real cover art on discovery results (Musixmatch rarely returns it).
 * NOTE: Spotify forbids the batch `GET /v1/tracks?ids=` for app (client-credentials)
 * tokens (403), but single `GET /v1/tracks/{id}` is allowed — so we fan out single
 * lookups with bounded concurrency. Never throws.
 */
export async function getSpotifyArtworkByIds(
  ids: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const valid = [...new Set(ids.filter((id) => /^[A-Za-z0-9]{22}$/.test(id)))].slice(0, 20);
  if (!valid.length || !isConfigured.spotify()) return out;
  try {
    const token = await getToken();
    if (!token) return out;
    let cursor = 0;
    async function worker() {
      while (cursor < valid.length) {
        const id = valid[cursor++];
        try {
          const t = await spotifyGet(`/tracks/${id}`, token!);
          const art = pickArtwork(t?.album?.images);
          if (art) out[id] = art;
        } catch {
          /* skip this one */
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(6, valid.length) }, () => worker()),
    );
  } catch {
    /* best-effort */
  }
  return out;
}
