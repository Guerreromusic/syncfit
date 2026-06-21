// POST /api/world-intelligence — unified geo influence + audience demographics in
// one AI call, with rich per-territory detail (religion, age skew, top brands,
// sync competitors, market notes). Anchored on Musixmatch language + genre.
import { NextResponse } from "next/server";
import { runWorldIntelligence, OpenRouterNotConfiguredError } from "@/lib/api/openrouter";
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

  // Anchor on REAL Musixmatch metadata: when language/genre weren't passed in,
  // pull them from Musixmatch so the intelligence is driven by catalogue data.
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
    const result = await runWorldIntelligence({
      title: body.title,
      artist: body.artist || "",
      language,
      genre,
      model: body.model,
    });
    return NextResponse.json({ available: result.regions.length > 0, ...result });
  } catch (err) {
    if (err instanceof OpenRouterNotConfiguredError) {
      return NextResponse.json({ available: false });
    }
    return NextResponse.json({ available: false });
  }
}
