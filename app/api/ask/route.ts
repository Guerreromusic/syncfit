// POST /api/ask — per-card "Ask AI": answer a question about ONE track for sync.
// Body: { context: TrackQAContext; messages: TrackQAMessage[]; model?: string }
import { NextResponse } from "next/server";
import { runTrackQA, OpenRouterNotConfiguredError } from "@/lib/api/openrouter";
import type { TrackQAContext, TrackQAMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: {
    context?: TrackQAContext;
    messages?: TrackQAMessage[];
    model?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const context = body.context;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!context?.title || !context?.artist) {
    return NextResponse.json({ error: "Missing track context." }, { status: 400 });
  }
  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  try {
    const answer = await runTrackQA({ context, messages, model: body.model });
    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof OpenRouterNotConfiguredError) {
      return NextResponse.json(
        { error: "AI isn't configured — add an OpenRouter key to enable Ask AI." },
        { status: 503 },
      );
    }
    // Log the real error server-side; return a generic message so an upstream
    // provider payload (rate-limit/error body) never surfaces in the UI.
    console.error("[/api/ask] AI request failed:", err);
    return NextResponse.json(
      { error: "AI request failed — please try again." },
      { status: 502 },
    );
  }
}
