"use client";

import * as React from "react";
import Link from "next/link";
import { ModelSwitch } from "./ModelSwitch";
import { SyncFitScoreGauge } from "./SyncFitScoreGauge";
import { TrackCover } from "./TrackCover";
import { SpotifyPlay } from "./SpotifyPlay";
import { AddToArenaButton } from "./AddToArenaButton";
import { BrandLogo } from "./BrandLogo";
import { StarButton } from "./favourites";
import { SparkIcon, ArrowRightIcon, PaperclipIcon, RefreshIcon } from "./icons";
import { MicDictation } from "./MicDictation";
import { usePlayer } from "./PlayerContext";
import { OPENROUTER_MODELS, DEFAULT_OPENROUTER_MODEL } from "@/lib/models";
import { SCORE_MODEL } from "@/lib/scoring";
import { scoreColor } from "@/lib/scoreColor";
import { RESEARCH_SEED_KEY, SELECTED_TRACK_KEY } from "@/lib/keys";
import type { ScoreBreakdown } from "@/lib/types";
import type {
  AnalyzeResult,
  Brief,
  DiscoverResult,
  RankedTrack,
  TrackQAContext,
  TrackQAMessage,
} from "@/lib/types";

// Worldwide-neutral brief defaults — the chat text fills `brief`, the rest stay
// global so discovery isn't biased to any one market/language.
const CHAT_BRIEF: Brief = {
  brief: "",
  projectType: "Ad",
  region: "Global",
  mood: "Energetic",
  language: "Any",
  brandSafety: "Medium",
  licenseTier: "Micro",
};

const SPOTIFY_LINK_RE =
  /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:track|album|playlist)\/|spotify:(?:track|album|playlist):|spotify\.link\/|spotify\.app\.link\//i;
const SPOTIFY_STRIP_RE =
  /https?:\/\/\S*open\.spotify\.com\/\S+|https?:\/\/(?:spotify\.link|spotify\.app\.link)\/\S+|spotify:(?:track|album|playlist):\S+/gi;

// Distributive Omit so each union member keeps its own discriminant keys.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type NewMsg = DistributiveOmit<Msg, "id">;

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; kind: "thinking"; label: string }
  | { id: number; role: "assistant"; kind: "discover"; discover: DiscoverResult; brief: string }
  | { id: number; role: "assistant"; kind: "single"; result: AnalyzeResult; savedId: string | null; brief: string }
  | { id: number; role: "assistant"; kind: "qa"; text: string }
  | { id: number; role: "assistant"; kind: "error"; text: string };

function isQuestion(t: string): boolean {
  const s = t.trim().toLowerCase();
  if (s.endsWith("?")) return true;
  if (s.length > 140) return false;
  // Note: bare brief-style imperatives ("give me…", "describe…", "summarise…",
  // "tell me…", "compare…") are intentionally EXCLUDED — they are common ways to
  // start a NEW placement brief, so routing them to Ask-AI (about the prior
  // track) misfires. Genuine follow-ups still match via the trailing "?" above
  // or the pronoun / "the track" reference below.
  return (
    /^(what|why|how|is|are|can|could|does|do|did|should|would|will|who|which|when|where|explain)\b/.test(s) ||
    /\b(it|this|that|the track|the song|its|their)\b/.test(s)
  );
}

function contextFrom(r: AnalyzeResult, brief: string): TrackQAContext {
  return {
    title: r.track.title,
    artist: r.track.artist,
    brief,
    language: r.track.language,
    genre: r.track.genre,
    syncFitScore: r.analysis.syncFitScore,
    scoreLabel: r.analysis.scoreLabel,
    brandSafety: r.analysis.brandSafety.level,
    bestUse: r.analysis.bestUseCases?.[0],
    pitchSummary: r.analysis.pitchSummary,
  };
}

export function ResearchChat() {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [model, setModel] = React.useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [attaching, setAttaching] = React.useState(false);
  const [attachErr, setAttachErr] = React.useState<string | null>(null);

  const idRef = React.useRef(0);
  const briefRef = React.useRef(""); // last brief text (carried to track picks + QA)
  const ctxRef = React.useRef<TrackQAContext | null>(null); // current track for follow-ups
  const qaRef = React.useRef<TrackQAMessage[]>([]); // running QA history for the current track
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  // Refs for the dynamic footer layout — the docked search bar grows (voice row,
  // locked-track pill, multi-line input), so we MEASURE it and derive both the
  // music-player offset and the chat height from it, so they never clash.
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const chatBoxRef = React.useRef<HTMLDivElement | null>(null);
  const { current: playerCurrent } = usePlayer(); // is the footer player visible?
  const [chatH, setChatH] = React.useState<number | null>(null);

  // A track "deployed" from Trending/Dashboard is LOCKED as the selected track:
  // the next brief the user types is scored against THIS track, not a discovery.
  const selectedTrackRef = React.useRef<{ title: string; artist: string } | null>(null);
  const [selectedTrack, setSelectedTrack] = React.useState<{ title: string; artist: string } | null>(null);
  const selectTrack = React.useCallback(
    (t: { title: string; artist: string } | null) => {
      selectedTrackRef.current = t;
      setSelectedTrack(t);
      // Persist so the lock survives a remount (incl. Strict Mode's dev
      // double-mount) and is scored against the brief the user enters next.
      try {
        if (t) sessionStorage.setItem(SELECTED_TRACK_KEY, JSON.stringify(t));
        else sessionStorage.removeItem(SELECTED_TRACK_KEY);
      } catch {
        /* sessionStorage unavailable */
      }
    },
    [],
  );
  const nextId = () => ++idRef.current;

  // Auto-scroll to the newest message.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Auto-grow the composer so the WHOLE text (typed or pasted) is visible.
  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    if (!input) {
      el.style.height = ""; // empty → natural single-line height
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 360)}px`; // grow to fit, then scroll
  }, [input]);

  // Attach a PDF / Word doc → extract its text → append it to the brief.
  async function onAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setAttachErr(null);
    setAttaching(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.text) {
        setAttachErr(data.error || "Couldn’t read that file.");
        return;
      }
      setInput((prev) => {
        const head = prev.trim() ? prev.replace(/\s+$/, "") + "\n\n" : "";
        const tail = data.truncated ? "\n\n…[brief truncated to fit]" : "";
        return `${head}[From ${data.name}]\n${data.text}${tail}`;
      });
    } catch {
      setAttachErr("Couldn’t read that file. Try again.");
    } finally {
      setAttaching(false);
    }
  }

  const add = React.useCallback((m: NewMsg) => {
    const id = ++idRef.current;
    setMessages((prev) => [...prev, { ...m, id } as Msg]);
    return id;
  }, []);
  const replace = React.useCallback(
    (id: number, m: NewMsg) =>
      setMessages((prev) => prev.map((x) => (x.id === id ? ({ ...m, id } as Msg) : x))),
    [],
  );

  const runResearch = React.useCallback(
    async (opts: { briefText?: string; override?: { title: string; artist: string } }) => {
      const { override } = opts;
      const linkOnly = opts.briefText ? SPOTIFY_LINK_RE.test(opts.briefText) : false;
      const thinkingId = add({
        role: "assistant",
        kind: "thinking",
        label: override
          ? `Scoring “${override.title}” against your brief…`
          : linkOnly
            ? "Resolving the Spotify link and scoring the track…"
            : "Researching the brief for the best-fitting tracks…",
      });
      setBusy(true);

      // Any provided brief text updates the running brief — so deploying a track
      // and THEN typing a brief scores that track against the NEW brief. A bare
      // track-pick (no text) keeps the prior brief.
      if (opts.briefText) {
        const clean = opts.briefText.replace(SPOTIFY_STRIP_RE, "").trim();
        if (clean) briefRef.current = clean;
      }
      const brief: Brief = {
        ...CHAT_BRIEF,
        brief: override ? briefRef.current : (opts.briefText ?? ""),
      };

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief,
            model,
            title: override?.title,
            artist: override?.artist,
            save: true,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          replace(thinkingId, {
            role: "assistant",
            kind: "error",
            text: data.error || "Research failed. Try again.",
          });
          return;
        }
        if (data.mode === "discover") {
          const discover = data.discover as DiscoverResult;
          try {
            sessionStorage.setItem(
              "syncfit:research:tracks",
              JSON.stringify(discover.tracks.slice(0, 3).map((t) => ({ title: t.title, artist: t.artist }))),
            );
            sessionStorage.setItem("syncfit:research:brief", brief.brief.trim());
          } catch {
            /* ignore */
          }
          replace(thinkingId, { role: "assistant", kind: "discover", discover, brief: brief.brief });
        } else {
          const result = data.result as AnalyzeResult;
          ctxRef.current = contextFrom(result, brief.brief);
          qaRef.current = [];
          replace(thinkingId, {
            role: "assistant",
            kind: "single",
            result,
            savedId: data.savedId ?? null,
            brief: brief.brief,
          });
        }
      } catch {
        replace(thinkingId, {
          role: "assistant",
          kind: "error",
          text: "Network error while running SyncFit. Try again.",
        });
      } finally {
        setBusy(false);
      }
    },
    [model, add, replace],
  );

  // "Show 10 more" — re-run discovery for the same brief, excluding the tracks
  // already shown, so the user gets a fresh set of 10 if they're not happy.
  const refreshDiscover = React.useCallback(
    async (briefText: string, prev: RankedTrack[]) => {
      if (busy) return;
      const exclude = prev.map((t) => `${t.title} — ${t.artist}`);
      const thinkingId = add({ role: "assistant", kind: "thinking", label: "Finding 10 more options…" });
      setBusy(true);
      const brief: Brief = { ...CHAT_BRIEF, brief: briefText };
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, model, exclude }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.mode !== "discover") {
          replace(thinkingId, {
            role: "assistant",
            kind: "error",
            text: data.error || "Couldn’t find more options. Try again.",
          });
          return;
        }
        replace(thinkingId, {
          role: "assistant",
          kind: "discover",
          discover: data.discover as DiscoverResult,
          brief: briefText,
        });
      } catch {
        replace(thinkingId, { role: "assistant", kind: "error", text: "Network error. Try again." });
      } finally {
        setBusy(false);
      }
    },
    [busy, model, add, replace],
  );

  const runQA = React.useCallback(
    async (text: string) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const thinkingId = add({ role: "assistant", kind: "thinking", label: `Thinking about “${ctx.title}”…` });
      setBusy(true);
      const msgs: TrackQAMessage[] = [...qaRef.current, { role: "user", content: text }];
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: ctx, messages: msgs, model }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          replace(thinkingId, { role: "assistant", kind: "error", text: data.error || "Couldn't get an answer." });
          return;
        }
        qaRef.current = [...msgs, { role: "assistant", content: data.answer }];
        replace(thinkingId, { role: "assistant", kind: "qa", text: data.answer });
      } catch {
        replace(thinkingId, { role: "assistant", kind: "error", text: "Network error. Try again." });
      } finally {
        setBusy(false);
      }
    },
    [model, add, replace],
  );

  const submit = React.useCallback(
    (raw: string) => {
      const t = raw.trim();
      // Block submit while a file is still extracting, otherwise the typed brief
      // is sent + cleared and the late extraction repopulates an empty composer.
      if (!t || busy || attaching) return;
      setInput("");
      add({ role: "user", text: t });
      const link = SPOTIFY_LINK_RE.test(t);
      if (link) {
        // Pasting a link picks that exact song — clears any deployed selection.
        selectTrack(null);
        void runResearch({ briefText: t });
      } else if (selectedTrackRef.current) {
        // A track was deployed from Trending/Dashboard → score IT against this brief.
        const track = selectedTrackRef.current;
        selectTrack(null);
        void runResearch({ override: track, briefText: t });
      } else if (ctxRef.current && isQuestion(t)) {
        void runQA(t);
      } else {
        void runResearch({ briefText: t });
      }
    },
    [busy, attaching, runQA, runResearch, add, selectTrack],
  );

  // Seed from a trending/dashboard "Deploy" or a suggested alternative.
  React.useEffect(() => {
    try {
      const rawSeed = sessionStorage.getItem(RESEARCH_SEED_KEY);
      if (rawSeed) {
        sessionStorage.removeItem(RESEARCH_SEED_KEY);
        const seed = JSON.parse(rawSeed) as { title?: string; artist?: string; brief?: Brief | null };
        if (seed.title) {
          const track = { title: seed.title, artist: seed.artist ?? "" };
          if (seed.brief?.brief) {
            // Deployed WITH a brief (e.g. a suggested alternative) → score now.
            briefRef.current = seed.brief.brief;
            add({ role: "user", text: track.artist ? `${track.title} — ${track.artist}` : track.title });
            void runResearch({ override: track });
            return;
          }
          // Deployed from Trending/Dashboard with NO brief → LOCK this track. The
          // pill + placeholder are the indicator; the next brief scores it. This
          // persists to SELECTED_TRACK_KEY so it survives a remount.
          selectTrack(track);
          return;
        }
      }
      // No fresh seed — restore a previously-locked track (e.g. after Strict
      // Mode's throwaway mount already consumed the one-shot seed), so a deployed
      // track is NEVER lost before the user enters a brief.
      const rawSel = sessionStorage.getItem(SELECTED_TRACK_KEY);
      if (rawSel) {
        const sel = JSON.parse(rawSel) as { title?: string; artist?: string };
        if (sel.title) selectTrack({ title: sel.title, artist: sel.artist ?? "" });
      }
    } catch {
      /* ignore malformed seed */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Footer layout strategy — the docked search bar is height-VARIABLE (voice row,
  // locked-track pill, multi-line input, errors). Measure it and derive the rest
  // so the music player, the search bar, and the chat results NEVER clash:
  //   • the player floats just ABOVE the bar (--sf-player-bottom = barH + gap)
  //   • the chat area ends above whichever footer element is highest (player when
  //     a track is loaded — it sits above the bar — otherwise the bar itself).
  React.useEffect(() => {
    const GAP = 12;
    const PLAYER_H = 76; // footer player capsule + clearance
    function measure() {
      const bar = barRef.current;
      if (!bar) return;
      const barH = bar.offsetHeight;
      const playerBottom = barH + GAP;
      document.documentElement.style.setProperty("--sf-player-bottom", `${playerBottom}px`);
      const box = chatBoxRef.current;
      if (box) {
        const top = box.getBoundingClientRect().top;
        const reserve = playerBottom + (playerCurrent ? PLAYER_H + GAP : 0);
        setChatH(Math.max(240, Math.round(window.innerHeight - top - reserve)));
      }
    }
    measure();
    // Re-measure on the next frame too — the player capsule mounts a tick after
    // `current` is set, so this guarantees its offset is correct the moment it
    // appears mid-research (capsule never flashes behind the bar).
    const raf = requestAnimationFrame(measure);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && barRef.current) ro.observe(barRef.current);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      // NOTE: do NOT clear --sf-player-bottom here — this cleanup also runs when
      // the player appears/disappears (playerCurrent dep). Clearing it would drop
      // the capsule behind the bar for a frame. It's cleared on unmount below.
    };
  }, [playerCurrent]);

  // Reset the player offset only when leaving the Research page.
  React.useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--sf-player-bottom");
    };
  }, []);

  return (
    <>
      {/* Conversation — height is measured so it always clears the player + bar */}
      <div
        ref={chatBoxRef}
        className="flex min-h-[240px] flex-col"
        style={{ height: chatH ? `${chatH}px` : "calc(100dvh - 12rem)" }}
      >
        {/* Header — just the model switch */}
        <div className="flex items-center justify-end pb-3">
          <ModelSwitch model={model} models={OPENROUTER_MODELS} onChange={setModel} />
        </div>

        <div ref={scrollRef} className="-mr-2 flex-1 space-y-4 overflow-y-auto pb-2 pr-2">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <UserBubble key={m.id} text={m.text} />
              ) : (
                <AssistantMessage
                  key={m.id}
                  msg={m}
                  onPick={(t) => runResearch({ override: { title: t.title, artist: t.artist } })}
                  onRefresh={refreshDiscover}
                />
              ),
            )
          )}
        </div>
      </div>

      {/* Search bar — DOCKED to the footer (right of the sidebar) */}
      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-ink-950/90 px-4 py-3 backdrop-blur-md lg:left-[280px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mx-auto max-w-[920px]"
        >
          <div className="rounded-2xl border border-white/10 bg-ink-900/70 px-3 py-2 focus-within:border-purple-400/60">
            {/* Voice input + (when a track was deployed) the locked-track pill */}
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <MicDictation value={input} onChange={setInput} />
              {selectedTrack && (
                <span className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-lime-400/40 bg-lime-400/10 px-2.5 py-1 text-[11px] font-semibold text-lime-200">
                  <span className="truncate">
                    Scoring: {selectedTrack.title}
                    {selectedTrack.artist ? ` — ${selectedTrack.artist}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectTrack(null)}
                    aria-label="Clear the selected track"
                    title="Clear the selected track"
                    className="shrink-0 text-lime-200/70 transition hover:text-white"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-end gap-2">
            {/* Attach a PDF / Word doc */}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={onAttach}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={attaching}
              aria-label="Attach a PDF or Word document"
              title="Attach a PDF or Word (.docx) brief"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            >
              {attaching ? <Spinner className="h-4 w-4" /> : <PaperclipIcon className="h-4 w-4" />}
            </button>

            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !attaching) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder={
                selectedTrack
                  ? `Describe the placement to score “${selectedTrack.title}”…`
                  : "Describe a placement, paste a Spotify link, attach a brief, or ask about a track…"
              }
              className="min-h-[24px] flex-1 resize-none overflow-y-auto bg-transparent py-1 text-sm text-white placeholder:text-soft/80 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || attaching || !input.trim()}
              aria-label="Send"
              className="sf-btn-white shrink-0 self-end !px-3 !py-2"
            >
              {busy ? <Spinner className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
            </button>
            </div>
          </div>
          {attachErr ? (
            <p role="alert" className="mt-1.5 text-center text-[11px] text-red-300">
              {attachErr}
            </p>
          ) : (
            <p className="mt-1.5 text-center text-[11px] text-soft">
              {attaching
                ? "Reading your document…"
                : "Brief → 10 best-fitting tracks · Spotify link → score that song · attach a PDF/Word brief · then ask anything."}
            </p>
          )}
        </form>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">What are you scoring for sync?</h2>
      <p className="mt-2 max-w-md text-sm text-soft">
        Describe a placement, paste a Spotify link, or attach a PDF/Word brief.
      </p>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-purple-600/25 px-4 py-2.5 text-sm text-white ring-1 ring-inset ring-purple-500/30">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({
  msg,
  onPick,
  onRefresh,
}: {
  msg: Extract<Msg, { role: "assistant" }>;
  onPick: (t: RankedTrack) => void;
  onRefresh: (brief: string, tracks: RankedTrack[]) => void;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 ring-1 ring-inset ring-lime-400/30">
        <SparkIcon className="h-4 w-4 text-lime-300" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        {msg.kind === "thinking" && (
          <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-soft">
            <Spinner className="h-4 w-4 text-purple-200" />
            {msg.label}
          </div>
        )}
        {msg.kind === "error" && (
          <div className="rounded-2xl rounded-tl-md border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200">
            {msg.text}
          </div>
        )}
        {msg.kind === "qa" && (
          <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white">
            {msg.text}
          </div>
        )}
        {msg.kind === "discover" && (
          <DiscoverList
            tracks={msg.discover.tracks}
            onPick={onPick}
            onRefresh={() => onRefresh(msg.brief, msg.discover.tracks)}
          />
        )}
        {msg.kind === "single" && <SingleResultMessage msg={msg} />}
      </div>
    </div>
  );
}

function SingleResultMessage({
  msg,
}: {
  msg: Extract<Msg, { role: "assistant"; kind: "single" }>;
}) {
  const { result, savedId, brief } = msg;
  const { track, analysis, marketSignal } = result;
  const safetyText =
    analysis.brandSafety.level === "Low"
      ? "text-lime-300"
      : analysis.brandSafety.level === "High"
        ? "text-red-300"
        : "text-amber-300";
  const bestUse = (analysis.bestUseCases ?? []).slice(0, 4);
  const streams = marketSignal.metrics?.totalStreams ?? marketSignal.streams ?? null;
  const note = analysis.brandSafety.notes?.[0];

  return (
    <div className="space-y-3 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.02] p-3.5">
      {/* Header — cover, title, play */}
      <div className="flex items-center gap-3">
        <TrackCover url={marketSignal.artworkUrl} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {analysis.brand && <BrandLogo brand={analysis.brand} className="h-7 w-7" />}
            <p className="truncate text-sm font-semibold text-white">{track.title}</p>
          </div>
          <p className="truncate text-xs text-soft">
            {track.artist}
            {analysis.brand ? ` · ${analysis.brand.name}` : ""}
          </p>
        </div>
        <SpotifyPlay
          title={track.title}
          artist={track.artist}
          spotifyId={marketSignal.spotifyTrackId}
          label="Play"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-semibold text-lime-200 transition hover:bg-lime-400/20"
        />
        <StarButton
          track={{
            title: track.title,
            artist: track.artist,
            score: analysis.syncFitScore,
            scoreLabel: analysis.scoreLabel,
            genre: track.genre,
            spotifyTrackId: marketSignal.spotifyTrackId,
            artworkUrl: marketSignal.artworkUrl,
          }}
        />
      </div>

      {/* SyncFit Score — horizontal bar */}
      <SyncFitScoreGauge score={analysis.syncFitScore} label={analysis.scoreLabel} />

      {/* Pitch */}
      <p className="text-[13px] leading-relaxed text-soft">{analysis.pitchSummary}</p>

      {/* Best-for placement ideas */}
      {bestUse.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-200/80">Best for</span>
          {bestUse.map((u, i) => (
            <span key={i} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-soft ring-1 ring-inset ring-white/10">
              {u}
            </span>
          ))}
        </div>
      )}

      {/* Compact score breakdown */}
      <MiniBreakdown breakdown={analysis.breakdown} />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        <Stat label="Language" value={track.language || "—"} />
        <Stat label="Genre" value={track.genre || "—"} />
        <Stat label="BPM" value={track.bpm != null ? String(track.bpm) : "—"} />
        <Stat label="Popularity" value={track.popularity != null ? `${track.popularity}` : "—"} />
        <Stat
          label="Streams"
          value={streams != null ? fmtNum(streams) : marketSignal.status !== "Unknown" ? marketSignal.status : "—"}
        />
      </div>

      {/* Brand safety line */}
      <p className="text-[11px] text-soft">
        <span className="font-semibold text-soft">Brand safety </span>
        <span className={"font-semibold " + safetyText}>{analysis.brandSafety.level}</span>
        {note ? <span className="text-soft"> · {note}</span> : null}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {savedId && (
          <Link href={`/report/${savedId}`} className="sf-btn-secondary !py-1.5 !text-xs">
            Open full report
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
        <AddToArenaButton brief={brief} title={track.title} artist={track.artist} />
      </div>
    </div>
  );
}

function fmtNum(n: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
      <p className="truncate text-[9px] uppercase tracking-wider text-soft">{label}</p>
      <p className="truncate text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniBreakdown({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
      {SCORE_MODEL.map((cat) => {
        const value = breakdown[cat.key] ?? 0;
        const pct = Math.max(0, Math.min(100, Math.round((value / cat.max) * 100)));
        return (
          <div key={cat.key} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-[11px] text-soft">{cat.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/70">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-lime-400" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white">
              {value}/{cat.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DiscoverList({
  tracks,
  onPick,
  onRefresh,
}: {
  tracks: RankedTrack[];
  onPick: (t: RankedTrack) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.02]">
      <p className="border-b border-white/5 px-4 py-2 text-xs text-soft">
        Top {tracks.length} tracks for your brief — <span className="text-amber-300">star</span> to save, tap <span className="font-medium text-purple-200">Score</span> to research one.
      </p>
      <ul className="divide-y divide-white/5">
        {tracks.map((t, i) => (
          <li key={t.title + t.artist + i} className="flex items-center gap-2.5 px-3 py-2 transition hover:bg-white/[0.02]">
            <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-soft">{i + 1}</span>
            <TrackCover url={t.artworkUrl} className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{t.title}</p>
              <p className="truncate text-xs text-soft">
                {t.artist}
                {t.genre ? ` · ${t.genre}` : ""}
              </p>
            </div>
            <span className={"shrink-0 text-sm font-bold tabular-nums " + scoreColor(t.syncFitScore)}>
              {t.syncFitScore}
            </span>
            <StarButton
              track={{
                title: t.title,
                artist: t.artist,
                score: t.syncFitScore,
                scoreLabel: t.scoreLabel,
                genre: t.genre,
                spotifyTrackId: t.spotifyTrackId,
                artworkUrl: t.artworkUrl,
              }}
            />
            <SpotifyPlay
              title={t.title}
              artist={t.artist}
              spotifyId={t.spotifyTrackId}
              label=""
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-soft transition hover:border-lime-400/50 hover:text-lime-300"
            />
            <button
              type="button"
              onClick={() => onPick(t)}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            >
              Score
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onRefresh}
        className="flex w-full items-center justify-center gap-2 border-t border-white/5 px-4 py-2.5 text-xs font-semibold text-soft transition hover:bg-white/[0.03] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-400/50"
      >
        <RefreshIcon className="h-3.5 w-3.5" aria-hidden />
        Not feeling these? Show 10 more
      </button>
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={(className ?? "h-4 w-4") + " animate-spin"} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
