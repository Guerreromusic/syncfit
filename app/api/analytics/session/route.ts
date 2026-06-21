import { NextRequest, NextResponse } from "next/server";
import { upsertSession, readAnalytics, isOnline } from "@/lib/analytics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// -----------------------------------------------------------------------------
// POST /api/analytics/session
// Body: { sessionId: string; path?: string; seconds?: number }
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { sessionId?: unknown; path?: unknown; seconds?: unknown };

    // Validate sessionId
    if (
      typeof body.sessionId !== "string" ||
      body.sessionId.trim().length === 0 ||
      body.sessionId.length > 100
    ) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const sessionId = body.sessionId.trim();
    const visitPath = typeof body.path === "string" ? body.path : undefined;
    const seconds = typeof body.seconds === "number" ? Math.floor(body.seconds) : 0;

    // Extract IP
    const realIp = req.headers.get("x-real-ip");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip =
      realIp?.trim() ||
      (forwardedFor ? forwardedFor.split(",")[0].trim() : "") ||
      "0.0.0.0";

    // Extract geo from Vercel headers
    const country = req.headers.get("x-vercel-ip-country") ?? "";
    const city = req.headers.get("x-vercel-ip-city") ?? "";

    const session = await upsertSession(sessionId, {
      ip,
      country,
      city,
      lastSeen: new Date().toISOString(),
      seconds,
      path: visitPath,
    });

    return NextResponse.json({
      ok: true,
      musicalName: session.musicalName,
      puzzlePieceIndex: session.puzzlePieceIndex,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// GET /api/analytics/session
// Returns: onlineCount, online[], recentSessions[]
// -----------------------------------------------------------------------------
export async function GET() {
  try {
    const store = await readAnalytics();
    const online = store.sessions.filter(isOnline);
    const recent = store.sessions.slice(0, 200);

    return NextResponse.json({
      onlineCount: online.length,
      online: online.map((s) => ({
        sessionId: s.sessionId,
        musicalName: s.musicalName,
        puzzlePieceIndex: s.puzzlePieceIndex,
        country: s.country,
        city: s.city,
        firstSeen: s.firstSeen,
        totalSeconds: s.totalSeconds,
      })),
      recentSessions: recent,
    });
  } catch {
    return NextResponse.json(
      { onlineCount: 0, online: [], recentSessions: [] },
      { status: 200 },
    );
  }
}
