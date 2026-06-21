"use client";

import { useFavouritesList, StarButton, type FavTrack } from "@/components/favourites";
import { SpotifyPlay } from "@/components/SpotifyPlay";
import { TrackCover } from "@/components/TrackCover";
import { StarIcon, RocketIcon } from "@/components/icons";
import { usePlayer, type PlayerTrack } from "@/components/PlayerContext";
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

const queueOf = (list: FavTrack[]): PlayerTrack[] =>
  list.map((t) => ({
    id: t.spotifyTrackId || `${t.title}__${t.artist}`,
    title: t.title,
    artist: t.artist,
  }));

export default function StarredPage() {
  const list = useFavouritesList();
  const { play } = usePlayer();

  return (
    <div className="space-y-6">
      <header>
        <p className="sf-eyebrow">Starred</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Starred tracks</h1>
        <p className="mt-1 text-sm text-soft">
          Your saved tracks as a playlist — play them all, or send one back into
          Research to score it.
        </p>
      </header>

      {list === null ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-ink-700/40" />
              <div className="h-4 w-40 animate-pulse rounded bg-ink-700/40" />
            </div>
          ))}
        </div>
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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {/* Playlist header */}
          <div className="flex items-center gap-4 border-b border-white/10 bg-gradient-to-br from-purple-600/25 via-purple-600/5 to-lime-400/10 p-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-lime-400/15 ring-1 ring-inset ring-lime-400/30">
              <StarIcon className="h-7 w-7 text-lime-300" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="sf-eyebrow">Playlist</p>
              <h2 className="text-lg font-bold text-white">Starred tracks</h2>
              <p className="text-xs text-soft">
                {list.length} {list.length === 1 ? "track" : "tracks"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const q = queueOf(list);
                if (q.length) play(q[0], q, 0);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:scale-105"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              Play all
            </button>
          </div>

          {/* Tracks */}
          <ul className="divide-y divide-white/5">
            {list.map((t, i) => (
              <li
                key={`${t.title}|${t.artist}`}
                className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/[0.03] sm:px-4"
              >
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-soft">
                  {i + 1}
                </span>
                <TrackCover url={t.artworkUrl} circle className="h-11 w-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                  <p className="truncate text-xs text-soft">
                    {t.artist}
                    {t.genre ? ` · ${t.genre}` : ""}
                  </p>
                </div>
                {t.scoreLabel && (
                  <span className="hidden shrink-0 sf-pill text-[10px] md:inline-flex">
                    {t.scoreLabel}
                  </span>
                )}
                {t.score != null && (
                  <span className={"w-7 shrink-0 text-right text-lg font-bold tabular-nums " + scoreColor(t.score)}>
                    {t.score}
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-1.5">
                  <SpotifyPlay
                    title={t.title}
                    artist={t.artist}
                    spotifyId={t.spotifyTrackId}
                    queue={queueOf(list)}
                    queueIndex={i}
                    label=""
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-lime-400/50 hover:text-lime-300"
                  />
                  <button
                    type="button"
                    onClick={() => research(t)}
                    aria-label={`Research ${t.title}`}
                    title="Score this track in Research"
                    className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-soft transition hover:border-purple-400/50 hover:text-white sm:flex"
                  >
                    <RocketIcon className="h-4 w-4" aria-hidden />
                  </button>
                  <StarButton
                    track={t}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-lime-400/50 bg-lime-400/10 text-lime-300 transition hover:bg-lime-400/20"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
