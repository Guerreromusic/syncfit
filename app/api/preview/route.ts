// GET /api/preview?title=&artist= — keyless 30s preview + artwork for the in-app
// footer player. Resolves across Deezer (primary: real masters, MP3 that decodes
// everywhere) and iTunes (fallback + artwork), preferring a result that matches
// BOTH the title and artist. Returns { track: null } when nothing is found.
import { NextResponse } from "next/server";
import { getItunesPreview, type PreviewDetail } from "@/lib/api/itunes";
import { getDeezerPreview } from "@/lib/api/deezer";

export const dynamic = "force-dynamic";

/** Pick the best of two candidates: a confident playable beats a loose one;
 *  among equals prefer Deezer (MP3 decodes in every browser). */
function pickBest(dz: PreviewDetail | null, it: PreviewDetail | null): PreviewDetail | null {
  const dzPlayable = Boolean(dz?.previewUrl);
  const itPlayable = Boolean(it?.previewUrl);

  // 1) A confident, playable match wins — Deezer first.
  if (dz?.confident && dzPlayable) return dz;
  if (it?.confident && itPlayable) return it;
  // 2) Any playable preview — prefer Deezer (MP3).
  if (dzPlayable) return dz;
  if (itPlayable) return it;
  // 3) Nothing playable — return whatever has artwork (Deezer first).
  return dz ?? it ?? null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "").trim();
  const artist = (searchParams.get("artist") || "").trim();
  if (!title) return NextResponse.json({ track: null });

  const [dz, it] = await Promise.all([
    getDeezerPreview(title, artist),
    getItunesPreview(title, artist),
  ]);

  const best = pickBest(dz, it);
  // Stream the preview through our own origin for reliable same-origin playback.
  const track =
    best && best.previewUrl
      ? { ...best, previewUrl: `/api/preview/audio?src=${encodeURIComponent(best.previewUrl)}` }
      : best;

  return NextResponse.json({ track });
}
