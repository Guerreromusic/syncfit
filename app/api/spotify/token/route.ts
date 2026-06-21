// GET /api/spotify/token — the browser's source of a fresh user ACCESS token for
// the Web Playback SDK. Reads the httpOnly cookies, refreshing when expired.
// Returns { connected, configured, accessToken?, expiresIn? }. Never exposes the
// refresh token or the client secret.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isConfigured } from "@/lib/env";
import {
  refreshAccess,
  cookieOpts,
  COOKIE_REFRESH,
  COOKIE_ACCESS,
  COOKIE_EXP,
} from "@/lib/api/spotifyUser";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured.spotify()) {
    return NextResponse.json({ connected: false, configured: false });
  }
  const store = cookies();
  const refresh = store.get(COOKIE_REFRESH)?.value;
  if (!refresh) return NextResponse.json({ connected: true, configured: true, hasSession: false });

  const access = store.get(COOKIE_ACCESS)?.value;
  const exp = Number(store.get(COOKIE_EXP)?.value || 0);
  if (access && Date.now() < exp - 30_000) {
    return NextResponse.json({
      connected: true,
      configured: true,
      hasSession: true,
      accessToken: access,
      expiresIn: Math.floor((exp - Date.now()) / 1000),
    });
  }

  const t = await refreshAccess(refresh);
  if (!t?.access_token) {
    // Refresh failed (revoked / expired) — clear the session.
    const res = NextResponse.json({ connected: true, configured: true, hasSession: false });
    res.cookies.delete(COOKIE_REFRESH);
    res.cookies.delete(COOKIE_ACCESS);
    res.cookies.delete(COOKIE_EXP);
    return res;
  }

  const res = NextResponse.json({
    connected: true,
    configured: true,
    hasSession: true,
    accessToken: t.access_token,
    expiresIn: t.expires_in,
  });
  res.cookies.set(COOKIE_ACCESS, t.access_token, cookieOpts(t.expires_in));
  res.cookies.set(
    COOKIE_EXP,
    String(Date.now() + t.expires_in * 1000),
    cookieOpts(60 * 60 * 24 * 30),
  );
  if (t.refresh_token) {
    res.cookies.set(COOKIE_REFRESH, t.refresh_token, cookieOpts(60 * 60 * 24 * 30));
  }
  return res;
}
