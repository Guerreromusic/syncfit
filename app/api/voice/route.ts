// GET /api/voice → mints a short-lived signed WebSocket URL for the SyncFit
// Conversational AI voice agent. The ElevenLabs key + agent id stay server-side;
// the browser only ever receives the signed URL (and a { configured } flag).
import { NextResponse } from "next/server";
import { env, isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured.voiceAgent()) {
    // Not an error — the UI uses this to hide the voice button gracefully.
    return NextResponse.json({ configured: false });
  }

  const agentId = env.elevenlabsAgentId();
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(
        agentId,
      )}`,
      { headers: { "xi-api-key": env.elevenlabs() }, cache: "no-store" },
    );
    if (!res.ok) {
      // Log server-side; return a generic message (don't leak the provider body).
      console.error("[/api/voice] get-signed-url HTTP", res.status);
      return NextResponse.json(
        { configured: true, error: "Couldn’t start the voice assistant." },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) {
      return NextResponse.json(
        { configured: true, error: "Couldn’t start the voice assistant." },
        { status: 502 },
      );
    }
    return NextResponse.json({ configured: true, signedUrl: data.signed_url });
  } catch (err) {
    console.error("[/api/voice] signed-url failed:", err);
    return NextResponse.json(
      { configured: true, error: "Couldn’t start the voice assistant." },
      { status: 502 },
    );
  }
}
