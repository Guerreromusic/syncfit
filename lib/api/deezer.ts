// =============================================================================
// SyncFit by Synclat — Deezer Search adapter (keyless preview source)
// =============================================================================
// Deezer's public Search API is keyless and returns a 30s MP3 preview + cover
// art for most tracks — including flagship Latin masters Apple's keyless Search
// API doesn't expose. MP3 also decodes in every browser. We use it as the
// primary source for the in-app player. Server-side; never throws.
// =============================================================================

import {
  type PreviewDetail,
  scoreMatch,
  isConfident,
  buildPreviewQueries,
} from "./itunes";
import { fetchWithTimeout } from "../fetchWithTimeout";

/** One Deezer search pass — returns the raw results array (never throws). */
async function deezerSearch(term: string): Promise<any[]> {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=10`;
  const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  return Array.isArray(json?.data) ? json.data : [];
}

export async function getDeezerPreview(
  title: string,
  artist: string,
): Promise<PreviewDetail | null> {
  if (!title.trim()) return null;
  try {
    // Progressively-looser queries; stop at the first that has a PLAYABLE result
    // so near-miss title/artist strings still resolve to a preview.
    let results: any[] = [];
    let artworkPool: any[] = [];
    for (const term of buildPreviewQueries(title, artist)) {
      const r = await deezerSearch(term);
      if (!r.length) continue;
      if (!artworkPool.length) artworkPool = r;
      if (r.some((x) => typeof x?.preview === "string" && x.preview)) {
        results = r;
        break;
      }
    }
    if (!results.length) results = artworkPool;
    if (!results.length) return null;

    const playable = results.filter(
      (r) => typeof r?.preview === "string" && r.preview,
    );
    const pool = playable.length ? playable : results;
    const best = pool.reduce((a, b) =>
      scoreMatch(b?.title ?? "", b?.artist?.name ?? "", title, artist) >
      scoreMatch(a?.title ?? "", a?.artist?.name ?? "", title, artist)
        ? b
        : a,
    );

    const album = best?.album ?? {};
    const art =
      (typeof album.cover_big === "string" && album.cover_big) ||
      (typeof album.cover_medium === "string" && album.cover_medium) ||
      (typeof best?.artist?.picture_big === "string" && best.artist.picture_big) ||
      null;
    const previewUrl = typeof best?.preview === "string" ? best.preview : null;
    const bestTitle = typeof best?.title === "string" ? best.title : title;
    const bestArtist =
      typeof best?.artist?.name === "string" ? best.artist.name : artist;
    return {
      previewUrl,
      artworkUrl: art,
      title: bestTitle,
      artist: bestArtist,
      confident: Boolean(previewUrl) && isConfident(bestTitle, bestArtist, title, artist),
    };
  } catch {
    return null;
  }
}
