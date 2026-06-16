import * as React from "react";
import { InfoIcon } from "./icons";

type IconType = (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;

/**
 * Apple-style metric tile: soft gradient surface, tinted icon chip, big value,
 * and an info (ⓘ) button that reveals an explanation on hover/focus.
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
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition duration-300 hover:border-white/15 hover:from-white/[0.07]">
      <div className="flex items-start justify-between">
        <span
          className={
            "inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset " +
            chip
          }
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>

        {/* Info button + hover/focus tooltip */}
        <span className="group/info relative">
          <button
            type="button"
            aria-label={`About ${label}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-soft/70 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
          >
            <InfoIcon className="h-4 w-4" aria-hidden />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-52 translate-y-1 rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2 text-xs font-normal leading-relaxed text-soft opacity-0 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-150 group-hover/info:translate-y-0 group-hover/info:opacity-100 group-focus-within/info:translate-y-0 group-focus-within/info:opacity-100"
          >
            {hint}
          </span>
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-white">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-soft">{label}</p>
    </div>
  );
}
