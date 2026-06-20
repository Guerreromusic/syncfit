"use client";

import * as React from "react";
import { MegaphoneIcon, ShareIcon, CheckIcon, ArrowRightIcon } from "./icons";

/**
 * Mints (or reuses) a public share token via `shareEndpoint`, copies the public
 * link (`origin + sharePrefix + token`) to the clipboard, and shows it for
 * manual copy/open. Used for both single-report pitches and pitch projects.
 */
export function ShareButton({
  shareEndpoint,
  sharePrefix,
  initialToken,
  label = "Share",
}: {
  /** POST endpoint that returns `{ token }`. */
  shareEndpoint: string;
  /** Path prefix the token is appended to, e.g. "/share/" or "/share/project/". */
  sharePrefix: string;
  initialToken?: string;
  label?: string;
}) {
  const [token, setToken] = React.useState<string | undefined>(initialToken);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const url = token && origin ? `${origin}${sharePrefix}${token}` : "";

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — the field below lets the user copy manually */
    }
  }

  async function share() {
    setError(null);
    let t = token;
    if (!t) {
      setLoading(true);
      try {
        const res = await fetch(shareEndpoint, { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error(data.error || "Could not create the share link.");
        }
        t = data.token as string;
        setToken(t);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create the share link.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (origin && t) await copy(`${origin}${sharePrefix}${t}`);
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={share}
        disabled={loading}
        className="sf-btn-primary w-full sm:w-auto"
      >
        <MegaphoneIcon className="h-4 w-4" aria-hidden />
        {loading ? "Creating link…" : url ? `${label} — copy link` : label}
      </button>

      {url && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2">
            <ShareIcon className="h-4 w-4 shrink-0 text-purple-300" aria-hidden />
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-xs text-soft outline-none"
              aria-label="Public share link"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => copy(url)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-lime-400" aria-hidden />
                  Copied
                </>
              ) : (
                "Copy"
              )}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
            >
              Open
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
