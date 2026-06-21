// POST /api/demographics — aggregate LISTENER demographics (ages, cultural/faith
// resonance, appeal) for a track. ANCHORED on the real Musixmatch language/genre
// (looked up here when not supplied), then reasoned by the AI model (OpenRouter).
import { NextResponse } from "next/server";
import { runDemographics, OpenRouterNotConfiguredError } from "@/lib/api/openrouter";
import { searchTrack } from "@/lib/api/musixmatch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: {
    title?: string;
    artist?: string;
    language?: string;
    genre?: string;
    model?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ available: false });
  }

  // Anchor on REAL Musixmatch metadata when the caller didn't pass it.
  let language = body.language;
  let genre = body.genre;
  if (!language || !genre) {
    try {
      const { tracks, demo } = await searchTrack({
        title: body.title,
        artist: body.artist || "",
      });
      if (!demo && tracks.length) {
        const m = tracks[0];
        language = language || m.language;
        genre = genre || m.genre;
      }
    } catch {
      /* Musixmatch unavailable — use whatever the caller provided */
    }
  }

  try {
    const demographics = await runDemographics({
      title: body.title,
      artist: body.artist || "",
      language,
      genre,
      model: body.model,
    });
    const available = demographics.ageBands.length > 0 || demographics.appeal.length > 0;
    return NextResponse.json({ available, ...demographics });
  } catch (err) {
    if (err instanceof OpenRouterNotConfiguredError) {
      return NextResponse.json({ available: false });
    }
    return NextResponse.json({ available: false });
  }
}
