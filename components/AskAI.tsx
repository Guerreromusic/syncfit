"use client";

import * as React from "react";
import { SparkIcon } from "./icons";
import type { TrackQAContext, TrackQAMessage } from "@/lib/types";

const SUGGESTED = [
  "Why does it fit?",
  "Any brand-safety risks?",
  "Best scene to use it?",
  "Similar tracks?",
];

/**
 * Per-card "Ask AI" — a compact, collapsible chat about ONE track, answered by
 * OpenRouter via /api/ask. Lives inside any result card; starts collapsed to keep
 * the UI clean and expands inline on demand.
 */
export function AskAI({
  context,
  model,
  label = "Ask AI",
}: {
  context: TrackQAContext;
  model?: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<TrackQAMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const threadRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    const next: TrackQAMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, messages: next, model }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't get an answer.");
      } else {
        setMessages([...next, { role: "assistant", content: data.answer }]);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-100 transition hover:border-purple-400/60 hover:bg-purple-500/20"
      >
        <SparkIcon className="h-3.5 w-3.5 text-lime-400" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <div
      className="mt-1 rounded-xl border border-purple-400/25 bg-purple-500/[0.06]"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-purple-100">
          <SparkIcon className="h-3.5 w-3.5 shrink-0 text-lime-400" aria-hidden />
          <span className="truncate">Ask AI about “{context.title}”</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Ask AI"
          className="text-soft transition hover:text-white"
        >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      </div>

      {/* Thread */}
      {(messages.length > 0 || loading) && (
        <div ref={threadRef} className="max-h-56 space-y-2 overflow-y-auto px-3 py-2.5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-sm bg-lime-400/90 px-3 py-1.5 text-xs font-medium text-ink-950"
                  : "w-fit max-w-[92%] rounded-2xl rounded-bl-sm bg-white/[0.06] px-3 py-1.5 text-xs leading-relaxed text-white"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.06] px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-200 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-200 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-200" />
            </div>
          )}
        </div>
      )}

      {/* Suggested questions (only before any conversation) */}
      {messages.length === 0 && !loading && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-soft transition hover:border-purple-400/50 hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="px-3 pb-1 text-[11px] text-red-300">
          {error}
        </p>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-white/5 px-3 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this track…"
          aria-label={`Ask AI about ${context.title}`}
          className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-soft focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-400 text-ink-950 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <path d="M3 11l18-8-8 18-2-7-8-3z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
