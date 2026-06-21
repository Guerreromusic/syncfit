// POST /api/spotify/logout — disconnect Spotify by clearing the token cookies.
import { NextResponse } from "next/server";
import {
  COOKIE_REFRESH,
  COOKIE_ACCESS,
  COOKIE_EXP,
} from "@/lib/api/spotifyUser";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_REFRESH);
  res.cookies.delete(COOKIE_ACCESS);
  res.cookies.delete(COOKIE_EXP);
  return res;
}
