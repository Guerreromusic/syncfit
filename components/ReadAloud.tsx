"use client";

import * as React from "react";
import { usePlayer } from "./PlayerContext";

// One probe of /api/tts per session — the button hides when TTS isn't configured.
let configuredCache: boolean | null = null;

type State = "idle" | "loading" | "playing" | "error";

/**
 * "Read aloud" — narrates SyncFit-generated text (pitch / score result) using
 * ElevenLabs via /api/tts. Renders nothing when TTS isn't configured. Plays on a
 * standalone audio element and pauses the music player so they never overlap.
 */
export function ReadAloud({
  text,
  label = "Read aloud",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [available, setAvailable] = React.useState<boolean>(configuredCache ?? false);
  const [state, setState] = React.useState<State>("idle");
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

  function stop() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setState("idle");
  }

  async function toggle() {
    if (state === "loading") return;
    if (state === "playing") {
      stop();
      return;
    }
    if (!text.trim()) return;
    setState("loading");
    // Don't talk over the music.
    if (musicPlaying) togglePlayback();
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const a = audioRef.current ?? new Audio();
      audioRef.current = a;
      a.src = url;
      a.onended = () => setState("idle");
      a.onerror = () => setState("error");
      await a.play();
      setState("playing");
    } catch {
      setState("error");
    }
  }

  if (!available) return null;

  const playing = state === "playing";
  const loading = state === "loading";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Stop reading aloud" : label}
      title={state === "error" ? "Couldn’t read aloud — try again" : playing ? "Stop" : label}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
      }
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
      ) : playing ? (
        <StopIcon />
      ) : (
        <SpeakerIcon />
      )}
      {playing ? "Stop" : label}
    </button>
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
function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
