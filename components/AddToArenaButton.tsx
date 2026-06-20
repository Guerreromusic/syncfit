"use client";

import * as React from "react";
import { PlusIcon, CheckIcon, TrophyIcon } from "./icons";

export const ARENA_TRACKS_KEY = "syncfit:arena:tracks";
export const ARENA_BRIEF_KEY = "syncfit:arena:brief";

type QueueItem = { title: string; artist: string };

function readQueue(): QueueItem[] {
  try {
    const raw = sessionStorage.getItem(ARENA_TRACKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const idOf = (t: QueueItem) => `${t.title}|${t.artist}`.toLowerCase();

/**
 * One-click "add this report's track (+brief) to Track Arena". Queues up to 3
 * tracks in sessionStorage; Track Arena reads + clears the queue on open.
 */
export function AddToArenaButton({
  brief,
  title,
  artist,
  className,
  iconOnly = false,
}: {
  brief: string;
  title: string;
  artist: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const me = idOf({ title, artist });
  const [inArena, setInArena] = React.useState(false);

  React.useEffect(() => {
    const recompute = () => setInArena(readQueue().some((t) => idOf(t) === me));
    recompute();
    // Re-sync when another button toggles the queue. `storage` fires across tabs;
    // `focus` covers same-tab updates (e.g. another AddToArena button on the page).
    window.addEventListener("focus", recompute);
    window.addEventListener("storage", recompute);
    return () => {
      window.removeEventListener("focus", recompute);
      window.removeEventListener("storage", recompute);
    };
  }, [me]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const q = readQueue();
    const exists = q.some((t) => idOf(t) === me);
    let next: QueueItem[];
    if (exists) {
      next = q.filter((t) => idOf(t) !== me);
    } else {
      next = [...q, { title, artist }].slice(-3); // keep the 3 most recent
      sessionStorage.setItem(ARENA_BRIEF_KEY, brief || "");
    }
    sessionStorage.setItem(ARENA_TRACKS_KEY, JSON.stringify(next));
    setInArena(!exists);
  }

  const label = inArena ? "In Arena" : "Add to Arena";
  const icon = inArena ? (
    <CheckIcon className="h-4 w-4" aria-hidden />
  ) : (
    <TrophyIcon className="h-4 w-4" aria-hidden />
  );

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={inArena}
        aria-label={label}
        title={inArena ? "Queued for Track Arena" : "Add this track to Track Arena"}
        className={
          "flex h-8 w-8 items-center justify-center rounded-full border transition " +
          (inArena
            ? "border-lime-500/40 bg-lime-500/10 text-lime-300"
            : "border-white/15 bg-white/[0.03] text-soft hover:border-purple-400/50 hover:text-white")
        }
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={inArena}
      title={inArena ? "Queued for Track Arena" : "Add this track to Track Arena"}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition " +
          (inArena
            ? "border-lime-500/40 bg-lime-500/10 text-lime-300"
            : "border-white/15 bg-white/[0.03] text-soft hover:border-purple-400/50 hover:text-white")
      }
    >
      {inArena ? (
        <CheckIcon className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <PlusIcon className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}
