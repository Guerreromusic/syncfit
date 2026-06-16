import * as React from "react";

/** A numbered step header — gives the analyzer a clear 1 → 2 → run flow. */
export function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600/30 text-xs font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold leading-tight text-white">{title}</h2>
        {subtitle && <p className="text-xs text-soft">{subtitle}</p>}
      </div>
    </div>
  );
}
