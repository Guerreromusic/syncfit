"use client";

import { useFavouritesList, StarButton, type FavTrack } from "@/components/favourites";
import { SpotifyPlay } from "@/components/SpotifyPlay";
import { TrackCover } from "@/components/TrackCover";
import { StarIcon, RocketIcon } from "@/components/icons";
import { scoreColor } from "@/lib/scoreColor";
import { RESEARCH_SEED_KEY } from "@/lib/keys";

function research(t: FavTrack) {
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

export default function StarredPage() {
  const list = useFavouritesList();

  return (
    <div className="space-y-6">
      <header>
        <p className="sf-eyebrow">Starred</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Starred tracks</h1>
        <p className="mt-1 text-sm text-soft">
          Tracks you saved from research — play them, or send one back into the
          Research chat to score it.
        </p>
      </header>

      {list === null ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="sf-card p-4">
              <div className="h-12 w-full animate-pulse rounded bg-ink-700/40" />
            </li>
          ))}
        </ul>
      ) : list.length === 0 ? (
        <div className="sf-card sf-card-pad flex min-h-[260px] flex-col items-center justify-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/15 ring-1 ring-inset ring-lime-400/30">
            <StarIcon className="h-6 w-6 text-lime-300" aria-hidden />
          </span>
          <h3 className="mt-4 text-base font-semibold text-white">No starred tracks yet</h3>
          <p className="mt-2 max-w-sm text-sm text-soft">
            In <span className="text-white">Research</span>, tap the{" "}
            <span className="text-lime-300">star</span> on any discovered track to
            save it here.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <li key={`${t.title}|${t.artist}`} className="sf-card p-4">
              <div className="flex items-start gap-3">
                <TrackCover url={t.artworkUrl} className="h-12 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                  <p className="truncate text-xs text-soft">
                    {t.artist}
                    {t.genre ? ` · ${t.genre}` : ""}
                  </p>
                </div>
                {t.score != null && (
                  <span className={"shrink-0 text-2xl font-bold tabular-nums " + scoreColor(t.score)}>
                    {t.score}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                {t.scoreLabel && <span className="sf-pill text-[10px]">{t.scoreLabel}</span>}
                <div className="ml-auto flex items-center gap-1.5">
                  <SpotifyPlay
                    title={t.title}
                    artist={t.artist}
                    spotifyId={t.spotifyTrackId}
                    label=""
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-lime-400/50 hover:text-lime-300"
                  />
                  <button
                    type="button"
                    onClick={() => research(t)}
                    aria-label={`Research ${t.title}`}
                    title="Score this track in Research"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-purple-400/50 hover:text-white"
                  >
                    <RocketIcon className="h-4 w-4" aria-hidden />
                  </button>
                  <StarButton track={t} className="flex h-8 w-8 items-center justify-center rounded-full border border-lime-400/50 bg-lime-400/10 text-lime-300 transition hover:bg-lime-400/20" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
