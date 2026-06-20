// POST /api/brand-dna — Brand DNA for a track: the brands + placements it fits.
// DATA: a SHORT Musixmatch lyric context (never full lyrics, never stored).
// ANALYSIS: OpenRouter turns that context + metadata into the recommendation.
import { NextResponse } from "next/server";
import { getTrackLyricsContext } from "@/lib/api/musixmatch";
import { runBrandDNA } from "@/lib/api/openrouter";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // LLM brand-DNA reasoning.

export async function POST(req: Request) {
  let body: { trackId?: string; title?: string; artist?: string; genre?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ available: false });
  }

  const trackId = (body.trackId || "").trim();
  const title = (body.title || "").trim();
  const artist = (body.artist || "").trim();
  if (!title) return NextResponse.json({ available: false });

  // Short lyric context from Musixmatch — used in-memory only, never stored.
  let snippet: string | undefined;
  try {
    snippet = trackId ? await getTrackLyricsContext(trackId) : undefined;
  } catch {
    snippet = undefined;
  }

  try {
    const dna = await runBrandDNA({
      title,
      artist,
      genre: body.genre,
      snippet,
    });
    if (!dna.brands.length && !dna.uses.length) {
      return NextResponse.json({ available: false });
    }
    return NextResponse.json({ available: true, ...dna });
  } catch {
    return NextResponse.json({ available: false });
  }
}
