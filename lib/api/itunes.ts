// =============================================================================
// SyncFit by Synclat — iTunes Search adapter (keyless preview source)
// =============================================================================
// The iTunes Search API is public and keyless. We use it purely to power the
// in-app footer player: given a title + artist it returns a 30s audio preview
// URL and album artwork, so ANY track is playable in-app with no Spotify
// credentials. Server-side; never throws.
// =============================================================================

import { fetchWithTimeout } from "../fetchWithTimeout";

export type PreviewDetail = {
  previewUrl: string | null;
  artworkUrl: string | null;
  title: string;
  artist: string;
  /** True when the result matches BOTH the requested title and artist. */
  confident?: boolean;
};

/** Normalize a title for loose matching (strip parens, "feat", punctuation). */
export function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/feat\.?.*$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/** Closeness of a candidate to the requested title/artist (higher = better). */
export function scoreMatch(
  candTitle: string,
  candArtist: string,
  wantTitle: string,
  wantArtist: string,
): number {
  const t = normTitle(candTitle);
  const ar = normTitle(candArtist);
  const wt = normTitle(wantTitle);
  const wa = normTitle(wantArtist);
  let s = 0;
  if (t && wt) {
    if (t === wt) s += 5;
    else if (t.includes(wt) || wt.includes(t)) s += 3;
  }
  if (ar && wa) {
    if (ar === wa) s += 3;
    else if (ar.includes(wa) || wa.includes(ar)) s += 2;
  }
  return s;
}

/** A candidate is "confident" when BOTH its title and artist match the request. */
export function isConfident(
  candTitle: string,
  candArtist: string,
  wantTitle: string,
  wantArtist: string,
): boolean {
  const t = normTitle(candTitle);
  const ar = normTitle(candArtist);
  const wt = normTitle(wantTitle);
  const wa = normTitle(wantArtist);
  const titleOk = !!t && !!wt && (t === wt || t.includes(wt) || wt.includes(t));
  const artistOk = !!ar && !!wa && (ar.includes(wa) || wa.includes(ar));
  return titleOk && artistOk;
}

/** Strip decorations that throw off catalogue search: parenth/bracket content,
 *  "feat …", and "- Remastered/Live/Version …" suffixes. */
export function simplifyTitle(s: string): string {
  return s
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\s*-\s*(remaster|remastered|live|mono|stereo|version|edit|mix|deluxe|radio|single|album)\b.*$/i, " ")
    .replace(/\bfeat\.?\b.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ordered, de-duplicated search terms to try, most → least specific, so a track
 *  whose exact "title artist" string misses still surfaces a playable preview. */
export function buildPreviewQueries(title: string, artist: string): string[] {
  const t = title.trim();
  const a = artist.trim();
  const st = simplifyTitle(t);
  const out = [
    a ? `${t} ${a}` : t, // exact title + artist
    a && st && st !== t ? `${st} ${a}` : "", // simplified title + artist
    st || t, // title only — last resort; scoreMatch still ranks by artist
  ].filter(Boolean);
  return Array.from(new Set(out));
}

/**
 * Confirm a track actually exists by matching it in the iTunes catalogue, and
 * return its CANONICAL title/artist + artwork. Returns null when the track isn't
 * found or the top result clearly isn't the same song. Used to filter out any
 * AI-hallucinated suggestions so only real tracks are shown. Never throws.
 */
export async function verifyTrack(
  title: string,
  artist: string,
): Promise<{ title: string; artist: string; artworkUrl: string | null } | null> {
  try {
    const it = await getItunesPreview(title, artist);
    if (!it) return null;
    const a = normTitle(title);
    const b = normTitle(it.title);
    if (!a || !b) return null;
    const matches = a === b || a.includes(b) || b.includes(a);
    if (!matches) return null;
    return { title: it.title, artist: it.artist, artworkUrl: it.artworkUrl };
  } catch {
    return null;
  }
}

/**
 * Like verifyTrack, but distinguishes "the catalogue answered and this exact
 * title+artist is NOT there" (→ "not-found", almost certainly an AI
 * hallucination, safe to drop) from "the lookup itself failed / was
 * inconclusive" (→ "error", keep the track rather than drop a real one over a
 * transient outage). iTunes is an authoritative commercial-music catalogue, so a
 * confident no-match is a strong fake signal.
 */
/** Strict title match for VERIFICATION (not loose discovery search): exact, or a
 *  candidate that adds decoration to the wanted title ("… (Remix)/(Live)"), or a
 *  near-equal-length candidate inside the wanted title. A short real title must
 *  NOT match a long invented one (so "Thunder" ≠ "Midnight Velvet Thunder Pulse"). */
function strongTitleMatch(candTitle: string, wantTitle: string): boolean {
  const c = normTitle(candTitle);
  const w = normTitle(wantTitle);
  if (!c || !w) return false;
  if (c === w) return true;
  if (w.length >= 4 && c.includes(w)) return true; // candidate has extra (e.g. remix)
  if (c.length >= 5 && w.includes(c) && Math.abs(c.length - w.length) <= 4) return true;
  return false;
}

function findCatalogueMatch(results: any[], title: string, artist: string): any | null {
  const wantA = normTitle(artist);
  for (const r of results) {
    if (!strongTitleMatch(r.trackName ?? "", title)) continue;
    const a = normTitle(r.artistName ?? "");
    const artistOk = !wantA || (!!a && (a.includes(wantA) || wantA.includes(a)));
    if (artistOk) return r;
  }
  return null;
}

function foundFrom(r: any) {
  const art =
    typeof r.artworkUrl100 === "string"
      ? r.artworkUrl100.replace("100x100bb", "300x300bb")
      : null;
  return { status: "found" as const, title: r.trackName, artist: r.artistName, artworkUrl: art };
}

export async function verifyTrackStatus(
  title: string,
  artist: string,
): Promise<{
  status: "found" | "not-found" | "error";
  title?: string;
  artist?: string;
  artworkUrl?: string | null;
}> {
  try {
    // Primary: exact title + artist.
    const combined = await itunesSearch(`${title} ${artist}`.trim());
    const m1 = combined.length ? findCatalogueMatch(combined, title, artist) : null;
    if (m1) return foundFrom(m1);

    // Fallback: title only — corrects a slightly-off artist, and (since we ask the
    // model for notable/charting tracks) confirms non-existence for fakes.
    const titleOnly = await itunesSearch(title.trim());
    if (titleOnly.length) {
      const m2 = findCatalogueMatch(titleOnly, title, artist);
      if (m2) return foundFrom(m2);
      return { status: "not-found" }; // catalogue has songs, none is this title → fake
    }

    // Both queries empty. A genuinely notable track is never empty on both, so
    // treat as a hallucination (we over-fetch 16 candidates, so the cost of a
    // rare false drop is just one obscure track out of the set).
    return { status: "not-found" };
  } catch {
    return { status: "error" }; // network/timeout → inconclusive, keep the track
  }
}

/** One iTunes search pass — returns the raw results array (never throws). */
async function itunesSearch(term: string): Promise<any[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    term,
  )}&entity=song&media=music&limit=8`;
  const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.results) ? json.results : [];
}

export async function getItunesPreview(
  title: string,
  artist: string,
): Promise<PreviewDetail | null> {
  if (!title.trim()) return null;
  try {
    // Try progressively-looser queries; stop at the first that yields a PLAYABLE
    // candidate so a featuring credit / remaster suffix / slightly-off artist
    // can't leave a real track unplayable. Falls back to any result for artwork.
    let results: any[] = [];
    let artworkPool: any[] = [];
    for (const q of buildPreviewQueries(title, artist)) {
      const r = await itunesSearch(q);
      if (!r.length) continue;
      if (!artworkPool.length) artworkPool = r;
      if (r.some((x) => typeof x?.previewUrl === "string" && x.previewUrl)) {
        results = r;
        break;
      }
    }
    if (!results.length) results = artworkPool;
    if (!results.length) return null;

    const playable = results.filter(
      (r) => typeof r?.previewUrl === "string" && r.previewUrl,
    );
    // Prefer playable results; among them, the best title/artist match. Only fall
    // back to a no-preview result (for artwork) when nothing playable exists.
    const pool = playable.length ? playable : results;
    const best = pool.reduce((a, b) =>
      scoreMatch(b.trackName ?? "", b.artistName ?? "", title, artist) >
      scoreMatch(a.trackName ?? "", a.artistName ?? "", title, artist)
        ? b
        : a,
    );

    // Upscale the 100×100 thumbnail to a crisper 300×300.
    const art =
      typeof best.artworkUrl100 === "string"
        ? best.artworkUrl100.replace("100x100bb", "300x300bb")
        : null;
    const previewUrl = typeof best.previewUrl === "string" ? best.previewUrl : null;
    return {
      previewUrl,
      artworkUrl: art,
      title: typeof best.trackName === "string" ? best.trackName : title,
      artist: typeof best.artistName === "string" ? best.artistName : artist,
      confident:
        Boolean(previewUrl) &&
        isConfident(best.trackName ?? "", best.artistName ?? "", title, artist),
    };
  } catch {
    return null;
  }
}
