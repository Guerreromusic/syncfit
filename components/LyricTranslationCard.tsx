"use client";

import * as React from "react";
import { WaveIcon } from "./icons";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highlight brief-matching keywords inside a text run. */
function Highlighted({ text, keywords }: { text: string; keywords: string[] }) {
  const kws = keywords.map((k) => k.trim()).filter((k) => k.length > 1);
  if (!text || kws.length === 0) return <>{text}</>;
  const re = new RegExp(`(${kws.map(escapeRe).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded bg-lime-400/20 px-0.5 font-medium text-lime-200"
          >
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

type LyricData = {
  available: boolean;
  snippet?: string;
  translation?: string;
  sourceLang?: string;
  keywords?: string[];
};

/**
 * Live lyric CONTEXT + translation for the full report. Fetches a SHORT
 * Musixmatch snippet at view time, translates it, and highlights brief-matching
 * keywords. Nothing is stored — short context only, never full lyrics.
 */
export function LyricTranslationCard({
  trackId,
  brief,
}: {
  trackId: string;
  brief: string;
}) {
  const [data, setData] = React.useState<LyricData | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, brief }),
    })
      .then((r) => r.json())
      .then((d: LyricData) => {
        if (!active) return;
        setData(d);
        setDone(true);
      })
      .catch(() => active && setDone(true));
    return () => {
      active = false;
    };
  }, [trackId, brief]);

  // Loading skeleton
  if (!done) {
    return (
      <div className="sf-card sf-card-pad">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-700/50" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-ink-700/40" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-ink-700/40" />
      </div>
    );
  }

  // No lyric context available (demo/manual track, or none on this plan) → hide.
  if (!data?.available || !data.snippet) return null;

  const keywords = data.keywords ?? [];

  return (
    <div className="sf-card sf-card-pad">
      <div className="mb-3 flex items-center gap-2">
        <WaveIcon className="h-5 w-5 text-purple-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">Lyric &amp; Translation</h3>
        {data.sourceLang && data.sourceLang !== "Unknown" && (
          <span className="sf-pill text-[10px]">{data.sourceLang}</span>
        )}
      </div>

      {/* Original short context */}
      <p className="sf-eyebrow mb-1">Context</p>
      <p className="text-sm leading-relaxed text-soft">
        <Highlighted text={data.snippet} keywords={keywords} />
      </p>

      {/* English translation */}
      {data.translation && (
        <>
          <p className="sf-eyebrow mb-1 mt-4">English translation</p>
          <p className="text-sm leading-relaxed text-white">
            <Highlighted text={data.translation} keywords={keywords} />
          </p>
        </>
      )}

      {/* Brief-matching keywords */}
      {keywords.length > 0 && (
        <div className="mt-4">
          <p className="sf-eyebrow mb-2">Matches your brief</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k, i) => (
              <span
                key={i}
                className="rounded-full bg-lime-500/10 px-2.5 py-0.5 text-xs font-medium text-lime-300 ring-1 ring-inset ring-lime-500/25"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] text-soft">
        Short lyric context only — fetched live, never stored. Lyrics powered by
        Musixmatch · translation &amp; keywords by AI.
      </p>
    </div>
  );
}
