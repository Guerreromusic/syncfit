"use client";

import * as React from "react";
import type { ApiStatus, ApiStatusState } from "@/lib/types";

const STATE_STYLES: Record<
  ApiStatusState,
  { dot: string; text: string; ring: string; chip: string }
> = {
  connected: {
    dot: "bg-lime-400",
    text: "text-lime-300",
    ring: "ring-lime-500/30",
    chip: "Connected",
  },
  missing: {
    dot: "bg-red-400",
    text: "text-red-300",
    ring: "ring-red-500/30",
    chip: "Missing key",
  },
  optional: {
    dot: "bg-soft",
    text: "text-soft",
    ring: "ring-ink-600",
    chip: "Optional",
  },
  demo: {
    dot: "bg-purple-300",
    text: "text-purple-200",
    ring: "ring-purple-500/30",
    chip: "Demo mode",
  },
};

/** A single API status badge. */
export function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const s = STATE_STYLES[status.state];
  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-xl border border-ink-700/70 bg-ink-900/50 px-3 py-2.5 ring-1 ring-inset " +
        s.ring
      }
      title={status.note}
    >
      <div className="flex items-center gap-2.5">
        <span className={"h-2 w-2 shrink-0 rounded-full " + s.dot} />
        <span className="text-sm font-medium text-white">{status.label}</span>
      </div>
      <span className={"text-xs font-semibold " + s.text}>{s.chip}</span>
    </div>
  );
}

/** Panel that loads /api/status and renders all badges. */
export function ApiStatusPanel({ className }: { className?: string }) {
  const [statuses, setStatuses] = React.useState<ApiStatus[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        if (active) setStatuses(d.statuses ?? []);
      })
      .catch(() => active && setError("Could not load API status."));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={"sf-card sf-card-pad " + (className || "")}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">API Status</h3>
        <span className="sf-eyebrow">Architecture</span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-soft">
        Every provider is called from secure server routes — keys never reach the
        browser. With all keys set, research returns real tracks only (no demo
        fallback).
      </p>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {!statuses && !error && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-xl bg-ink-700/40"
            />
          ))}
        </div>
      )}

      {statuses && (
        <div className="space-y-2">
          {statuses.map((s) => (
            <ApiStatusBadge key={s.key} status={s} />
          ))}
        </div>
      )}
    </div>
  );
}
