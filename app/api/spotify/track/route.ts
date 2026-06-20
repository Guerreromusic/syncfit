// GET /api/spotify/track?id= — full track detail (preview URL + artwork +
// metadata) for the in-app footer music player. Returns { track: null } when
// Spotify isn't configured or the track isn't found.
import { NextResponse } from "next/server";
import { getSpotifyTrackById } from "@/lib/api/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ track: null });
  const track = await getSpotifyTrackById(id);
  return NextResponse.json({ track });
}
