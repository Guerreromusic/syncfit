"use client";

import * as React from "react";

/**
 * Friendly, minimal loader shown while the single Run SyncFit request is in
 * flight. The backend runs two distinct tasks (Musixmatch lookup, then AI
 * reasoning) inside ONE request — to the user this is a single process, so we
 * narrate it with one rotating, plain-language status line instead of exposing
 * separate steps. The messages advance on a gentle timer and hold on the last.
 */
const STEPS_SINGLE = [
  "Looking up your track on Musixmatch…",
  "Reading its mood, language, and lyric context…",
  "Lining it up against your brief…",
  "Scoring the sync fit with AI…",
  "Writing your pitch-ready summary…",
];

const STEPS_DISCOVER = [
  "Reading your brief…",
  "Scanning the Latin repertoire for the best fits…",
  "Scoring each candidate with AI…",
  "Ranking your top 10…",
  "Polishing the shortlist…",
];

export function RunningState({ mode = "single" }: { mode?: "single" | "discover" }) {
  const STEPS = mode === "discover" ? STEPS_DISCOVER : STEPS_SINGLE;
  const last = STEPS.length - 1;
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, last)), 1500);
    return () => clearInterval(t);
  }, [last]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="sf-glass-soft flex min-h-[420px] flex-col items-center justify-center p-8 text-center"
    >
      {/* Equalizer — music-themed, on-brand pulse */}
      <div className="flex h-12 items-end gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((b) => (
          <span
            key={b}
            className="sf-eq-bar h-full w-2 rounded-full bg-gradient-to-t from-purple-500 to-lime-400"
            style={{ animationDelay: `${b * 0.12}s` }}
          />
        ))}
      </div>

      {/* Rotating, friendly status — key forces a fresh fade-in each change */}
      <p key={i} className="mt-6 animate-fade-up text-base font-semibold text-white">
        {STEPS[i]}
      </p>
      <p className="mt-2 max-w-xs text-xs text-soft">
        Hang tight — SyncFit is handling everything for you in one step.
      </p>

      {/* Progress dots */}
      <div className="mt-5 flex items-center gap-2">
        {STEPS.map((_, idx) => (
          <span
            key={idx}
            className={
              "h-1.5 rounded-full transition-all duration-500 " +
              (idx <= i ? "w-6 bg-lime-400" : "w-1.5 bg-ink-600")
            }
          />
        ))}
      </div>
    </div>
  );
}
