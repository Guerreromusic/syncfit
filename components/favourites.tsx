"use client";

import * as React from "react";
import { StarIcon } from "./icons";

export type FavTrack = {
  title: string;
  artist: string;
  score?: number;
  scoreLabel?: string;
  genre?: string;
  spotifyTrackId?: string | null;
  artworkUrl?: string | null;
};

const KEY = "syncfit:favourites";
const idOf = (t: { title: string; artist: string }) =>
  `${t.title}|${t.artist}`.toLowerCase();

function read(): FavTrack[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: FavTrack[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 300)));
  } catch {
    /* storage full / unavailable */
  }
  // Notify same-tab listeners (the storage event only fires cross-tab).
  window.dispatchEvent(new Event("syncfit:fav"));
}

/** Toggle/read the starred state for one track. */
export function useFavourite(track: FavTrack) {
  const id = idOf(track);
  const [fav, setFav] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setFav(read().some((t) => idOf(t) === id));
    sync();
    window.addEventListener("syncfit:fav", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("syncfit:fav", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  const toggle = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      const list = read();
      const exists = list.some((t) => idOf(t) === id);
      write(exists ? list.filter((t) => idOf(t) !== id) : [track, ...list]);
      setFav(!exists);
    },
    [id, track],
  );

  return [fav, toggle] as const;
}

/** Live list of starred tracks (re-renders on changes). */
export function useFavouritesList() {
  const [list, setList] = React.useState<FavTrack[] | null>(null);
  React.useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener("syncfit:fav", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("syncfit:fav", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

/** Star toggle button — saves/removes a track from the Starred section. */
export function StarButton({
  track,
  className,
}: {
  track: FavTrack;
  className?: string;
}) {
  const [fav, toggle] = useFavourite(track);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={fav}
      aria-label={fav ? "Remove from Starred" : "Save to Starred"}
      title={fav ? "Remove from Starred" : "Save to Starred"}
      className={
        className ||
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition " +
          (fav
            ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
            : "border-white/10 bg-white/[0.03] text-soft hover:border-amber-400/40 hover:text-amber-300")
      }
    >
      <StarIcon filled={fav} className="h-4 w-4" aria-hidden />
    </button>
  );
}
