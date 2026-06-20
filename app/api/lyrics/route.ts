// POST /api/lyrics — real-time SHORT lyric context + AI translation + brief keywords.
// COMPLIANCE: fetches only a SHORT Musixmatch snippet/context (never full lyrics),
// uses it in-memory to translate + highlight, and NEVER stores or commits it.
import { NextResponse } from "next/server";
import { getTrackLyricsContext } from "@/lib/api/musixmatch";
import { runLyricTranslation } from "@/lib/api/openrouter";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Musixmatch lyric fetch + LLM translation/analysis.

export async function POST(req: Request) {
  let body: { trackId?: string; brief?: string; target?: string; snippet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const trackId = (body.trackId || "").trim();
  if (!trackId) {
    return NextResponse.json({ available: false });
  }

  // Reuse the short context the client already holds (e.g. when only the target
  // language changed) so we don't re-pull the same Musixmatch snippet each time.
  // Still in-memory only, never stored — same compliance posture either way.
  let snippet: string | undefined =
    typeof body.snippet === "string" && body.snippet.trim()
      ? body.snippet
      : undefined;
  if (!snippet) {
    try {
      snippet = await getTrackLyricsContext(trackId);
    } catch {
      snippet = undefined;
    }
  }
  if (!snippet) {
    return NextResponse.json({ available: false });
  }

  // Translate, analyse the lyric, and explain brief-matching keywords (best-effort).
  let translation = "";
  let sourceLang = "Unknown";
  let keywords: string[] = [];
  let matches: { phrase: string; meaning: string; why: string }[] = [];
  let matchSummary = "";
  let mood = "";
  let themes: string[] = [];
  let analysis = "";
  try {
    const t = await runLyricTranslation({
      snippet,
      brief: body.brief || "",
      target: body.target || "English",
    });
    translation = t.translation;
    sourceLang = t.sourceLang;
    keywords = t.keywords;
    matches = t.matches;
    matchSummary = t.matchSummary;
    mood = t.mood;
    themes = t.themes;
    analysis = t.analysis;
  } catch {
    // No AI / failed — still return the original snippet (untranslated).
  }

  return NextResponse.json({
    available: true,
    snippet, // short context only, never full lyrics
    translation,
    sourceLang,
    keywords,
    matches,
    matchSummary,
    mood,
    themes,
    analysis,
  });
}
