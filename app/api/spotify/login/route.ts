// GET /api/spotify/login — start the Spotify user OAuth (full-track playback).
// Redirects to Spotify's consent screen; the callback finishes the exchange.
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isConfigured } from "@/lib/env";
import {
  authorizeUrl,
  getOrigin,
  cookieOpts,
  COOKIE_STATE,
} from "@/lib/api/spotifyUser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isConfigured.spotify()) {
    return NextResponse.json(
      { error: "Spotify isn’t configured on this deployment." },
      { status: 503 },
    );
  }
  const origin = getOrigin(req);
  const state = randomBytes(8).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(origin, state));
  res.cookies.set(COOKIE_STATE, state, cookieOpts(600));
  return res;
}
