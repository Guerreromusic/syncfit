import * as React from "react";
import { InfoIcon } from "./icons";

type IconType = (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;

/**
 * Slim, single-row metric tile: small icon chip on the left, then the value and
 * its label inline, with an info (ⓘ) button that explains the metric on hover.
 */
export function StatTile({
  value,
  label,
  hint,
  icon: Icon,
  accent = "purple",
}: {
  value: string;
  label: string;
  hint: string;
  icon: IconType;
  accent?: "purple" | "lime";
}) {
  const chip =
    accent === "lime"
      ? "bg-lime-500/15 text-lime-300 ring-lime-500/25"
      : "bg-purple-500/15 text-purple-200 ring-purple-500/25";

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] px-4 py-3 transition duration-300 hover:border-white/15">
      <span
        className={
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset " +
          chip
        }
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <p className="min-w-0 flex-1 leading-tight">
        <span className="text-lg font-bold tabular-nums text-white">{value}</span>
        <span className="ml-1.5 text-sm text-soft">{label}</span>
      </p>

      {/* Info button + hover/focus tooltip */}
      <span className="group/info relative shrink-0">
        <button
          type="button"
          aria-label={`About ${label}`}
          className="flex h-6 w-6 items-center justify-center rounded-full text-soft/60 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
        >
          <InfoIcon className="h-4 w-4" aria-hidden />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-50 mb-1.5 w-52 -translate-y-1 rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2 text-xs font-normal leading-relaxed text-soft opacity-0 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-150 group-hover/info:translate-y-0 group-hover/info:opacity-100 group-focus-within/info:translate-y-0 group-focus-within/info:opacity-100"
        >
          {hint}
        </span>
      </span>
    </div>
  );
}
