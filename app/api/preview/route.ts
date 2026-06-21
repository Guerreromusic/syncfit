// GET /api/preview?title=&artist= — keyless 30s preview + artwork for the in-app
// footer player, resolved via Deezer (real masters, MP3 that decodes in every
// browser). Apple Music / iTunes is intentionally NOT used for playback — full
// tracks play through Spotify (Web Playback SDK), with this Deezer preview as the
// keyless fallback. Returns { track: null } when nothing is found.
import { NextResponse } from "next/server";
import { getDeezerPreview } from "@/lib/api/deezer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "").trim();
  const artist = (searchParams.get("artist") || "").trim();
  if (!title) return NextResponse.json({ track: null });

  const best = await getDeezerPreview(title, artist);
  // Stream the preview through our own origin for reliable same-origin playback.
  const track =
    best && best.previewUrl
      ? { ...best, previewUrl: `/api/preview/audio?src=${encodeURIComponent(best.previewUrl)}` }
      : best;

  return NextResponse.json({ track });
}
