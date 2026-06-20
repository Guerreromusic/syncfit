// POST /api/section-chat — the per-section assistant. Answers questions about
// whatever section the user is on. Body: { section, context, messages, model? }.
import { NextResponse } from "next/server";
import { runSectionChat, OpenRouterNotConfiguredError } from "@/lib/api/openrouter";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: {
    section?: unknown;
    context?: unknown;
    messages?: unknown;
    model?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const section = typeof body.section === "string" ? body.section : "this section";
  const context = typeof body.context === "string" ? body.context : "";
  const messages: Msg[] = Array.isArray(body.messages)
    ? body.messages.filter(
        (m): m is Msg =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
    : [];
  const model = typeof body.model === "string" ? body.model : undefined;

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }

  try {
    const answer = await runSectionChat({ section, context, messages, model });
    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof OpenRouterNotConfiguredError) {
      return NextResponse.json(
        { error: "The assistant isn’t configured — add an OpenRouter key to enable it." },
        { status: 503 },
      );
    }
    const msg = err instanceof Error ? err.message : "Assistant request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
