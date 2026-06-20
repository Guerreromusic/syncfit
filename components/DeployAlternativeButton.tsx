"use client";

import * as React from "react";
import { RocketIcon } from "./icons";
import type { Brief } from "@/lib/types";

export const RESEARCH_SEED_KEY = "syncfit:research:seed";

/**
 * "Deploy" a suggested alternative into the Research console: stashes the track
 * (and the originating brief) and opens Research, which picks it up and runs.
 */
export function DeployAlternativeButton({
  title,
  artist,
  brief,
  className,
  label = "Deploy",
}: {
  title: string;
  artist: string;
  brief?: Brief;
  className?: string;
  /** Pass "" for an icon-only button (tight layouts). */
  label?: string;
}) {
  function deploy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      sessionStorage.setItem(
        RESEARCH_SEED_KEY,
        JSON.stringify({ title, artist, brief: brief ?? null }),
      );
    } catch {
      /* sessionStorage unavailable — Research still opens, just unseeded */
    }
    window.location.href = "/analyzer";
  }

  return (
    <button
      type="button"
      onClick={deploy}
      title={`Deploy research on “${title}”`}
      aria-label={`Deploy research on ${title}`}
      className={
        className ??
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
      }
    >
      <RocketIcon className="h-3.5 w-3.5" aria-hidden />
      {label && <span>{label}</span>}
    </button>
  );
}
