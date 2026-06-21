"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { getSpotifyPlayback, type SpotifyState } from "./spotifyPlayer";
import { StarButton } from "./favourites";

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
  /** True when the Spotify Premium prompt should be shown. */
  showSpotifyPrompt: boolean;
  /** User chose to connect Spotify Premium → redirect to OAuth. */
  confirmSpotifyConnect: () => void;
  /** User chose to skip → play the pending track as a 30s preview. */
  skipToPreview: () => void;
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
  showSpotifyPrompt: false,
  confirmSpotifyConnect: () => {},
  skipToPreview: () => {},
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

  // — Spotify Premium prompt state ————————————————————————————————————————————
  // Shown once per device (localStorage key sf_spotify_prompted) on the very
  // first play click, unless Spotify is already connected.
  const [showSpotifyPrompt, setShowSpotifyPrompt] = React.useState(false);
  const [spotifyConnected, setSpotifyConnected] = React.useState(false);
  const pendingPlayRef = React.useRef<{
    t: PlayerTrack; q?: PlayerTrack[]; i?: number;
  } | null>(null);

  React.useEffect(() => {
    fetch("/api/spotify/token", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSpotifyConnected(Boolean(d?.hasSession)))
      .catch(() => {});
  }, []);

  // Internal: actually enqueue + start playback.
  const _doPlay = React.useCallback(
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
      setPlayToken((n) => n + 1);
    },
    [],
  );

  // Public play: gate through the Spotify Premium prompt on first ever press.
  const play = React.useCallback(
    (t: PlayerTrack, q?: PlayerTrack[], i?: number) => {
      const alreadyPrompted =
        typeof localStorage !== "undefined" &&
        localStorage.getItem("sf_spotify_prompted") === "1";
      if (!alreadyPrompted && !spotifyConnected) {
        pendingPlayRef.current = { t, q, i };
        setShowSpotifyPrompt(true);
        return;
      }
      _doPlay(t, q, i);
    },
    [_doPlay, spotifyConnected],
  );

  const confirmSpotifyConnect = React.useCallback(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sf_spotify_prompted", "1");
    }
    setShowSpotifyPrompt(false);
    window.location.href = "/api/spotify/login";
  }, []);

  const skipToPreview = React.useCallback(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sf_spotify_prompted", "1");
    }
    setShowSpotifyPrompt(false);
    const pending = pendingPlayRef.current;
    pendingPlayRef.current = null;
    if (pending) _doPlay(pending.t, pending.q, pending.i);
  }, [_doPlay]);

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
    () => ({
      current, play, close, next, prev, hasNext, hasPrev, playToken, playing,
      togglePlayback, showSpotifyPrompt, confirmSpotifyConnect, skipToPreview,
    }),
    [current, play, close, next, prev, hasNext, hasPrev, playToken, playing,
     togglePlayback, showSpotifyPrompt, confirmSpotifyConnect, skipToPreview],
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

  // — Spotify full-track engine (opt-in). When the listener is connected, a play
  //   press tries Spotify for the FULL track; any miss falls back to the 30s
  //   preview below — so the keyless player is unchanged when Spotify is absent. —
  const sp = React.useRef<ReturnType<typeof getSpotifyPlayback> | null>(null);
  const spConnectedRef = React.useRef(false);
  const [usingSpotify, setUsingSpotify] = React.useState(false);
  const usingSpotifyRef = React.useRef(false);
  const [spState, setSpState] = React.useState<SpotifyState | null>(null);

  const trackTitle = current?.title;
  const trackArtist = current?.artist;

  // Detect Spotify config/session + subscribe to live playback state.
  React.useEffect(() => {
    sp.current = getSpotifyPlayback();
    let active = true;
    fetch("/api/spotify/token", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        spConnectedRef.current = Boolean(d?.hasSession);
      })
      .catch(() => {});
    const unsub = sp.current.subscribe((s) => {
      if (active) setSpState(s);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

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

  const playedTokenRef = React.useRef(playToken);

  // Play the resolved 30s preview through <audio> (the default / fallback
  // engine). No-op while Spotify is handling the current track.
  const playPreview = React.useCallback(
    (token: number) => {
      const a = audioRef.current;
      if (!a || usingSpotifyRef.current) return;
      if (!loaded || !detail?.previewUrl) return; // resolve effect retries on load
      playedTokenRef.current = token;
      a.volume = vol;
      a.muted = muted;
      a.currentTime = 0;
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    },
    [loaded, detail?.previewUrl, vol, muted, setPlaying],
  );

  // Resolve a Spotify track URI for a track (known 22-char id, else search).
  const resolveUri = React.useCallback(
    async (t: PlayerTrack): Promise<string | null> => {
      try {
        const p = new URLSearchParams();
        if (t.id && /^[A-Za-z0-9]{22}$/.test(t.id)) p.set("id", t.id);
        p.set("title", t.title);
        p.set("artist", t.artist || "");
        const r = await fetch(`/api/spotify/uri?${p.toString()}`, { cache: "no-store" });
        const d = await r.json();
        return typeof d?.uri === "string" ? d.uri : null;
      } catch {
        return null;
      }
    },
    [],
  );

  // Full-track engine: on a fresh play press (token bumped), try Spotify first
  // when connected. Optimistically claims the token so the preview engine waits;
  // on ANY miss (no URI / not premium / error) it releases to the preview.
  const spTokenRef = React.useRef(playToken);
  React.useEffect(() => {
    if (playToken === spTokenRef.current) return;
    spTokenRef.current = playToken;
    if (!current) return;
    if (!spConnectedRef.current) {
      usingSpotifyRef.current = false;
      setUsingSpotify(false);
      return;
    }
    usingSpotifyRef.current = true;
    setUsingSpotify(true);
    const token = playToken;
    const trackForToken = current;
    let cancelled = false;
    (async () => {
      const uri = await resolveUri(trackForToken);
      if (cancelled) return;
      const ok = uri && sp.current ? await sp.current.playUri(uri) : false;
      if (cancelled) return;
      if (ok) {
        const a = audioRef.current;
        if (a && !a.paused) a.pause(); // no double audio
        setPlaying(true);
      } else {
        usingSpotifyRef.current = false;
        setUsingSpotify(false);
        playPreview(token);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);

  // Preview engine: play once the preview resolves, for a fresh play press that
  // Spotify isn't handling. Never auto-plays on load (gated on the token).
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a || !loaded || !detail?.previewUrl) return;
    if (usingSpotifyRef.current) return; // Spotify owns this track
    if (playToken === playedTokenRef.current) return;
    playedTokenRef.current = playToken;
    a.volume = vol;
    a.muted = muted;
    a.currentTime = 0;
    a.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, loaded, detail?.previewUrl]);

  // Mirror Spotify's paused state into the shared `playing` flag. Keyed on the
  // paused flag only (not the whole state, which ticks position every second).
  React.useEffect(() => {
    if (usingSpotify && spState) setPlaying(!spState.paused);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingSpotify, spState?.paused, setPlaying]);

  // Keep volume / mute in sync with the active engine.
  React.useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = vol;
      a.muted = muted;
    }
    if (usingSpotifyRef.current) sp.current?.setVolume(muted ? 0 : vol);
  }, [vol, muted, usingSpotify]);

  // Never let a track keep playing onto a page the user navigated to: pause both
  // engines on route change. Playback only ever resumes on a play press.
  const pathname = usePathname();
  React.useEffect(() => {
    const a = audioRef.current;
    if (a && !a.paused) a.pause();
    if (usingSpotifyRef.current) sp.current?.pause();
    setPlaying(false);
  }, [pathname, setPlaying]);

  // Closing the player (queue cleared) must also stop the Spotify device.
  React.useEffect(() => {
    if (!current && usingSpotifyRef.current) {
      sp.current?.pause();
      usingSpotifyRef.current = false;
      setUsingSpotify(false);
    }
  }, [current]);

  // Expose play/pause to the context so ANY play control can toggle this track.
  React.useEffect(() => {
    registerToggle(toggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!current) return null;

  const title = detail?.title || current.title;
  const artist = detail?.artist || current.artist;
  const art = detail?.artworkUrl ?? null;
  // A real 22-char Spotify id (when the track was launched with one) so the star
  // saved from here carries it through to the Starred section.
  const spId =
    current.id && /^[A-Za-z0-9]{22}$/.test(current.id) ? current.id : null;
  // Unified transport state across the two engines (Spotify full track vs preview).
  const isFull = usingSpotify;
  const hasPreviewReal = Boolean(detail?.previewUrl) && !audioError;
  const hasPreview = isFull ? true : hasPreviewReal; // is there anything to play?
  const isReady = isFull ? true : loaded;
  const dispTime = isFull && spState ? spState.positionMs / 1000 : time;
  const dispDur = isFull && spState ? spState.durationMs / 1000 : dur;
  const pct = dispDur > 0 ? (dispTime / dispDur) * 100 : 0;
  const spErr = spState?.error ?? null;

  function toggle() {
    if (usingSpotifyRef.current) {
      sp.current?.toggle();
      return;
    }
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
    if (usingSpotifyRef.current) {
      sp.current?.seek(v * 1000);
      setTime(v);
      return;
    }
    const a = audioRef.current;
    if (a) a.currentTime = v;
    setTime(v);
  }
  // Spotify-style previous: restart if we're past 3s or there's no earlier
  // track, otherwise jump to the previous track in the queue.
  function onPrev() {
    const pos = usingSpotifyRef.current ? dispTime : audioRef.current?.currentTime ?? 0;
    if (hasPrev && pos <= 3) prev();
    else seek(0);
  }
  function onEnded() {
    // Stop at the end — never auto-advance into the next track.
    setPlaying(false);
  }

  return (
    // The music player is ALWAYS docked at the footer (bottom of the screen). On
    // the Research page the search bar sits just above it and the results above
    // that — a clean static stack (see ResearchChat, which measures this element
    // via `data-sf-player`).
    <div
      data-sf-player
      className="fixed left-3 right-3 z-50 flex justify-center lg:left-[280px]"
      style={{ bottom: "var(--sf-player-bottom, 1rem)" }}
    >
      <div className="sf-liquid relative flex w-full max-w-[920px] items-center gap-2.5 overflow-hidden rounded-full border border-white/10 px-3 py-1.5 shadow-2xl shadow-black/40 sm:gap-3 sm:px-4">
        {/* Mobile-only seek bar pinned to the top edge (desktop has the full scrubber). */}
        {isReady && hasPreview && (
          <input
            type="range"
            min={0}
            max={dispDur || 30}
            step={0.1}
            value={dispTime}
            onChange={(e) => seek(Number(e.target.value))}
            style={sliderFill(pct)}
            className="sf-range absolute inset-x-0 top-0 sm:hidden"
            aria-label="Seek"
            aria-valuetext={`${fmt(dispTime)} of ${fmt(dispDur || 30)}`}
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
            disabled={!isReady || !hasPreview}
            aria-label={playing ? "Pause" : "Play"}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-950 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 ${FOCUS_RING}`}
          >
            {!isReady || (buffering && playing && !isFull) ? (
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
            {isFull ? (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-lime-300">
                <span className="h-1 w-1 rounded-full bg-lime-400" /> Full track · Spotify
              </p>
            ) : spErr ? (
              <p className="mt-0.5 truncate text-[9px] text-amber-300">{spErr}</p>
            ) : null}
          </div>
        </div>

        {/* Scrubber (desktop) */}
        {!isReady ? (
          <div className="hidden flex-1 items-center gap-2 text-[11px] text-soft sm:flex">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Loading…
          </div>
        ) : hasPreview ? (
          <div className="hidden flex-1 items-center gap-2 sm:flex">
            <span className="w-8 text-right text-[10px] tabular-nums text-soft">{fmt(dispTime)}</span>
            <input
              type="range"
              min={0}
              max={dispDur || 30}
              step={0.1}
              value={dispTime}
              onChange={(e) => seek(Number(e.target.value))}
              style={sliderFill(pct)}
              className="sf-range flex-1"
              aria-label="Seek"
              aria-valuetext={`${fmt(dispTime)} of ${fmt(dispDur || 30)}`}
            />
            <span className="w-8 text-[10px] tabular-nums text-soft">{fmt(dispDur || 30)}</span>
          </div>
        ) : (
          <span className="hidden flex-1 text-[11px] text-soft sm:block">Preview unavailable</span>
        )}

        {/* RIGHT: volume + close */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {isReady && hasPreview && (
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
                aria-valuetext={`${Math.round((muted ? 0 : vol) * 100)}% volume`}
              />
            </div>
          )}
          <StarButton
            track={{ title, artist, spotifyTrackId: spId, artworkUrl: art }}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-soft transition hover:text-lime-300 aria-pressed:text-lime-300 ${FOCUS_RING}`}
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close player"
            className={`rounded-full p-1 text-soft transition hover:text-white ${FOCUS_RING}`}
          >
            <CloseIcon />
          </button>
        </div>

        {!isFull && hasPreviewReal && (
          <audio
            ref={audioRef}
            src={detail!.previewUrl!}
            // NEVER auto-play: audio only ever starts from an explicit play press
            // (the play-intent effect / toggle). Belt-and-suspenders at the element.
            autoPlay={false}
            // metadata only: don't keep buffering the 30s preview after a
            // route-change pause (we pause on nav); the user re-buffers on play.
            preload="metadata"
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
