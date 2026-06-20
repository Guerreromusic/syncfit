// POST /api/geo-influence — where a track resonates worldwide + why, anchored on
// its language (Musixmatch) and reasoned by the AI model.
import { NextResponse } from "next/server";
import { runGeoInfluence, OpenRouterNotConfiguredError } from "@/lib/api/openrouter";

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

  try {
    const geo = await runGeoInfluence({
      title: body.title,
      artist: body.artist || "",
      language: body.language,
      genre: body.genre,
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
