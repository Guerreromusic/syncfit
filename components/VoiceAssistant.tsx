"use client";

import * as React from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type { TrackQAContext } from "@/lib/types";
import { usePlayer } from "./PlayerContext";

// One probe of /api/voice per session — the button hides when the voice agent
// (ElevenLabs key + agent id) isn't configured.
let availableCache: boolean | null = null;

// Map a track's language to an ElevenLabs ConvAI language code (best-effort).
function pickLanguage(language?: string): string {
  const l = (language || "").toLowerCase();
  if (l.startsWith("span") || l === "es") return "es";
  if (l.startsWith("port") || l === "pt") return "pt";
  if (l.startsWith("fren") || l === "fr") return "fr";
  if (l.startsWith("ital") || l === "it") return "it";
  if (l.startsWith("germ") || l === "de") return "de";
  return "en";
}

// The per-conversation system prompt — REPLACES the agent's default prompt so
// every answer is grounded in this specific track + brief. Never includes lyrics.
function buildPrompt(ctx: TrackQAContext): string {
  const facts = [
    `Track: "${ctx.title}" by ${ctx.artist}`,
    ctx.genre && `Genre: ${ctx.genre}`,
    ctx.language && `Language: ${ctx.language}`,
    ctx.brief && `Creative brief: ${ctx.brief}`,
    ctx.syncFitScore != null &&
      `SyncFit score: ${ctx.syncFitScore}/100${ctx.scoreLabel ? ` (${ctx.scoreLabel})` : ""}`,
    ctx.reason && `Why it fits: ${ctx.reason}`,
    ctx.bestUse && `Best use: ${ctx.bestUse}`,
    ctx.brandSafety && `Brand safety: ${ctx.brandSafety}`,
    ctx.pitchSummary && `Pitch summary: ${ctx.pitchSummary}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "You are SyncFit's voice assistant for music supervisors. SyncFit by Synclat is a worldwide music-sync research tool.",
    "A supervisor is evaluating ONE specific track for a sync placement and is talking to you about it.",
    "Answer ONLY about this track and its fit for sync — mood and energy, fit for the brief, brand safety, best scene or use case, audience, comparable tracks, and licensing considerations.",
    "Be concrete and practical. Keep spoken answers short: one to three sentences unless asked to expand. Never reproduce song lyrics.",
    "",
    "Here are the facts about the track:",
    facts,
  ].join("\n");
}

function MicGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function VoiceAssistantInner({
  ctx,
  label = "Talk",
}: {
  ctx: TrackQAContext;
  label?: string;
}) {
  const conversation = useConversation({
    onError: () => setErr("Couldn’t start — allow microphone access and try again."),
  });
  const { status, isSpeaking, startSession, endSession } = conversation;

  const [available, setAvailable] = React.useState<boolean>(availableCache ?? false);
  const [starting, setStarting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const { playing: musicPlaying, togglePlayback } = usePlayer();

  React.useEffect(() => {
    if (availableCache !== null) {
      setAvailable(availableCache);
      return;
    }
    let active = true;
    fetch("/api/voice")
      .then((r) => r.json())
      .then((d) => {
        availableCache = Boolean(d?.configured);
        if (active) setAvailable(availableCache);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // End the session if the component unmounts mid-call.
  React.useEffect(
    () => () => {
      try {
        endSession();
      } catch {
        /* not connected */
      }
    },
    [endSession],
  );

  async function start() {
    setErr(null);
    setStarting(true);
    if (musicPlaying) togglePlayback(); // don't talk over the music
    try {
      const res = await fetch("/api/voice");
      const data = (await res.json()) as { signedUrl?: string; error?: string };
      if (!data.signedUrl) {
        setErr(data.error || "Voice assistant is unavailable.");
        return;
      }
      await startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: { prompt: buildPrompt(ctx) },
            firstMessage: `Hey — ask me anything about "${ctx.title}" by ${ctx.artist} and how it fits your brief.`,
            language: pickLanguage(ctx.language) as never,
          },
        },
      });
    } catch {
      setErr("Couldn’t start the voice assistant. Check mic permissions.");
    } finally {
      setStarting(false);
    }
  }

  if (!available) return null;

  const connecting = starting || status === "connecting";
  const connected = status === "connected";

  if (connected) {
    return (
      <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-lime-400/40 bg-lime-400/10 px-2.5 py-1">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={
              "absolute inline-flex h-full w-full rounded-full opacity-75 " +
              (isSpeaking ? "animate-ping bg-purple-400" : "animate-ping bg-lime-400")
            }
          />
          <span
            className={
              "relative inline-flex h-2.5 w-2.5 rounded-full " +
              (isSpeaking ? "bg-purple-400" : "bg-lime-400")
            }
          />
        </span>
        <span className="text-xs font-semibold text-white">
          {isSpeaking ? "Speaking…" : "Listening…"}
        </span>
        <button
          type="button"
          onClick={() => endSession()}
          className="ml-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-white/20"
        >
          End
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={start}
        disabled={connecting}
        title={err || "Talk to SyncFit about this track (hands-free)"}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-lime-400/50 hover:text-white disabled:opacity-60"
      >
        {connecting ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        ) : (
          <MicGlyph className="h-3.5 w-3.5" />
        )}
        {connecting ? "Connecting…" : label}
      </button>
      {err ? <span className="text-[11px] text-red-300">{err}</span> : null}
    </span>
  );
}

/**
 * Hands-free voice assistant for a single track — powered by ElevenLabs
 * Conversational AI. Tap "Talk", speak your question, hear the answer back, all
 * grounded in this track + brief (injected as a per-conversation prompt
 * override). Renders nothing when the voice agent isn't configured.
 */
export function VoiceAssistant(props: { ctx: TrackQAContext; label?: string }) {
  return (
    <ConversationProvider>
      <VoiceAssistantInner {...props} />
    </ConversationProvider>
  );
}
