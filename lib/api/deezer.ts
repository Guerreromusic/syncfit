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
} from "./itunes";
import { fetchWithTimeout } from "../fetchWithTimeout";

export async function getDeezerPreview(
  title: string,
  artist: string,
): Promise<PreviewDetail | null> {
  if (!title.trim()) return null;
  try {
    const q = encodeURIComponent(`${title} ${artist}`.trim());
    const url = `https://api.deezer.com/search?q=${q}&limit=10`;
    const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
    if (!res.ok) return null;
    const json = await res.json();
    const results: any[] = Array.isArray(json?.data) ? json.data : [];
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
