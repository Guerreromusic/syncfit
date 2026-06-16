// POST /api/lyrics — real-time SHORT lyric context + AI translation + brief keywords.
// COMPLIANCE: fetches only a SHORT Musixmatch snippet/context (never full lyrics),
// uses it in-memory to translate + highlight, and NEVER stores or commits it.
import { NextResponse } from "next/server";
import { getTrackLyricsContext } from "@/lib/api/musixmatch";
import { runLyricTranslation } from "@/lib/api/openrouter";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { trackId?: string; brief?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const trackId = (body.trackId || "").trim();
  if (!trackId) {
    return NextResponse.json({ available: false });
  }

  let snippet: string | undefined;
  try {
    snippet = await getTrackLyricsContext(trackId);
  } catch {
    snippet = undefined;
  }
  if (!snippet) {
    return NextResponse.json({ available: false });
  }

  // Translate + extract brief-matching keywords (best-effort).
  let translation = "";
  let sourceLang = "Unknown";
  let keywords: string[] = [];
  try {
    const t = await runLyricTranslation({
      snippet,
      brief: body.brief || "",
      target: body.target || "English",
    });
    translation = t.translation;
    sourceLang = t.sourceLang;
    keywords = t.keywords;
  } catch {
    // No AI / failed — still return the original snippet (untranslated).
  }

  return NextResponse.json({
    available: true,
    snippet, // short context only, never full lyrics
    translation,
    sourceLang,
    keywords,
  });
}
