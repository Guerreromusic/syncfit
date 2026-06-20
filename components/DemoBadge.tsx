import * as React from "react";

/**
 * Clearly communicates when demo data is in use. Shown wherever a result was
 * produced without a live API key, so judges always know what's real vs. demo.
 */
export function DemoBadge({
  musixmatch,
  openrouter,
  className,
}: {
  musixmatch?: boolean;
  openrouter?: boolean;
  className?: string;
}) {
  if (!musixmatch && !openrouter) return null;

  const parts: string[] = [];
  if (musixmatch) parts.push("Musixmatch (demo / unverified track — not a live lookup)");
  if (openrouter) parts.push("AI model (local heuristic)");

  return (
    <div
      className={
        "flex items-start gap-2.5 rounded-xl border border-purple-500/30 bg-purple-600/10 px-3.5 py-2.5 " +
        (className || "")
      }
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-300" />
      <p className="text-xs leading-relaxed text-purple-100">
        <span className="font-semibold">Demo mode:</span> this result uses{" "}
        {parts.join(" and ")}. Add the relevant API keys to your environment
        (<code className="rounded bg-ink-900/70 px-1 py-0.5 text-[11px]">
          .env.local
        </code>{" "}
        locally, host env vars in production) for live data.
      </p>
    </div>
  );
}
