// GET /api/voice → credentials for the SyncFit Conversational AI voice agent.
// Returns BOTH a WebRTC conversation token (primary — far more firewall-friendly
// than a raw WebSocket) and a signed WebSocket URL (fallback). The ElevenLabs key
// + agent id stay server-side; the browser only receives short-lived creds.
import { NextResponse } from "next/server";
import { env, isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const CONVAI = "https://api.elevenlabs.io/v1/convai/conversation";

export async function GET() {
  if (!isConfigured.voiceAgent()) {
    // Not an error — the UI uses this to hide the voice button gracefully.
    return NextResponse.json({ configured: false });
  }

  const agentId = env.elevenlabsAgentId();
  const headers = { "xi-api-key": env.elevenlabs() };
  const q = `agent_id=${encodeURIComponent(agentId)}`;

  try {
    const [tokenRes, urlRes] = await Promise.all([
      fetch(`${CONVAI}/token?${q}`, { headers, cache: "no-store" }).catch(() => null),
      fetch(`${CONVAI}/get-signed-url?${q}`, { headers, cache: "no-store" }).catch(() => null),
    ]);

    const conversationToken =
      tokenRes && tokenRes.ok
        ? ((await tokenRes.json()) as { token?: string }).token ?? null
        : null;
    const signedUrl =
      urlRes && urlRes.ok
        ? ((await urlRes.json()) as { signed_url?: string }).signed_url ?? null
        : null;

    if (!conversationToken && !signedUrl) {
      console.error(
        "[/api/voice] token+signed-url failed",
        tokenRes?.status,
        urlRes?.status,
      );
      return NextResponse.json(
        { configured: true, error: "Couldn’t start the voice assistant." },
        { status: 502 },
      );
    }

    return NextResponse.json({ configured: true, conversationToken, signedUrl });
  } catch (err) {
    console.error("[/api/voice] creds failed:", err);
    return NextResponse.json(
      { configured: true, error: "Couldn’t start the voice assistant." },
      { status: 502 },
    );
  }
}
