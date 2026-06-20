"use client";

import * as React from "react";
import { WaveIcon, RocketIcon } from "./icons";
import { RESEARCH_SEED_KEY } from "@/lib/keys";
import { usePlayer, type PlayerTrack } from "./PlayerContext";
import { StarButton } from "./favourites";
import type { TrendingTrack } from "@/lib/types";

/** Stable play id for a trending track (Spotify id if known, else title+artist). */
function trackId(t: { spotifyTrackId?: string | null; title: string; artist: string }): string {
  return t.spotifyTrackId || `${t.title}__${t.artist}`;
}

const ROTATE_MS = 2000; // one card swaps every 2s → each card refreshes every ~10s

function deployTrending(t: TrendingTrack) {
  try {
    sessionStorage.setItem(
      RESEARCH_SEED_KEY,
      JSON.stringify({ title: t.title, artist: t.artist, brief: null }),
    );
  } catch {
    /* ignore */
  }
  window.location.href = "/analyzer";
}

function TrendingCard({
  track,
  queue,
  index,
}: {
  track: TrendingTrack;
  queue?: PlayerTrack[];
  index?: number;
}) {
  const { play } = usePlayer();
  return (
    <div className="animate-sf-fade">
      <div className="group relative">
        {track.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.artworkUrl}
            alt=""
            className="aspect-square w-full rounded-md object-cover ring-1 ring-inset ring-white/10"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-md bg-purple-600/15 ring-1 ring-inset ring-white/10">
            <WaveIcon className="h-4 w-4 text-purple-200" aria-hidden />
          </div>
        )}
        {track.genre && (
          <span className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 py-px text-[9px] font-bold text-lime-300 backdrop-blur-sm">
            {track.genre}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            play(
              { id: trackId(track), title: track.title, artist: track.artist },
              queue,
              index,
            );
          }}
          title={`Play ${track.title}`}
          aria-label={`Play ${track.title}`}
          className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 transition group-hover:opacity-100"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-ink-950">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
        <StarButton
          track={{
            title: track.title,
            artist: track.artist,
            genre: track.genre,
            spotifyTrackId: track.spotifyTrackId,
            artworkUrl: track.artworkUrl,
          }}
          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition hover:text-amber-300 group-hover:opacity-100 aria-pressed:text-amber-300 aria-pressed:opacity-100"
        />
      </div>
      <p className="mt-1 truncate text-[11px] font-semibold leading-tight text-white">{track.title}</p>
      <p className="truncate text-[10px] leading-tight text-soft">{track.artist}</p>
      <button
        type="button"
        onClick={() => deployTrending(track)}
        title={`Deploy research on “${track.title}”`}
        aria-label={`Deploy research on ${track.title}`}
        className="mt-1 inline-flex w-full items-center justify-center gap-0.5 rounded border border-white/10 bg-white/[0.03] py-0.5 text-[10px] font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
      >
        <RocketIcon className="h-2.5 w-2.5" aria-hidden />
        Deploy
      </button>
    </div>
  );
}

/** Capsule (pill) variant — used in the compact Research-page trending. */
function TrendingCapsule({
  track,
  queue,
  index,
}: {
  track: TrendingTrack;
  queue?: PlayerTrack[];
  index?: number;
}) {
  const { play } = usePlayer();
  return (
    <div className="animate-sf-fade group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.025] py-1 pl-1 pr-2 transition hover:border-purple-400/50 hover:bg-white/[0.05]">
      {track.artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.artworkUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-inset ring-white/10"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600/20 ring-1 ring-inset ring-white/10">
          <WaveIcon className="h-4 w-4 text-purple-200" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">{track.title}</p>
        <p className="truncate text-[10px] text-soft">{track.artist}</p>
      </div>
      <button
        type="button"
        onClick={() =>
          play(
            { id: trackId(track), title: track.title, artist: track.artist },
            queue,
            index,
          )
        }
        title={`Play ${track.title}`}
        aria-label={`Play ${track.title}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-soft transition hover:bg-lime-400 hover:text-ink-950"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => deployTrending(track)}
        title={`Deploy research on “${track.title}”`}
        aria-label={`Deploy research on ${track.title}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-soft transition hover:bg-purple-500/40 hover:text-white"
      >
        <RocketIcon className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

export function TrendingLatin({ compact = false }: { compact?: boolean }) {
  const [pool, setPool] = React.useState<TrendingTrack[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [slots, setSlots] = React.useState<number[] | null>(null);
  const cursorRef = React.useRef(0);
  const tickRef = React.useRef(0);
  const visibleCount = compact ? 6 : 7; // Research: capsules · Dashboard: small cards

  // Whole pool becomes the player queue, so next/prev walk the trending list.
  const queue: PlayerTrack[] = React.useMemo(
    () =>
      (pool ?? []).map((t) => ({
        id: trackId(t),
        title: t.title,
        artist: t.artist,
      })),
    [pool],
  );

  React.useEffect(() => {
    let active = true;
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        // Only rotate tracks that actually have a cover so a card never falls
        // back to a placeholder, and preload every cover so swaps are seamless.
        const tracks: TrendingTrack[] = (d.tracks ?? []).filter(
          (t: TrendingTrack) => Boolean(t.artworkUrl),
        );
        tracks.forEach((t) => {
          if (t.artworkUrl) {
            const im = new window.Image();
            im.referrerPolicy = "no-referrer";
            im.src = t.artworkUrl;
          }
        });
        setPool(tracks);
        if (tracks.length > 0) {
          const n = Math.min(visibleCount, tracks.length);
          setSlots(Array.from({ length: n }, (_, i) => i));
          cursorRef.current = n % tracks.length;
        }
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [visibleCount]);

  // Smoothly rotate one card at a time through the pool.
  React.useEffect(() => {
    if (!pool || pool.length <= visibleCount) return;
    const id = setInterval(() => {
      setSlots((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        const slot = tickRef.current % next.length;
        let c = cursorRef.current;
        let guard = 0;
        while (next.includes(c) && guard < pool.length) {
          c = (c + 1) % pool.length;
          guard++;
        }
        next[slot] = c;
        cursorRef.current = (c + 1) % pool.length;
        tickRef.current++;
        return next;
      });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [pool, visibleCount]);

  // No Songstats key (empty list) or error → hide the section entirely.
  if (failed || (pool && pool.length === 0)) return null;

  return (
    <section>
      <div className={(compact ? "mb-2" : "mb-4") + " flex items-center justify-between gap-3"}>
        <div>
          <p className="sf-eyebrow">Trending now</p>
          {!compact && (
            <h3 className="mt-1 text-sm font-semibold text-white">
              Rotating across genres
              <span className="ml-2 font-normal text-soft">· live via Songstats</span>
            </h3>
          )}
        </div>
      </div>

      <ul
        className={
          compact
            ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            : "grid grid-cols-4 gap-1.5 sm:grid-cols-7"
        }
      >
        {pool === null || slots === null
          ? Array.from({ length: visibleCount }).map((_, i) =>
              compact ? (
                <li key={i}>
                  <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.025] py-1 pl-1 pr-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-ink-700/40" />
                    <div className="flex-1">
                      <div className="h-2.5 w-3/4 animate-pulse rounded bg-ink-700/40" />
                      <div className="mt-1 h-2 w-1/2 animate-pulse rounded bg-ink-700/30" />
                    </div>
                  </div>
                </li>
              ) : (
                <li key={i} className="sf-card p-1.5">
                  <div className="aspect-square w-full animate-pulse rounded-md bg-ink-700/40" />
                  <div className="mt-1 h-2 w-3/4 animate-pulse rounded bg-ink-700/40" />
                  <div className="mt-1 h-1.5 w-1/2 animate-pulse rounded bg-ink-700/30" />
                </li>
              ),
            )
          : slots.map((poolIdx, slot) =>
              compact ? (
                <li key={slot}>
                  <TrendingCapsule
                    key={poolIdx}
                    track={pool[poolIdx]}
                    queue={queue}
                    index={poolIdx}
                  />
                </li>
              ) : (
                <li key={slot} className="sf-card p-1.5">
                  {/* keyed by pool index so each swap re-mounts + fades in */}
                  <TrendingCard
                    key={poolIdx}
                    track={pool[poolIdx]}
                    queue={queue}
                    index={poolIdx}
                  />
                </li>
              ),
            )}
      </ul>
    </section>
  );
}
