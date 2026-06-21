"use client";

import * as React from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { usePlayer } from "./PlayerContext";

type Turn = { role: "user" | "ai"; text: string };

const STARTERS = [
  "What makes a track score high for an upbeat fashion ad?",
  "How does SyncFit weigh brand safety?",
  "What's the difference between the Nano, Micro and Bespoke license tiers?",
  "Help me brief music for a sports matchday moment.",
];

// The SyncFit Agent's system prompt (a per-conversation override). General
// music-sync partner — knows the scoring model + the data SyncFit draws on.
const AGENT_PROMPT = [
  "You are the SyncFit Agent — a worldwide music-sync research partner for music supervisors, by Synclat.",
  "Help the user find, evaluate, and pitch tracks for sync placements (ads, film, TV, trailers, games, social).",
  "You understand SyncFit's scoring model: a 0–100 SyncFit Score from seven weighted factors — Brief Match (25), Lyric & Context Fit (20), Mood/Energy Fit (15), Brand Safety (15), License Readiness (10), Market Signal (10), Production Fit (5).",
  "You can discuss a track's fit for a brief, brand-safety risks, best scenes or use cases, comparable tracks, audience, and licensing tiers (Nano, Micro, Bespoke).",
  "SyncFit draws on Musixmatch, Songstats, MusicBrainz and an AI reasoning layer. To run a full live score on a specific named track, point the user to the Research tab.",
  "Be concrete, practical and concise — keep spoken answers to one to four sentences unless asked to expand. Never reproduce song lyrics.",
].join(" ");

const FIRST_MESSAGE =
  "Hey — I'm your SyncFit agent. Tell me about your placement, or ask me about a track, a brief, brand safety, or licensing.";

function MicGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function AgentConsoleInner() {
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState("");
  const [starting, setStarting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const pendingRef = React.useRef<string | null>(null);
  const threadRef = React.useRef<HTMLDivElement>(null);
  const { playing: musicPlaying, togglePlayback } = usePlayer();

  const conversation = useConversation({
    onConnect: () => {
      setErr(null);
      // Flush a message typed before the session finished connecting.
      if (pendingRef.current) {
        const t = pendingRef.current;
        pendingRef.current = null;
        try {
          conversation.sendUserMessage(t);
        } catch {
          /* ignore */
        }
      }
    },
    onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
      if (!message) return;
      setTurns((prev) => [...prev, { role: source, text: message }]);
    },
    onError: (message?: string) => {
      // eslint-disable-next-line no-console
      console.error("[AgentConsole] error:", message);
      setErr(message ? `Voice error: ${message}` : "Couldn’t connect — try again.");
      setStarting(false);
    },
  });
  const { status, isSpeaking, startSession, endSession, sendUserMessage } = conversation;
  const connected = status === "connected";
  const connecting = starting || status === "connecting";

  React.useEffect(() => {
    let active = true;
    fetch("/api/voice")
      .then((r) => r.json())
      .then((d) => active && setAvailable(Boolean(d?.configured)))
      .catch(() => active && setAvailable(false));
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, connecting]);

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

  const overrides = {
    agent: {
      prompt: { prompt: AGENT_PROMPT },
      firstMessage: FIRST_MESSAGE,
      language: "en" as never,
    },
  };

  async function mintSignedUrl(): Promise<string | null> {
    const res = await fetch("/api/voice");
    const data = (await res.json()) as { signedUrl?: string; error?: string };
    if (!data.signedUrl) {
      setErr(data.error || "Agent is unavailable.");
      return null;
    }
    return data.signedUrl;
  }

  // Voice: acquire the mic INSIDE the click gesture (before any await) so the
  // browser doesn't block it, then open a spoken session.
  async function startVoice() {
    setErr(null);
    setStarting(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr("Voice needs a modern browser over HTTPS.");
      setStarting(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      const name = (e as { name?: string })?.name || "";
      setErr(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone blocked — allow mic access for this site, then try again."
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "No microphone found — type below instead, or connect a mic."
            : "Couldn’t access the microphone — type below instead.",
      );
      setStarting(false);
      return;
    }
    if (musicPlaying) togglePlayback();
    try {
      const signedUrl = await mintSignedUrl();
      if (!signedUrl) {
        setStarting(false);
        return;
      }
      await startSession({ signedUrl, connectionType: "websocket", overrides });
    } catch {
      setErr("Couldn’t connect to the agent — try again.");
    } finally {
      setStarting(false);
    }
  }

  // Text: open a text-only session (no mic) if needed, then send.
  async function sendText(text: string) {
    const q = text.trim();
    if (!q) return;
    setErr(null);
    setInput("");
    if (connected) {
      setTurns((prev) => [...prev, { role: "user", text: q }]);
      try {
        sendUserMessage(q);
      } catch {
        setErr("Couldn’t send — try again.");
      }
      return;
    }
    // Not connected yet → start a text-only session and flush on connect.
    setStarting(true);
    setTurns((prev) => [...prev, { role: "user", text: q }]);
    pendingRef.current = q;
    try {
      const signedUrl = await mintSignedUrl();
      if (!signedUrl) {
        pendingRef.current = null;
        setStarting(false);
        return;
      }
      await startSession({
        signedUrl,
        connectionType: "websocket",
        textOnly: true,
        overrides,
      });
    } catch {
      pendingRef.current = null;
      setErr("Couldn’t connect to the agent — try again.");
    } finally {
      setStarting(false);
    }
  }

  if (available === null) {
    return (
      <div className="sf-card sf-card-pad text-sm text-soft">Loading the agent…</div>
    );
  }
  if (!available) {
    return (
      <div className="sf-card sf-card-pad">
        <p className="text-sm font-semibold text-white">Voice agent not configured</p>
        <p className="mt-1 text-sm text-soft">
          Set <code className="text-purple-200">ELEVENLABS_API_KEY</code> and{" "}
          <code className="text-purple-200">ELEVENLABS_AGENT_ID</code> to enable the
          SyncFit Agent.
        </p>
      </div>
    );
  }

  return (
    <div className="sf-card flex h-[min(72vh,640px)] flex-col overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {connected && (
              <span
                className={
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 " +
                  (isSpeaking ? "bg-purple-400" : "bg-lime-400")
                }
              />
            )}
            <span
              className={
                "relative inline-flex h-2.5 w-2.5 rounded-full " +
                (connected ? (isSpeaking ? "bg-purple-400" : "bg-lime-400") : "bg-white/25")
              }
            />
          </span>
          <span className="text-xs font-semibold text-white">
            {connecting
              ? "Connecting…"
              : connected
                ? isSpeaking
                  ? "Agent speaking…"
                  : "Listening — go ahead"
                : "Agent ready"}
          </span>
        </span>
        {connected ? (
          <button
            type="button"
            onClick={() => endSession()}
            className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20"
          >
            End session
          </button>
        ) : (
          <button
            type="button"
            onClick={startVoice}
            disabled={connecting}
            className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-[11px] font-semibold text-lime-200 transition hover:border-lime-400/70 hover:bg-lime-400/20 disabled:opacity-60"
          >
            <MicGlyph className="h-3.5 w-3.5" />
            Start talking
          </button>
        )}
      </div>

      {/* Transcript */}
      <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {turns.length === 0 && (
          <div className="mx-auto max-w-md py-6 text-center">
            <p className="text-sm text-soft">
              Talk or type to your SyncFit agent about scores, briefs, brand safety,
              and licensing.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendText(s)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-soft transition hover:border-purple-400/50 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-lime-400/90 px-3.5 py-2 text-sm font-medium text-ink-950"
                : "w-fit max-w-[88%] rounded-2xl rounded-bl-sm bg-white/[0.06] px-3.5 py-2 text-sm leading-relaxed text-white"
            }
          >
            {t.text}
          </div>
        ))}
        {connecting && (
          <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.06] px-3.5 py-2.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-200 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-200 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-200" />
          </div>
        )}
      </div>

      {err && (
        <p role="alert" className="px-4 pb-1 text-[11px] text-red-300">
          {err}
        </p>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendText(input);
        }}
        className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-3"
      >
        {!connected && (
          <button
            type="button"
            onClick={startVoice}
            disabled={connecting}
            title="Talk to the agent (hands-free)"
            aria-label="Start talking"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lime-400/40 bg-lime-400/10 text-lime-200 transition hover:border-lime-400/70 hover:bg-lime-400/20 disabled:opacity-60"
          >
            <MicGlyph className="h-4 w-4" />
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? "Type a message…" : "Ask anything — or tap the mic to talk…"}
          aria-label="Message the SyncFit agent"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder:text-soft focus:border-purple-400/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400 text-ink-950 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M3 11l18-8-8 18-2-7-8-3z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/**
 * The SyncFit Agent console — a full conversational AI partner (ElevenLabs
 * Conversational AI). Talk hands-free or type; a live transcript shows both
 * sides. Grounded in SyncFit's scoring model + data sources via a per-conversation
 * prompt override. COMPLIANCE: only Synclat-generated context is ever sent —
 * never lyrics.
 */
export function AgentConsole() {
  return (
    <ConversationProvider>
      <AgentConsoleInner />
    </ConversationProvider>
  );
}
