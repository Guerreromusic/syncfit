// GET /api/spotify?title=&artist= — resolve a Spotify track id (via Songstats)
// so any track in the app can be played through the keyless Spotify embed.
import { NextResponse } from "next/server";
import { resolveSpotifyId } from "@/lib/api/songstats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "").trim();
  const artist = (searchParams.get("artist") || "").trim();
  if (!title) return NextResponse.json({ spotifyId: null });
  const spotifyId = await resolveSpotifyId(title, artist);
  return NextResponse.json({ spotifyId });
}
