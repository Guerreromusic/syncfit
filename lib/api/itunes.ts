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

export async function getItunesPreview(
  title: string,
  artist: string,
): Promise<PreviewDetail | null> {
  if (!title.trim()) return null;
  try {
    const term = encodeURIComponent(`${title} ${artist}`.trim());
    // Pull several candidates so we can pick one that ACTUALLY has a preview and
    // best matches the song — `limit=1` frequently returns a no-preview or remix.
    const url = `https://itunes.apple.com/search?term=${term}&entity=song&media=music&limit=8`;
    const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
    if (!res.ok) return null;
    const json = await res.json();
    const results: any[] = Array.isArray(json?.results) ? json.results : [];
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
