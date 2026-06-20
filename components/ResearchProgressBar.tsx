"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useResearch } from "./ResearchContext";

// Research has no real % (one long request), so the bar eases toward ~92% over a
// typical run, then snaps to 100% on completion — a clear, honest minimal bar.
const ESTIMATE_MS = 26000;

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
}

/**
 * Always-on-screen research indicator (rendered in the root layout): a slim top
 * progress bar + a floating chip while research runs in the background, then a
 * completion toast prompting the user to view results — on whatever page they're on.
 */
export function ResearchProgressBar() {
  const research = useResearch();
  const router = useRouter();
  const [elapsed, setElapsed] = React.useState(0);

  const running = research.status === "running";

  React.useEffect(() => {
    if (!running) return;
    const start = research.startedAt ?? Date.now();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [running, research.startedAt]);

  // Ask for notification permission the first time the user runs research.
  React.useEffect(() => {
    if (
      running &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, [running]);

  const pct = running
    ? Math.min(92, (elapsed / ESTIMATE_MS) * 100)
    : research.status === "done"
      ? 100
      : 0;

  const showToast =
    (research.status === "done" || research.status === "error") && research.unseen;

  function viewResults() {
    research.acknowledge();
    router.push("/analyzer");
  }

  if (!running && !showToast) return null;

  return (
    <>
      {/* Slim top progress bar while running */}
      {running && (
        <div className="fixed inset-x-0 top-0 z-[70] h-[3px] bg-white/5">
          <div
            className="h-full rounded-r-full bg-lime-400 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Floating chip / completion toast — top-right, clears the topbar + footer player */}
      <div className="fixed right-4 top-16 z-[60] max-w-[calc(100vw-2rem)] animate-sf-fade">
        {running ? (
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-ink-900/90 px-3.5 py-2 shadow-lg backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-400" />
            </span>
            <span className="truncate text-xs font-medium text-white">
              Researching
              {research.query ? (
                <span className="text-soft"> · {truncate(research.query, 32)}</span>
              ) : (
                ""
              )}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-soft">{fmt(elapsed)}</span>
          </div>
        ) : showToast && research.status === "done" ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/20 text-lime-300">
              <CheckIcon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Research complete</p>
              <p className="truncate text-xs text-soft">
                {research.mode === "discover"
                  ? `${research.discover?.tracks.length ?? 0} tracks ready`
                  : "Track scored"}
                {research.query ? ` · ${truncate(research.query, 26)}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={viewResults}
              className="shrink-0 rounded-full bg-lime-400 px-3 py-1.5 text-xs font-semibold text-ink-950 transition hover:brightness-110"
            >
              View
            </button>
            <button
              type="button"
              onClick={research.acknowledge}
              aria-label="Dismiss"
              className="shrink-0 text-soft transition hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
        ) : showToast ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-ink-900/95 px-4 py-3 shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300">
              !
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Research didn’t finish</p>
              <p className="truncate text-xs text-soft">{research.error}</p>
            </div>
            <button
              type="button"
              onClick={research.acknowledge}
              aria-label="Dismiss"
              className="shrink-0 text-soft transition hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
