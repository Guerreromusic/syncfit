"use client";

import * as React from "react";
import type { OpenRouterModelOption } from "@/lib/models";

/**
 * Compact "AI Model Switch" for the top-right of the Analyzer card.
 * Provider-neutral by design — it never names the underlying gateway.
 */
export function ModelSwitch({
  model,
  models,
  onChange,
}: {
  model: string;
  models: OpenRouterModelOption[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex items-center gap-2.5">
      <span className="whitespace-nowrap text-xs font-medium text-soft">
        AI Model Switch
      </span>
      <span className="relative">
        <select
          aria-label="AI Model Switch"
          value={model}
          onChange={(e) => onChange(e.target.value)}
          className="w-auto cursor-pointer appearance-none rounded-xl border border-white/15 bg-ink-900/70 py-1.5 pl-3 pr-9 text-sm font-medium text-white transition hover:border-purple-400/60 focus:border-purple-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/30"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id} className="bg-ink-900 text-white">
              {m.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soft"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
