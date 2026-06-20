"use client";

import * as React from "react";

export type PlayerTrack = { id?: string; title: string; artist: string };

type PlayerCtxValue = {
  current: PlayerTrack | null;
  /** Play a track. Pass a `queue` (and optional start `index`) for next/prev. */
  play: (t: PlayerTrack, queue?: PlayerTrack[], index?: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  /** Bumped on every explicit play/next/prev press, so the footer player knows
   * the user actively wants audio (vs. a track merely loading). */
  playToken: number;
  /** Whether the footer player is currently playing audio. */
  playing: boolean;
  /** Toggle play/pause on the currently-loaded track. */
  togglePlayback: () => void;
};

const PlayerCtx = React.createContext<PlayerCtxValue | null>(null);

const NOOP: PlayerCtxValue = {
  current: null,
  play: () => {},
  close: () => {},
  next: () => {},
  prev: () => {},
  hasNext: false,
  hasPrev: false,
  playToken: 0,
  playing: false,
  togglePlayback: () => {},
};

/** Access the in-app player. Safe no-op outside a provider (never throws). */
export function usePlayer(): PlayerCtxValue {
  return React.useContext(PlayerCtx) ?? NOOP;
}

/**
 * In-app playback: a single custom music player pinned to the footer. Every play
 * control across the platform routes here, so tracks play IN SyncFit and never
 * navigate the user away to Spotify. Tracks are resolved to a 30s preview by
 * title + artist (iTunes, keyless), so ANY track is instantly playable.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<PlayerTrack[]>([]);
  const [index, setIndex] = React.useState(0);
  // Incremented on every explicit play/next/prev press → an intent-to-play signal.
  const [playToken, setPlayToken] = React.useState(0);
  // Clamp so a stale index (e.g. swapping to a shorter queue) can never null out
  // `current` for a render and unmount the player mid-track.
  const current = queue.length
    ? queue[Math.min(Math.max(0, index), queue.length - 1)]
    : null;

  const play = React.useCallback(
    (t: PlayerTrack, q?: PlayerTrack[], i?: number) => {
      if (q && q.length) {
        const start =
          typeof i === "number" && i >= 0 && i < q.length
            ? i
            : Math.max(
                0,
                q.findIndex(
                  (x) => x.title === t.title && x.artist === t.artist,
                ),
              );
        setQueue(q);
        setIndex(start);
      } else {
        setQueue([t]);
        setIndex(0);
      }
      setPlayToken((n) => n + 1); // explicit press → start playback once resolved
    },
    [],
  );

  const close = React.useCallback(() => {
    setQueue([]);
    setIndex(0);
  }, []);

  const next = React.useCallback(() => {
    setIndex((i) => (i < queue.length - 1 ? i + 1 : i));
    setPlayToken((n) => n + 1);
  }, [queue.length]);

  const prev = React.useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
    setPlayToken((n) => n + 1);
  }, []);

  const hasNext = index < queue.length - 1;
  const hasPrev = index > 0;

  // Playback state lives here so ANY play control can show play/pause + toggle.
  const [playing, setPlaying] = React.useState(false);
  const toggleRef = React.useRef<(() => void) | null>(null);
  const registerToggle = React.useCallback((fn: () => void) => {
    toggleRef.current = fn;
  }, []);
  const togglePlayback = React.useCallback(() => {
    toggleRef.current?.();
  }, []);

  const value = React.useMemo(
    () => ({ current, play, close, next, prev, hasNext, hasPrev, playToken, playing, togglePlayback }),
    [current, play, close, next, prev, hasNext, hasPrev, playToken, playing, togglePlayback],
  );

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <PlayerSpacer />
      <FooterPlayer setPlaying={setPlaying} registerToggle={registerToggle} />
    </PlayerCtx.Provider>
  );
}

/** In-flow spacer the height of the floating capsule — only present while a
 * track is loaded, so the last cards never hide behind the player and no empty
 * space is reserved when nothing is playing. */
function PlayerSpacer() {
  const { current } = usePlayer();
  return current ? <div aria-hidden className="h-24" /> : null;
}

type Detail = {
  previewUrl: string | null;
  artworkUrl: string | null;
  title: string;
  artist: string;
} | null;

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${ss}`;
}

// Shared keyboard focus ring for the transport controls (WCAG 2.4.7).
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950";

// lime-400 fill for the scrubber / volume slider.
const FILL = "rgb(163 230 53)";
const TRACK = "rgba(255,255,255,0.15)";
function sliderFill(pct: number): React.CSSProperties {
  const p = Math.max(0, Math.min(100, pct));
  return {
    backgroundImage: `linear-gradient(to right, ${FILL} ${p}%, ${TRACK} ${p}%)`,
  };
}

function FooterPlayer({
  setPlaying,
  registerToggle,
}: {
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  registerToggle: (fn: () => void) => void;
}) {
  const { current, close, next, prev, hasNext, hasPrev, playToken, playing } = usePlayer();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [detail, setDetail] = React.useState<Detail>(null);
  const [loaded, setLoaded] = React.useState(false); // preview resolution done
  const [buffering, setBuffering] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  const [vol, setVol] = React.useState(0.8);
  const [muted, setMuted] = React.useState(false);
  // If the preview audio can't decode (rare codec gaps), show a graceful state.
  const [audioError, setAudioError] = React.useState(false);

  const trackTitle = current?.title;
  const trackArtist = current?.artist;

  // Resolve preview URL + artwork whenever the track identity changes.
  React.useEffect(() => {
    if (!trackTitle) return;
    setDetail(null);
    setLoaded(false);
    setPlaying(false);
    setBuffering(true);
    setTime(0);
    setDur(0);
    setAudioError(false);
    let active = true;
    fetch(
      `/api/preview?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(
        trackArtist ?? "",
      )}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setDetail(d.track ?? null);
        setLoaded(true);
        if (!d.track?.previewUrl) setBuffering(false);
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
        setBuffering(false);
      });
    return () => {
      active = false;
    };
  }, [trackTitle, trackArtist, setPlaying]);

  // Start playback when the user PRESSED a play/next/prev control (playToken
  // bumped) and the preview has resolved. This never auto-plays on page load or
  // auto-advances at track end — the player is only ever loaded by an explicit
  // user gesture, and that gesture is what bumps the token.
  const playedTokenRef = React.useRef(playToken);
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a || !loaded || !detail?.previewUrl) return; // wait for the preview
    if (playToken === playedTokenRef.current) return; // no fresh play intent
    playedTokenRef.current = playToken;
    a.volume = vol;
    a.muted = muted;
    a.currentTime = 0;
    a.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false)); // blocked → user can hit play in the bar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, loaded, detail?.previewUrl]);

  // Keep the element's volume / mute in sync with the controls.
  React.useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = vol;
      a.muted = muted;
    }
  }, [vol, muted]);

  // Expose play/pause to the context so ANY play control can toggle this track.
  React.useEffect(() => {
    registerToggle(toggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!current) return null;

  const title = detail?.title || current.title;
  const artist = detail?.artist || current.artist;
  const art = detail?.artworkUrl ?? null;
  const hasPreview = Boolean(detail?.previewUrl) && !audioError;
  const pct = dur > 0 ? (time / dur) * 100 : 0;

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }
  function seek(v: number) {
    const a = audioRef.current;
    if (a) a.currentTime = v;
    setTime(v);
  }
  // Spotify-style previous: restart if we're past 3s or there's no earlier
  // track, otherwise jump to the previous track in the queue.
  function onPrev() {
    const a = audioRef.current;
    if (hasPrev && (!a || a.currentTime <= 3)) prev();
    else seek(0);
  }
  function onEnded() {
    // Stop at the end — never auto-advance into the next track.
    setPlaying(false);
  }

  return (
    // A slim rounded capsule, CENTERED in the content area (right of the sidebar).
    // Single minimal row: play on the LEFT, then art/meta, scrubber, volume, close.
    // `--sf-player-bottom` (set by the Research page) floats it above a docked footer.
    <div
      className="fixed left-3 right-3 z-50 flex justify-center lg:left-[280px]"
      style={{ bottom: "var(--sf-player-bottom, 1rem)" }}
    >
      <div className="sf-liquid relative flex w-full max-w-[920px] items-center gap-2.5 overflow-hidden rounded-full border border-white/10 px-3 py-1.5 shadow-2xl shadow-black/40 sm:gap-3 sm:px-4">
        {/* Mobile-only seek bar pinned to the top edge (desktop has the full scrubber). */}
        {loaded && hasPreview && (
          <input
            type="range"
            min={0}
            max={dur || 30}
            step={0.1}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            style={sliderFill(pct)}
            className="sf-range absolute inset-x-0 top-0 sm:hidden"
            aria-label="Seek"
          />
        )}

        {/* LEFT: play (primary) + minimal prev/next */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPreview}
            className={`hidden rounded-full text-soft transition hover:text-white disabled:opacity-30 sm:block ${FOCUS_RING}`}
            aria-label={hasPrev ? "Previous track" : "Restart"}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={!loaded || !hasPreview}
            aria-label={playing ? "Pause" : "Play"}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-950 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 ${FOCUS_RING}`}
          >
            {!loaded || (buffering && playing) ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
            ) : playing ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!hasNext}
            className={`hidden rounded-full text-soft transition hover:text-white disabled:opacity-30 sm:block ${FOCUS_RING}`}
            aria-label="Next track"
          >
            <NextIcon />
          </button>
        </div>

        {/* Art + meta + now-playing equalizer */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:w-48 sm:flex-none">
          <div className="relative shrink-0">
            {art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={art}
                alt=""
                className="h-9 w-9 rounded object-cover ring-1 ring-inset ring-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 rounded bg-purple-600/20 ring-1 ring-inset ring-white/10" />
            )}
            {playing && (
              <span className="absolute bottom-0 right-0 flex h-3 items-end gap-px rounded-sm bg-black/55 px-0.5 backdrop-blur-sm">
                <span className="sf-eq-bar h-full w-0.5 rounded-full bg-lime-400" style={{ animationDelay: "0ms" }} />
                <span className="sf-eq-bar h-full w-0.5 rounded-full bg-lime-400" style={{ animationDelay: "180ms" }} />
                <span className="sf-eq-bar h-full w-0.5 rounded-full bg-lime-400" style={{ animationDelay: "360ms" }} />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-white">{title}</p>
            <p className="truncate text-[11px] leading-tight text-soft">{artist}</p>
          </div>
        </div>

        {/* Scrubber (desktop) */}
        {!loaded ? (
          <div className="hidden flex-1 items-center gap-2 text-[11px] text-soft sm:flex">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Loading…
          </div>
        ) : hasPreview ? (
          <div className="hidden flex-1 items-center gap-2 sm:flex">
            <span className="w-8 text-right text-[10px] tabular-nums text-soft">{fmt(time)}</span>
            <input
              type="range"
              min={0}
              max={dur || 30}
              step={0.1}
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
              style={sliderFill(pct)}
              className="sf-range flex-1"
              aria-label="Seek"
            />
            <span className="w-8 text-[10px] tabular-nums text-soft">{fmt(dur || 30)}</span>
          </div>
        ) : (
          <span className="hidden flex-1 text-[11px] text-soft sm:block">Preview unavailable</span>
        )}

        {/* RIGHT: volume + close */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {loaded && hasPreview && (
            <div className="hidden items-center gap-1.5 md:flex">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted || vol === 0 ? "Unmute" : "Mute"}
                className={`rounded-full text-soft transition hover:text-white ${FOCUS_RING}`}
              >
                {muted || vol === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : vol}
                onChange={(e) => {
                  setVol(Number(e.target.value));
                  setMuted(false);
                }}
                style={sliderFill((muted ? 0 : vol) * 100)}
                className="sf-range w-16"
                aria-label="Volume"
              />
            </div>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Close player"
            className={`rounded-full p-1 text-soft transition hover:text-white ${FOCUS_RING}`}
          >
            <CloseIcon />
          </button>
        </div>

        {loaded && hasPreview && (
          <audio
            ref={audioRef}
            src={detail!.previewUrl!}
            preload="auto"
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setBuffering(false);
              setPlaying(true);
            }}
            onCanPlay={() => setBuffering(false)}
            onEnded={onEnded}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => {
              setAudioError(true);
              setBuffering(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// — inline transport icons —
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
    </svg>
  );
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7 6h2v12H7zM20 6l-9 6 9 6z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M15 6h2v12h-2zM4 6l9 6-9 6z" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-soft" fill="currentColor" aria-hidden>
      <path d="M4 9v6h4l5 5V4L8 9H4z" />
    </svg>
  );
}
function VolumeMuteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-soft"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 5M21 9l-5 5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
