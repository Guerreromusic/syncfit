"use client";

import * as React from "react";
import { WaveIcon } from "./icons";
import type { TrendingTrack } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  Established: "text-lime-300",
  Rising: "text-lime-400",
  Emerging: "text-purple-200",
  Unknown: "text-soft",
};

function formatStreams(n: number | null): string | null {
  if (n == null || n <= 0) return null;
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function TrendingLatin() {
  const [tracks, setTracks] = React.useState<TrendingTrack[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => active && setTracks(d.tracks ?? []))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  // No Songstats key (empty list) or error → hide the section entirely.
  if (failed || (tracks && tracks.length === 0)) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="sf-eyebrow">Trending Latin</p>
          <h3 className="mt-1 text-sm font-semibold text-white">
            What&apos;s moving right now
            <span className="ml-2 font-normal text-soft">· live via Songstats</span>
          </h3>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tracks === null
          ? // Skeletons while loading
            Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="sf-card p-3">
                <div className="aspect-square w-full animate-pulse rounded-lg bg-ink-700/40" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-ink-700/40" />
                <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-ink-700/30" />
              </li>
            ))
          : tracks.map((t, i) => (
              <li key={`${t.title}-${i}`} className="sf-card p-3">
                <div className="relative">
                  {t.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.artworkUrl}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover ring-1 ring-inset ring-white/10"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-purple-600/15 ring-1 ring-inset ring-white/10">
                      <WaveIcon className="h-6 w-6 text-purple-200" aria-hidden />
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white backdrop-blur-sm">
                    #{i + 1}
                  </span>
                </div>
                <p className="mt-2 truncate text-xs font-semibold text-white">
                  {t.title}
                </p>
                <p className="truncate text-[11px] text-soft">{t.artist}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span
                    className={"text-[10px] font-semibold " + (STATUS_STYLE[t.status] ?? "text-soft")}
                  >
                    {t.status}
                  </span>
                  {formatStreams(t.streams) && (
                    <span className="text-[10px] tabular-nums text-soft">
                      {formatStreams(t.streams)}
                    </span>
                  )}
                </div>
              </li>
            ))}
      </ul>
    </section>
  );
}
