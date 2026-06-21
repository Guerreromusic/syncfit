// GET /api/spotify/uri?id=&title=&artist= — resolve a Spotify track URI for the
// Web Playback SDK. Uses a known id when given, else searches by title/artist.
import { NextResponse } from "next/server";
import { searchSpotifyTrackUri } from "@/lib/api/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (/^[A-Za-z0-9]{22}$/.test(id)) {
    return NextResponse.json({ uri: `spotify:track:${id}` });
  }
  const title = (searchParams.get("title") || "").trim();
  const artist = (searchParams.get("artist") || "").trim();
  if (!title) return NextResponse.json({ uri: null });
  const uri = await searchSpotifyTrackUri(title, artist);
  return NextResponse.json({ uri });
}
