"use client";

import * as React from "react";
import type { Demographics } from "@/lib/types";

type DemoData = Demographics & { available: boolean };

/**
 * Minimal audience-analytics card on the report: aggregate listener age
 * distribution, a cultural/faith resonance note (placement context), and who the
 * track appeals to. Estimated by AI (OpenRouter), anchored on the Musixmatch
 * language/genre. Renders nothing until it resolves with usable data.
 */
export function DemographicsCard({
  title,
  artist,
  language,
  genre,
  model,
}: {
  title: string;
  artist: string;
  language?: string;
  genre?: string;
  model?: string;
}) {
  const [data, setData] = React.useState<DemoData | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setDone(false);
    fetch("/api/demographics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, language, genre, model }),
    })
      .then((r) => r.json())
      .then((d: DemoData) => {
        if (alive) {
          setData(d);
          setDone(true);
        }
      })
      .catch(() => alive && setDone(true));
    return () => {
      alive = false;
    };
  }, [title, artist, language, genre, model]);

  if (!done) {
    return (
      <div className="sf-card sf-card-pad">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-700/50" />
        <div className="mt-3 h-24 w-full animate-pulse rounded-xl bg-ink-700/30" />
      </div>
    );
  }
  if (!data?.available) return null;

  const max = Math.max(...data.ageBands.map((b) => b.share), 1);

  return (
    <div className="sf-card sf-card-pad">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <UsersIcon className="h-5 w-5 text-purple-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">Audience demographics</h3>
        {language && <span className="sf-pill text-[10px]">{language}</span>}
        <span className="ml-auto text-[11px] text-soft">Aggregate estimate</span>
      </div>
      {data.summary && (
        <p className="mb-4 text-sm leading-relaxed text-soft">{data.summary}</p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Age distribution */}
        {data.ageBands.length > 0 && (
          <div>
            <p className="sf-eyebrow mb-2">Age</p>
            <ul className="space-y-2">
              {data.ageBands.map((b) => (
                <li key={b.label} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs font-medium text-soft">
                    {b.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-lime-400"
                      style={{ width: `${(b.share / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-white">
                    {b.share}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Appeal + faith/cultural resonance */}
        <div className="space-y-4">
          {data.appeal.length > 0 && (
            <div>
              <p className="sf-eyebrow mb-2">Appeals to</p>
              <ul className="space-y-1.5">
                {data.appeal.map((a, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-soft">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.faithResonance && (
            <div>
              <p className="sf-eyebrow mb-1">Cultural / faith resonance</p>
              <p className="text-xs leading-relaxed text-soft">{data.faithResonance}</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-soft">
        Aggregate audience estimate (AI) anchored on the track&rsquo;s language &amp;
        genre (Musixmatch) — for placement targeting &amp; brand-safety context.
      </p>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.2 5.2 0 0 0-3-4.7" />
    </svg>
  );
}
