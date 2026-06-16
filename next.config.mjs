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
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
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
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https://api.musixmatch.com https://openrouter.ai https://api.songstats.com https://www.lalal.ai",
      // Allow the embedded Spotify 30s preview player.
      "frame-src 'self' https://open.spotify.com",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
