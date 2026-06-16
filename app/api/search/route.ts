// POST /api/search — Musixmatch track search (or demo tracks when no key).
// Body: { title?: string; artist?: string }
import { NextResponse } from "next/server";
import { searchTrack } from "@/lib/api/musixmatch";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { title?: string; artist?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = (body.title || "").trim();
  const artist = (body.artist || "").trim();

  if (!title && !artist) {
    return NextResponse.json(
      { error: "Enter a song title or artist to search." },
      { status: 400 },
    );
  }

  try {
    const { tracks, demo } = await searchTrack({ title, artist });
    if (!tracks.length) {
      return NextResponse.json(
        { tracks: [], demo, error: "No tracks found. Try a different title or artist." },
        { status: 200 },
      );
    }
    // COMPLIANCE: never send lyric context over the wire. Strip it so the
    // search response is a ClientTrack[] (the field is re-hydrated server-side
    // for demo tracks at analyze time).
    const clientTracks = tracks.map((t) => {
      const c = { ...t };
      delete (c as { lyricsContext?: string }).lyricsContext;
      return c;
    });
    return NextResponse.json({ tracks: clientTracks, demo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json(
      { error: `Musixmatch search error: ${message}` },
      { status: 502 },
    );
  }
}
