"use client";

import * as React from "react";
import { WaveIcon, SparkIcon } from "./icons";

// Target languages the user can translate the lyric context into.
const TARGET_LANGUAGES = [
  "English",
  "Spanish",
  "Portuguese",
  "French",
  "Italian",
  "German",
  "Japanese",
  "Korean",
  "Mandarin Chinese",
  "Arabic",
  "Hindi",
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highlight brief-matching keywords inside a text run. */
function Highlighted({ text, keywords }: { text: string; keywords: string[] }) {
  const kws = Array.from(
    new Set(keywords.map((k) => k.trim()).filter((k) => k.length > 1)),
  );
  if (!text || kws.length === 0) return <>{text}</>;
  const re = new RegExp(`(${kws.map(escapeRe).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded bg-lime-400/20 px-0.5 font-medium text-lime-200"
          >
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={(className ?? "h-3.5 w-3.5") + " animate-spin"} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function DecodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-4 w-4"} aria-hidden>
      <path d="M10 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

type LyricMatch = { phrase: string; meaning: string; why: string };

type LyricDecode = {
  narrative: string;
  culturalContext: string;
  slangTerms: { term: string; plain: string }[];
  metaphors: { phrase: string; decoded: string }[];
  emotion: string;
};

type LyricData = {
  available: boolean;
  snippet?: string;
  translation?: string;
  sourceLang?: string;
  keywords?: string[];
  matches?: LyricMatch[];
  matchSummary?: string;
  mood?: string;
  themes?: string[];
  analysis?: string;
  decode?: LyricDecode;
};

/**
 * Complete lyric CONTEXT + translation card. Fetches a SHORT Musixmatch snippet
 * at view time, translates it into the user's chosen language (live, re-runs on
 * change), highlights brief-matching phrases, and uses the AI model to explain
 * what each highlight is and why it matches. Nothing is stored — short context
 * only, never full lyrics.
 */
export function LyricTranslationCard({
  trackId,
  brief,
}: {
  trackId: string;
  brief: string;
}) {
  const [data, setData] = React.useState<LyricData | null>(null);
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [target, setTarget] = React.useState("English");
  // Cache the short context per track so changing the target language (or brief)
  // re-translates without re-pulling the same Musixmatch snippet.
  const snippetRef = React.useRef<{ trackId: string; snippet: string } | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    const cachedSnippet =
      snippetRef.current?.trackId === trackId ? snippetRef.current.snippet : undefined;
    fetch("/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, brief, target, snippet: cachedSnippet }),
    })
      .then((r) => r.json())
      .then((d: LyricData) => {
        if (!active) return;
        if (d.snippet) snippetRef.current = { trackId, snippet: d.snippet };
        setData(d);
        setDone(true);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setDone(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trackId, brief, target]);

  // Initial load skeleton
  if (!done) {
    return (
      <div className="sf-card sf-card-pad">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-700/50" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-ink-700/40" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-ink-700/40" />
      </div>
    );
  }

  // No lyric context available (demo/manual track, or none on this plan) → hide.
  if (!data?.available || !data.snippet) return null;

  const keywords = data.keywords ?? [];
  const matches = (data.matches ?? []).filter((m) => m.phrase);
  const highlightTerms = Array.from(
    new Set([...keywords, ...matches.map((m) => m.phrase)]),
  );

  return (
    <div className="sf-card sf-card-pad">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <WaveIcon className="h-5 w-5 text-purple-300" aria-hidden />
        <h3 className="text-sm font-semibold text-white">Lyric &amp; Translation</h3>
        {data.sourceLang && data.sourceLang !== "Unknown" && (
          <span className="sf-pill text-[10px]">{data.sourceLang}</span>
        )}

        {/* Live translation-language selector */}
        <label className="ml-auto flex items-center gap-1.5 text-[11px] text-soft">
          Translate to
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-900/70 px-2 py-1 text-xs font-medium text-white focus:border-purple-400/70 focus:outline-none"
          >
            {TARGET_LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-ink-900 text-white">
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Original context + translation */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="sf-eyebrow mb-1">Original context</p>
          <p className="text-sm leading-relaxed text-soft">
            <Highlighted text={data.snippet} keywords={highlightTerms} />
          </p>
        </div>
        <div className="lg:border-l lg:border-white/5 lg:pl-4">
          <p className="sf-eyebrow mb-1 flex items-center gap-2">
            {target} translation
            {loading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-600/15 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-purple-100 ring-1 ring-inset ring-purple-500/25">
                <Spinner className="h-3 w-3" />
                Processing translation…
              </span>
            )}
          </p>
          <p
            className={
              "text-sm leading-relaxed text-white transition-opacity " +
              (loading ? "opacity-40" : "opacity-100")
            }
          >
            {data.translation ? (
              <Highlighted text={data.translation} keywords={highlightTerms} />
            ) : (
              <span className="text-soft">Translation unavailable.</span>
            )}
          </p>
        </div>
      </div>

      {/* Lyric analysis — what the Musixmatch lyric conveys, read by AI */}
      {(data.analysis || (data.themes && data.themes.length > 0)) && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <WaveIcon className="h-4 w-4 text-purple-300" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">
              Lyric analysis
            </p>
            {data.mood && (
              <span className="rounded-full bg-purple-600/15 px-2.5 py-0.5 text-[10px] font-semibold text-purple-100 ring-1 ring-inset ring-purple-500/25">
                {data.mood}
              </span>
            )}
          </div>
          {data.analysis && (
            <p className="text-sm leading-relaxed text-soft">{data.analysis}</p>
          )}
          {data.themes && data.themes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {data.themes.map((th, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-soft ring-1 ring-inset ring-white/10"
                >
                  {th}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Why it matches the brief — AI-explained highlights */}
      {(data.matchSummary || matches.length > 0) && (
        <div className="mt-4 rounded-xl border border-lime-500/15 bg-lime-500/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <SparkIcon className="h-4 w-4 text-lime-400" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-lime-300">
              Why it matches your brief
            </p>
          </div>

          {data.matchSummary && (
            <p className="text-sm leading-relaxed text-soft">{data.matchSummary}</p>
          )}

          {matches.length > 0 && (
            <ul className="mt-3 space-y-2.5">
              {matches.map((m, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-md bg-lime-500/15 px-2 py-0.5 text-xs font-semibold text-lime-200 ring-1 ring-inset ring-lime-500/25">
                    {m.phrase}
                  </span>
                  <p className="text-xs leading-relaxed text-soft">
                    {m.meaning && <span className="text-white">{m.meaning}</span>}
                    {m.meaning && m.why ? " — " : ""}
                    {m.why}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Fallback: bare keyword chips when no explained matches */}
      {matches.length === 0 && keywords.length > 0 && (
        <div className="mt-4">
          <p className="sf-eyebrow mb-2">Matches your brief</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k, i) => (
              <span
                key={i}
                className="rounded-full bg-lime-500/10 px-2.5 py-0.5 text-xs font-medium text-lime-300 ring-1 ring-inset ring-lime-500/25"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lyric Decode section */}
      {data.decode && (data.decode.narrative || data.decode.slangTerms.length > 0 || data.decode.metaphors.length > 0) && (
        <div className="mt-4 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2">
            <DecodeIcon className="h-4 w-4 text-indigo-300" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Lyric Decoder
            </p>
          </div>

          {/* Narrative */}
          {data.decode.narrative && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-soft/70">What it&apos;s about</p>
              <p className="text-xs leading-relaxed text-soft">{data.decode.narrative}</p>
            </div>
          )}

          {/* Emotion */}
          {data.decode.emotion && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-soft/70">Emotional undercurrent</p>
              <p className="text-xs leading-relaxed text-soft">{data.decode.emotion}</p>
            </div>
          )}

          {/* Cultural context */}
          {data.decode.culturalContext && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-soft/70">Cultural context</p>
              <p className="text-xs leading-relaxed text-soft">{data.decode.culturalContext}</p>
            </div>
          )}

          {/* Slang / idioms */}
          {data.decode.slangTerms.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-soft/70">Slang &amp; Idioms</p>
              <ul className="space-y-1.5">
                {data.decode.slangTerms.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold text-indigo-200 ring-1 ring-inset ring-indigo-500/25">
                      {s.term}
                    </span>
                    <p className="text-xs leading-relaxed text-soft">{s.plain}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metaphors */}
          {data.decode.metaphors.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-soft/70">Metaphors &amp; Poetry</p>
              <ul className="space-y-1.5">
                {data.decode.metaphors.map((m, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium italic text-indigo-200 ring-1 ring-inset ring-indigo-500/20">
                      {m.phrase}
                    </span>
                    <p className="text-xs leading-relaxed text-soft">{m.decoded}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-soft">
        Short lyric context only — fetched live, never stored. Lyrics powered by
        Musixmatch · translation, highlights &amp; explanations by AI.
      </p>
    </div>
  );
}
