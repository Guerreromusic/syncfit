// GET  /api/tts  → { configured } so the UI can show/hide the Read-aloud button.
// POST /api/tts  → body { text, voiceId? } → streams synthesized MP3 (ElevenLabs).
// The API key stays server-side; only the audio comes back to the browser.
import { NextResponse } from "next/server";
import { isConfigured } from "@/lib/env";
import {
  synthesizeSpeech,
  ElevenLabsNotConfiguredError,
} from "@/lib/api/elevenlabs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ configured: isConfigured.elevenlabs() });
}

export async function POST(req: Request) {
  if (!isConfigured.elevenlabs()) {
    return NextResponse.json(
      { error: "Text-to-speech isn’t configured — add an ElevenLabs key." },
      { status: 503 },
    );
  }

  let body: { text?: unknown; voiceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Nothing to read." }, { status: 400 });
  }
  const voiceId = typeof body.voiceId === "string" ? body.voiceId : undefined;

  try {
    const upstream = await synthesizeSpeech({ text, voiceId });
    if (!upstream.ok || !upstream.body) {
      // Log server-side; return a generic message (don't leak the provider body).
      console.error("[/api/tts] ElevenLabs HTTP", upstream.status);
      return NextResponse.json(
        { error: "Couldn’t generate audio — please try again." },
        { status: 502 },
      );
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || "audio/mpeg",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ElevenLabsNotConfiguredError) {
      return NextResponse.json(
        { error: "Text-to-speech isn’t configured." },
        { status: 503 },
      );
    }
    console.error("[/api/tts] synth failed:", err);
    return NextResponse.json(
      { error: "Couldn’t generate audio — please try again." },
      { status: 502 },
    );
  }
}
