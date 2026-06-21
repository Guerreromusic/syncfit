import { ApiStatusPanel } from "@/components/ApiStatusBadge";

export const metadata = {
  title: "Settings — SyncFit by Synclat",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="sf-eyebrow">Settings</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Connections</h1>
        <p className="mt-1 text-sm text-soft">
          What SyncFit connects to and how it handles your data. Keys are read
          server-side from <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">.env.local</code> and
          are never exposed to the browser. Previews, credits and brand logos are
          keyless — SyncFit runs fully in demo mode with no keys at all.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <ApiStatusPanel />

        <div className="sf-card sf-card-pad">
          <p className="sf-eyebrow">Data &amp; compliance</p>
          <h2 className="mt-1 text-sm font-semibold text-white">
            What SyncFit stores
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-soft">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
              Real-time music data only — full lyrics are never stored, cached, or
              displayed.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
              Saved reports keep only your brief, basic track metadata, and
              Synclat-generated scores &amp; summaries.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
              Brand logos use only the public brand domain from your brief (e.g.
              <code className="mx-1 rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">nike.com</code>)
              to fetch a public icon — no personal data.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
              API keys live in <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">.env.local</code>{" "}
              (gitignored) and only ever run on the server.
            </li>
          </ul>

          <p className="sf-eyebrow mt-6">Configure keys</p>
          <p className="mt-2 text-sm leading-relaxed text-soft">
            Locally, add keys to <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">.env.local</code> at the
            project root and restart the dev server; in production, set them as
            your host&rsquo;s environment variables and redeploy. The status badges
            refresh on the next load. SyncFit runs fully in demo mode with no keys
            at all.
          </p>
        </div>
      </div>

      {/* Playback & voice */}
      <div className="sf-card sf-card-pad">
        <p className="sf-eyebrow">Playback &amp; voice</p>
        <h2 className="mt-1 text-sm font-semibold text-white">
          Full-track playback &amp; the voice Agent
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-soft">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
            <span>
              <span className="font-semibold text-white">Spotify (full tracks)</span> — connect a
              Spotify <span className="text-white">Premium</span> account to play tracks in full in
              the footer player. Without it, tracks play as a keyless 30s preview.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
            <span>
              <span className="font-semibold text-white">Deezer</span> — keyless 30s previews, no
              account needed (Apple Music is not used).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
            <span>
              <span className="font-semibold text-white">ElevenLabs</span> — narrates pitches &amp;
              results aloud and powers the hands-free Agent.
            </span>
          </li>
        </ul>
        <div className="mt-4">
          <a href="/api/spotify/login" className="sf-btn-white inline-flex w-fit">
            Connect Spotify Premium
          </a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-soft">
          Full playback needs Spotify Premium. In your Spotify Developer dashboard, add this
          redirect URI to the app first:{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">
            https://syncfit-fawn.vercel.app/api/spotify/callback
          </code>
          . Then add your Spotify account under{" "}
          <span className="text-white">User Management</span> (the app runs in Spotify
          development mode) and use a Premium account.
        </p>
      </div>

      {/* Architecture */}
      <div className="sf-card sf-card-pad">
        <p className="sf-eyebrow">Architecture</p>
        <h2 className="mt-1 text-sm font-semibold text-white">How SyncFit is built</h2>
        <ul className="mt-3 space-y-2 text-sm text-soft">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
            Next.js 14 (App Router) on Vercel — every provider is called from a
            server route, so keys never reach the browser.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
            <span>
              <span className="text-white">Research:</span> OpenRouter (GPT‑5 mini)
              proposes tracks → Musixmatch verifies + adds metadata → Spotify supplies
              album art → re‑ranked on real data. Real tracks only — no demo fallback.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
            <span>
              <span className="text-white">Reports</span> add Songstats market signal,
              MusicBrainz credits, and an AI worldwide‑influence map anchored on the
              Musixmatch language.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
            <span>
              <span className="text-white">Voice:</span> ElevenLabs — read‑aloud (TTS
              streamed through our origin) and the hands‑free Agent (Conversational AI
              over a signed WebSocket).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
            <span>
              <span className="text-white">Playback:</span> Spotify Web Playback SDK for
              full tracks (Premium) with a keyless Deezer 30s preview fallback.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
            <span>
              <span className="text-white">Storage:</span> saved reports & projects in
              Vercel Blob; starred tracks live in your browser (localStorage).
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
