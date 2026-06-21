// POST /api/geo-influence — where a track resonates worldwide + why. The map is
// ANCHORED on the track's real language + genre from Musixmatch (looked up here
// when the caller doesn't pass them), then reasoned into regions by the AI model.
import { NextResponse } from "next/server";
import { runGeoInfluence, OpenRouterNotConfiguredError } from "@/lib/api/openrouter";
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

  // Anchor on REAL Musixmatch metadata: when the language/genre weren't passed in,
  // pull them from Musixmatch so the map is driven by catalogue data, not a guess.
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
      /* Musixmatch unavailable — fall back to whatever the caller provided */
    }
  }

  try {
    const geo = await runGeoInfluence({
      title: body.title,
      artist: body.artist || "",
      language,
      genre,
      model: body.model,
    });
    return NextResponse.json({ available: geo.regions.length > 0, ...geo });
  } catch (err) {
    if (err instanceof OpenRouterNotConfiguredError) {
      return NextResponse.json({ available: false });
    }
    return NextResponse.json({ available: false });
  }
}
