import * as React from "react";
import { WaveIcon } from "./icons";

export function formatStreams(n: number | null | undefined): string | null {
  if (n == null || n <= 0) return null;
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Cover artwork (Songstats) with a graceful placeholder fallback. */
export function TrackCover({
  url,
  className = "h-14 w-14",
}: {
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={
          "shrink-0 rounded-xl object-cover ring-1 ring-inset ring-white/10 " +
          className
        }
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={
        "flex shrink-0 items-center justify-center rounded-xl bg-purple-600/15 text-purple-200 ring-1 ring-inset ring-white/10 " +
        className
      }
    >
      <WaveIcon className="h-6 w-6" aria-hidden />
    </div>
  );
}

/** A small "streams · status" line for under/next to a cover. */
export function StreamsBadge({
  streams,
  status,
}: {
  streams?: number | null;
  status?: string;
}) {
  const s = formatStreams(streams);
  if (!s && !status) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-soft">
      {s && (
        <span className="tabular-nums text-white">
          {s} <span className="text-soft">streams</span>
        </span>
      )}
      {s && status && <span className="text-soft/50">·</span>}
      {status && <span className="text-lime-400">{status}</span>}
    </span>
  );
}
