"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SparkIcon, ArrowRightIcon, CloseIcon, ChatBotIcon } from "./icons";

type Msg = { role: "user" | "assistant"; content: string };

// Per-section context the assistant is briefed with.
const SECTIONS: { test: (p: string) => boolean; name: string; context: string; starters: string[] }[] = [
  {
    test: (p) => p === "/",
    name: "Dashboard",
    context:
      "It shows trending music across genres, the user's stats (reports run, average SyncFit score, research hours saved), and their most recent score reports.",
    starters: ["What can I do here?", "What does the average score mean?"],
  },
  {
    test: (p) => p.startsWith("/starred"),
    name: "Starred",
    context:
      "It lists tracks the user starred from research. They can play them, un-star, or send one back to Research to score against a brief.",
    starters: ["How do I star a track?", "What can I do with starred tracks?"],
  },
  {
    test: (p) => p.startsWith("/report"),
    name: "Score reports",
    context:
      "Saved SyncFit score reports — each scores a track against a brief with a 7-part breakdown, brand-safety read, pitch summary, lyric translation, credits, streaming data, and a worldwide influence map. Reports can be played, renamed, archived, and asked about.",
    starters: ["What's in a score report?", "How is the SyncFit Score calculated?"],
  },
  {
    test: (p) => p.startsWith("/projects"),
    name: "Projects",
    context:
      "Pitch projects — pitch a single track, or bundle several into one swipeable multi-track pitch. Each can be renamed, archived, and shared with a public link.",
    starters: ["How do I build a pitch project?", "How does sharing work?"],
  },
  {
    test: (p) => p.startsWith("/arena"),
    name: "Track Arena",
    context: "Benchmark up to 3 tracks head-to-head against one creative brief.",
    starters: ["How do I compare tracks here?"],
  },
  {
    test: (p) => p.startsWith("/info"),
    name: "How it works",
    context: "Explains how SyncFit works, its features, the data sources, and compliance.",
    starters: ["Give me a quick overview", "Which APIs power this?"],
  },
  {
    test: (p) => p.startsWith("/settings"),
    name: "Settings",
    context: "Shows API connection status and how the user's data is handled.",
    starters: ["What data does SyncFit store?", "What's connected?"],
  },
];

function sectionFor(p: string) {
  return (
    SECTIONS.find((s) => s.test(p)) ?? {
      name: "SyncFit",
      context: "",
      starters: ["What can I do here?"],
    }
  );
}

export function SectionChat() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const threadRef = React.useRef<HTMLDivElement>(null);
  const sec = sectionFor(pathname);

  React.useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Fresh conversation when the section changes.
  React.useEffect(() => {
    setMessages([]);
  }, [sec.name]);

  // Research is already a chat; public /share pages are chrome-free.
  if (pathname.startsWith("/share") || pathname.startsWith("/analyzer")) return null;

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/section-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sec.name, context: sec.context, messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages([
        ...next,
        { role: "assistant", content: res.ok ? data.answer : data.error || "Couldn’t answer." },
      ]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Network error — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close section assistant" : `Ask about ${sec.name}`}
        title={`Ask about ${sec.name}`}
        // Float above the docked footer player (which sits at --sf-player-bottom)
        // so the two never overlap on pages where both are visible.
        style={{ bottom: "calc(var(--sf-player-bottom, 1rem) + 4.5rem)" }}
        className="sf-liquid fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-lime-300 shadow-2xl shadow-black/40 transition hover:scale-105"
      >
        {open ? <CloseIcon /> : <ChatBotIcon className="h-5 w-5" aria-hidden />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={`Ask about ${sec.name}`}
          aria-modal="false"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          style={{ bottom: "calc(var(--sf-player-bottom, 1rem) + 8rem)" }}
          className="sf-liquid fixed right-4 z-40 flex h-[62vh] max-h-[540px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <SparkIcon className="h-4 w-4 text-lime-400" aria-hidden />
              <p className="text-sm font-semibold text-white">Ask about {sec.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-soft transition hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3 px-1 py-2">
                <p className="text-sm text-soft">
                  Ask me anything about <span className="text-white">{sec.name}</span> or how to use SyncFit.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sec.starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-soft transition hover:border-purple-400/50 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-purple-600/25 px-3 py-2 text-sm text-white ring-1 ring-inset ring-purple-500/30">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-relaxed text-white">
                      {m.content}
                    </div>
                  </div>
                ),
              )
            )}
            {busy && (
              <div className="flex items-center gap-2 px-1 text-xs text-soft">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-white/10 p-2.5"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/70 px-3 py-1.5 focus-within:border-purple-400/60">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${sec.name}…`}
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-soft/80 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="sf-btn-white shrink-0 !px-2.5 !py-1.5"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
