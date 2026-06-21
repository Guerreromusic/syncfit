// =============================================================================
// SyncFit by Synclat — Spotify USER auth (Authorization Code flow)
// =============================================================================
// Streaming FULL tracks through the Web Playback SDK requires a logged-in
// Spotify PREMIUM user token carrying the `streaming` scope — distinct from the
// app-level Client Credentials in spotify.ts (which can't stream).
//
// SECURITY: the long-lived refresh token stays in an httpOnly cookie and never
// reaches the browser. Only short-lived ACCESS tokens are handed to the client
// (the SDK requires one in-page) via /api/spotify/token. The client SECRET is
// only ever used server-side here.
// =============================================================================

import { env } from "../env";
import { fetchWithTimeout } from "../fetchWithTimeout";

export const SP_SCOPES = "streaming user-read-email user-read-private";

export const COOKIE_REFRESH = "sp_refresh";
export const COOKIE_ACCESS = "sp_access";
export const COOKIE_EXP = "sp_exp";
export const COOKIE_STATE = "sp_oauth_state";

const TOKEN_URL = "https://accounts.spotify.com/api/token";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

function basicAuth(): string {
  return Buffer.from(
    `${env.spotifyClientId()}:${env.spotifyClientSecret()}`,
  ).toString("base64");
}

/** The app origin as seen by the public request (proxy-aware), e.g. for Vercel. */
export function getOrigin(req: Request): string {
  const h = (k: string) => req.headers.get(k) || "";
  const host = h("x-forwarded-host") || h("host") || new URL(req.url).host;
  const proto =
    h("x-forwarded-proto") ||
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/** The redirect URI — must EXACTLY match one registered in the Spotify app. */
export function redirectUri(origin: string): string {
  return `${origin}/api/spotify/callback`;
}

export function authorizeUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: env.spotifyClientId(),
    scope: SP_SCOPES,
    redirect_uri: redirectUri(origin),
    state,
  });
  return `https://accounts.spotify.com/authorize?${p.toString()}`;
}

export async function exchangeCode(
  code: string,
  origin: string,
): Promise<TokenResponse | null> {
  try {
    const res = await fetchWithTimeout(
      TOKEN_URL,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Basic ${basicAuth()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri(origin),
        }).toString(),
      },
      8000,
    );
    if (!res.ok) return null;
    return (await res.json()) as TokenResponse;
  } catch {
    return null;
  }
}

export async function refreshAccess(
  refreshToken: string,
): Promise<TokenResponse | null> {
  try {
    const res = await fetchWithTimeout(
      TOKEN_URL,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Basic ${basicAuth()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      },
      8000,
    );
    if (!res.ok) return null;
    return (await res.json()) as TokenResponse;
  } catch {
    return null;
  }
}

/** Shared cookie options. `secure` is on in production (https) only. */
export function cookieOpts(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
