// GET /api/preview/audio?src=<encoded preview url>
// Streams a 30s preview (Deezer / iTunes) through our own origin so the in-app
// player loads audio same-origin — sidestepping expiring-token/referer quirks and
// making playback reliable everywhere. Host-allowlisted (no open proxy) and
// forwards Range requests so the scrubber can seek.
import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Only the keyless preview CDNs we actually resolve from.
const ALLOWED_HOSTS = [
  /(^|\.)dzcdn\.net$/, // Deezer previews
  /(^|\.)mzstatic\.com$/, // iTunes artwork/audio
  /(^|\.)apple\.com$/, // audio-ssl.itunes.apple.com
];

function hostAllowed(u: URL): boolean {
  return u.protocol === "https:" && ALLOWED_HOSTS.some((re) => re.test(u.hostname));
}

/**
 * Fetch following redirects MANUALLY, re-validating the host on every hop so a
 * redirect from an allowed CDN can't be used to reach an internal/forbidden host
 * (SSRF). Returns null if any hop is disallowed or the redirect chain is too long.
 */
async function fetchAllowed(
  startUrl: URL,
  range: string | undefined,
  maxHops = 4,
): Promise<Response | null> {
  let url = startUrl;
  for (let hop = 0; hop < maxHops; hop++) {
    if (!hostAllowed(url)) return null;
    // 12s to establish the response; the timer clears once headers arrive so the
    // body stream itself is never aborted mid-playback.
    const res = await fetchWithTimeout(
      url.toString(),
      {
        headers: range ? { Range: range } : {},
        cache: "no-store",
        redirect: "manual",
      },
      12000,
    );
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      try {
        url = new URL(loc, url); // resolve relative redirects, re-validate next loop
      } catch {
        return null;
      }
      continue;
    }
    return res;
  }
  return null; // too many redirects
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("src");
  if (!src) return new NextResponse("missing src", { status: 400 });

  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return new NextResponse("bad src", { status: 400 });
  }
  if (!hostAllowed(u)) {
    return new NextResponse("forbidden host", { status: 403 });
  }

  const range = req.headers.get("range") ?? undefined;
  let upstream: Response | null;
  try {
    upstream = await fetchAllowed(u, range);
  } catch {
    return new NextResponse("upstream fetch failed", { status: 502 });
  }
  if (!upstream || (!upstream.ok && upstream.status !== 206)) {
    return new NextResponse("upstream error", { status: 502 });
  }

  const headers = new Headers();
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("content-type")) headers.set("content-type", "audio/mpeg");
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  // Only cache full 200 bodies. A 206 is specific to its requested byte range, so
  // caching it publicly could serve a mismatched partial range to a later seek.
  if (upstream.status === 206) {
    headers.set("cache-control", "no-store");
    headers.set("vary", "range");
  } else {
    headers.set("cache-control", "public, max-age=3600");
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
