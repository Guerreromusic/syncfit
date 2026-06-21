"use client";

import * as React from "react";
import { MegaphoneIcon, ShareIcon, CheckIcon, ArrowRightIcon } from "./icons";

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-4 w-4"} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

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
  trackTitle,
  artist,
  score,
  scoreLabel,
}: {
  /** POST endpoint that returns `{ token }`. */
  shareEndpoint: string;
  /** Path prefix the token is appended to, e.g. "/share/" or "/share/project/". */
  sharePrefix: string;
  initialToken?: string;
  label?: string;
  trackTitle?: string;
  artist?: string;
  score?: number;
  scoreLabel?: string;
}) {
  const [token, setToken] = React.useState<string | undefined>(initialToken);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");

  // Email sharing state
  const [showEmail, setShowEmail] = React.useState(false);
  const [emailTo, setEmailTo] = React.useState("");
  const [emailSending, setEmailSending] = React.useState(false);
  const [emailStatus, setEmailStatus] = React.useState<{ ok: boolean; msg: string } | null>(null);

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

  async function sendEmail() {
    if (!emailTo.includes("@")) {
      setEmailStatus({ ok: false, msg: "Please enter a valid email address." });
      return;
    }
    setEmailStatus(null);
    setEmailSending(true);
    try {
      const res = await fetch("/api/pitch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTo,
          url,
          trackTitle: trackTitle || label || "Track",
          artist: artist || "",
          score: score ?? 0,
          scoreLabel: scoreLabel || "",
        }),
      });
      const data: { ok: boolean; sent?: boolean; mailtoUrl?: string; error?: string } = await res.json();
      if (!data.ok) {
        setEmailStatus({ ok: false, msg: data.error || "Failed to send email." });
      } else if (data.sent) {
        setEmailStatus({ ok: true, msg: `Pitch sent to ${emailTo}!` });
      } else if (data.mailtoUrl) {
        window.open(data.mailtoUrl);
        setEmailStatus({ ok: true, msg: "Opening your mail app…" });
      }
    } catch (e) {
      setEmailStatus({ ok: false, msg: e instanceof Error ? e.message : "Failed to send email." });
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={share}
        disabled={loading}
        className="sf-btn-white w-full sm:w-auto"
      >
        <MegaphoneIcon className="h-4 w-4" aria-hidden />
        {loading ? "Creating link…" : url ? `${label} — copy link` : label}
      </button>

      {url && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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

          {/* Email sharing — inline collapsible */}
          {!showEmail ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="inline-flex w-fit items-center gap-1.5 text-xs text-soft transition hover:text-white"
            >
              <MailIcon className="h-4 w-4" />
              Email pitch
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
              <p className="mb-2 text-xs font-medium text-soft">Send pitch link via email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="sf-input flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={emailSending}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-purple-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-600 disabled:opacity-60"
                >
                  {emailSending ? "Sending…" : "Send"}
                </button>
              </div>
              {emailStatus && (
                <p className={`mt-2 text-xs ${emailStatus.ok ? "text-lime-300" : "text-red-300"}`}>
                  {emailStatus.msg}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
