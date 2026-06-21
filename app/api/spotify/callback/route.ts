// GET /api/spotify/callback — finish the Spotify user OAuth. Verifies the CSRF
// state, exchanges the code for tokens, stores them in httpOnly cookies, and
// returns to the app. The refresh token never reaches the browser.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCode,
  getOrigin,
  cookieOpts,
  COOKIE_STATE,
  COOKIE_REFRESH,
  COOKIE_ACCESS,
  COOKIE_EXP,
} from "@/lib/api/spotifyUser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = getOrigin(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = cookies().get(COOKIE_STATE)?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/?spotify=${reason}`);

  if (url.searchParams.get("error")) return fail("denied");
  if (!code || !state || !saved || state !== saved) return fail("error");

  const tok = await exchangeCode(code, origin);
  if (!tok?.access_token || !tok.refresh_token) return fail("error");

  const res = NextResponse.redirect(`${origin}/?spotify=connected`);
  res.cookies.set(COOKIE_REFRESH, tok.refresh_token, cookieOpts(60 * 60 * 24 * 30));
  res.cookies.set(COOKIE_ACCESS, tok.access_token, cookieOpts(tok.expires_in));
  res.cookies.set(
    COOKIE_EXP,
    String(Date.now() + tok.expires_in * 1000),
    cookieOpts(60 * 60 * 24 * 30),
  );
  res.cookies.delete(COOKIE_STATE);
  return res;
}
