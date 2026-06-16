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
          API connection status and how SyncFit handles your data. Keys are read
          server-side from <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">.env.local</code> and
          are never exposed to the browser.
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
              API keys live in <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">.env.local</code>{" "}
              (gitignored) and only ever run on the server.
            </li>
          </ul>

          <p className="sf-eyebrow mt-6">Configure keys</p>
          <p className="mt-2 text-sm leading-relaxed text-soft">
            Add or update keys in <code className="rounded bg-ink-800 px-1.5 py-0.5 text-purple-100">.env.local</code> at the
            project root, then restart the dev server. The status badges refresh
            on the next load. SyncFit runs fully in demo mode with no keys at all.
          </p>
        </div>
      </div>
    </div>
  );
}
