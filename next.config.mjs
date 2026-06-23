/** @type {import('next').NextConfig} */

// Baseline security headers. CSP is intentionally permissive enough not to break
// Next.js (it needs inline/eval for its runtime in dev), while still constraining
// where data can be sent/framed. connect-src allows the server-side providers'
// origins (calls are server-to-server, but this keeps the policy explicit) plus
// 'self' for the app's own API routes.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Allow the microphone for same-origin so the Research console can use
    // browser speech-to-text (dictate a brief). Camera/geolocation stay off.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      // Allow remote cover artwork (Spotify/Songstats CDNs) over https.
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // The in-app player streams 30s previews through our own origin (/api/preview/audio).
      "media-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://api.musixmatch.com https://openrouter.ai https://api.songstats.com https://musicbrainz.org",
      // Allow the embedded Spotify 30s preview player + the YouTube demo video.
      "frame-src 'self' https://open.spotify.com https://www.youtube-nocookie.com",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Load mammoth from node_modules at runtime rather than bundling it. (unpdf is
  // bundle-friendly and serverless-ready, so it doesn't need externalizing.)
  experimental: {
    serverComponentsExternalPackages: ["mammoth"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
