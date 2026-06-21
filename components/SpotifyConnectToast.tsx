"use client";

import * as React from "react";

/**
 * Shows the result of the Spotify OAuth round-trip. The callback redirects back
 * to `/?spotify=connected|error|denied`; this reads that (client-side, so no
 * Suspense boundary is needed), shows a toast, and strips the param. On failure
 * it explains the usual cause — the app is in Spotify "development mode", so the
 * account must be added under User Management and must be Premium.
 */
export function SpotifyConnectToast() {
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("spotify");
    if (!p) return;
    setStatus(p);
    const url = new URL(window.location.href);
    url.searchParams.delete("spotify");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    const t = setTimeout(() => setStatus(null), 15000);
    return () => clearTimeout(t);
  }, []);

  if (!status) return null;
  const ok = status === "connected";

  return (
    <div className="fixed inset-x-3 bottom-24 z-[120] mx-auto flex max-w-md items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md sm:left-auto sm:right-4 sm:mx-0"
      style={{
        background: ok ? "rgba(20,40,20,0.92)" : "rgba(40,20,20,0.92)",
        borderColor: ok ? "rgba(163,230,53,0.4)" : "rgba(248,113,113,0.4)",
      }}
      role="status"
    >
      <span className={"mt-0.5 text-lg " + (ok ? "text-lime-300" : "text-red-300")}>
        {ok ? "✓" : "!"}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        {ok ? (
          <p className="text-white">
            <span className="font-semibold">Spotify connected.</span> Tracks now play
            in full — tap play on any track.
          </p>
        ) : (
          <p className="text-white">
            <span className="font-semibold">Couldn’t connect Spotify.</span>{" "}
            <span className="text-soft">
              In your Spotify dashboard, add your account under{" "}
              <span className="text-white">User Management</span>, register the redirect
              URI, and use a <span className="text-white">Premium</span> account.
            </span>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setStatus(null)}
        aria-label="Dismiss"
        className="shrink-0 text-soft transition hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
