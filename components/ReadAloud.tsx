"use client";

import * as React from "react";
import { usePlayer } from "./PlayerContext";

// One probe of /api/tts per session — the control hides when TTS isn't configured.
let configuredCache: boolean | null = null;

type Status = "idle" | "loading" | "ready" | "error";

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
function sliderFill(pct: number): React.CSSProperties {
  const p = Math.max(0, Math.min(100, pct));
  return {
    backgroundImage: `linear-gradient(to right, rgb(163 230 53) ${p}%, rgba(255,255,255,0.15) ${p}%)`,
  };
}

/**
 * "Read aloud" — narrates SyncFit-generated text (pitch / score result) via
 * ElevenLabs (/api/tts). Generates the audio, then shows an inline player with a
 * play/pause button + progress bar. Playback is driven by an explicit click (so
 * it's never blocked by the browser's autoplay policy). Pauses the music player
 * so the two never overlap. Renders nothing when TTS isn't configured.
 */
export function ReadAloud({
  text,
  label = "Read aloud",
}: {
  text: string;
  label?: string;
}) {
  const [available, setAvailable] = React.useState<boolean>(configuredCache ?? false);
  const [status, setStatus] = React.useState<Status>("idle");
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const urlRef = React.useRef<string | null>(null);
  const { playing: musicPlaying, togglePlayback } = usePlayer();

  React.useEffect(() => {
    if (configuredCache !== null) {
      setAvailable(configuredCache);
      return;
    }
    let active = true;
    fetch("/api/tts")
      .then((r) => r.json())
      .then((d) => {
        configuredCache = Boolean(d?.configured);
        if (active) setAvailable(configuredCache);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(
    () => () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  // If the source text changes (e.g. a different track's pitch), reset.
  React.useEffect(() => {
    setStatus("idle");
    setPlaying(false);
    setTime(0);
    setDur(0);
  }, [text]);

  async function generate() {
    if (status === "loading" || !text.trim()) return;
    setStatus("loading");
    if (musicPlaying) togglePlayback(); // don't talk over the music
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      const a = audioRef.current;
      if (a) {
        a.src = urlRef.current;
        a.currentTime = 0;
      }
      setStatus("ready");
      // Try to auto-play; if the browser blocks it, the visible play button is
      // the reliable path (a fresh user gesture).
      a?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } catch {
      setStatus("error");
    }
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (musicPlaying) togglePlayback();
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
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
  function close() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setStatus("idle");
    setPlaying(false);
    setTime(0);
    setDur(0);
  }

  if (!available) return null;

  // ElevenLabs returns a streamed MP3, which some browsers report as
  // `Infinity`/`NaN` duration. The standard fix: seek far past the end once, which
  // forces the browser to compute the real length (delivered via `durationchange`).
  function handleLoadedMetadata(e: React.SyntheticEvent<HTMLAudioElement>) {
    const a = e.currentTarget;
    if (Number.isFinite(a.duration) && a.duration > 0) {
      setDur(a.duration);
    } else {
      try {
        a.currentTime = 1e7;
      } catch {
        /* ignore */
      }
    }
  }
  function handleDurationChange(e: React.SyntheticEvent<HTMLAudioElement>) {
    const a = e.currentTarget;
    if (Number.isFinite(a.duration) && a.duration > 0) {
      setDur(a.duration);
      if (a.currentTime > a.duration) {
        a.currentTime = 0;
        setTime(0);
      }
    }
  }

  const audioEl = (
    <audio
      ref={audioRef}
      className="hidden"
      preload="auto"
      onLoadedMetadata={handleLoadedMetadata}
      onDurationChange={handleDurationChange}
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onEnded={() => {
        setPlaying(false);
        setTime(0);
      }}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
    />
  );

  // Inline player once the audio is ready.
  if (status === "ready") {
    const pct = dur > 0 ? (time / dur) * 100 : 0;
    return (
      <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-1">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause narration" : "Play narration"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-ink-950 transition hover:scale-105"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={dur || 1}
          step={0.1}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
          style={sliderFill(pct)}
          className="sf-range w-20 sm:w-28"
          aria-label="Narration progress"
          aria-valuetext={`${fmt(time)} of ${fmt(dur)}`}
        />
        <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-soft">
          {fmt(time)}
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Close narration"
          className="shrink-0 text-soft transition hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {audioEl}
      </div>
    );
  }

  // Trigger button (idle / loading / error).
  const loading = status === "loading";
  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        aria-label={status === "error" ? "Retry read aloud" : label}
        title={status === "error" ? "Couldn’t generate audio — click to retry" : label}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-60"
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        ) : (
          <SpeakerIcon />
        )}
        {loading ? "Generating…" : status === "error" ? "Retry" : label}
      </button>
      {audioEl}
    </>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
      <path d="M16 9a3.5 3.5 0 0 1 0 6M19 6a7 7 0 0 1 0 12" />
    </svg>
  );
}
