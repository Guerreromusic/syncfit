"use client";

import * as React from "react";
import { BriefForm } from "@/components/BriefForm";
import { StepHeader } from "@/components/StepHeader";
import { ModelSwitch } from "@/components/ModelSwitch";
import { RunningState } from "@/components/RunningState";
import { ArenaCompare } from "@/components/ArenaCompare";
import { TrophyIcon } from "@/components/icons";
import { OPENROUTER_MODELS, DEFAULT_OPENROUTER_MODEL } from "@/lib/models";
import type { AnalyzeResult, Brief } from "@/lib/types";

const DEFAULT_BRIEF: Brief = {
  brief: "",
  projectType: "Ad",
  region: "Colombia",
  mood: "Energetic",
  language: "Spanish",
  brandSafety: "Medium",
  licenseTier: "Micro",
};

type Entry = { title: string; artist: string };

export default function ArenaPage() {
  const [brief, setBrief] = React.useState<Brief>(DEFAULT_BRIEF);
  const [model, setModel] = React.useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [tracks, setTracks] = React.useState<Entry[]>([
    { title: "", artist: "" },
    { title: "", artist: "" },
  ]);

  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<AnalyzeResult[] | null>(null);

  function patchBrief(patch: Partial<Brief>) {
    setBrief((b) => ({ ...b, ...patch }));
  }
  function setTrack(i: number, field: keyof Entry, value: string) {
    setTracks((t) => t.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  }
  function addTrack() {
    setTracks((t) => (t.length >= 3 ? t : [...t, { title: "", artist: "" }]));
  }
  function removeTrack(i: number) {
    setTracks((t) => (t.length <= 2 ? t : t.filter((_, idx) => idx !== i)));
  }

  const filledCount = tracks.filter((t) => t.title.trim()).length;
  const canCompare = Boolean(brief.brief.trim()) && filledCount >= 2;

  async function runArena() {
    if (running) return;
    setError(null);
    if (!brief.brief.trim()) {
      setError("Please enter a creative brief first.");
      return;
    }
    const filled = tracks.filter((t) => t.title.trim());
    if (filled.length < 2) {
      setError("Enter at least 2 tracks to compare.");
      return;
    }

    setRunning(true);
    setResults(null);
    try {
      const settled = await Promise.all(
        filled.map(async (t) => {
          try {
            const res = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                brief,
                model,
                title: t.title.trim(),
                artist: t.artist.trim() || undefined,
              }),
            });
            const data = await res.json();
            return res.ok && data.result ? (data.result as AnalyzeResult) : null;
          } catch {
            return null;
          }
        }),
      );
      const ok = settled.filter((r): r is AnalyzeResult => Boolean(r));
      if (ok.length < 2) {
        setError("Couldn't score enough tracks to compare. Please try again.");
        return;
      }
      setResults(ok);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sf-eyebrow">Track Arena</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Benchmark tracks head-to-head</h1>
          <p className="mt-1 text-sm text-soft">
            Score up to 3 tracks against the same brief and compare them side by side.
          </p>
        </div>
      </header>

      <div className="sf-glass">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4 sm:px-8">
          <p className="sf-eyebrow">Arena Console</p>
          <ModelSwitch model={model} models={OPENROUTER_MODELS} onChange={setModel} />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
          {/* Left — brief + contenders */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runArena();
            }}
            className="space-y-6 p-6 sm:p-8 lg:border-r lg:border-white/5"
          >
            <BriefForm bare brief={brief} onChange={patchBrief} />

            <div className="sf-hairline" />

            <div>
              <StepHeader
                step={2}
                title="Contenders"
                subtitle="Add 2–3 tracks to put in the arena."
              />
              <div className="space-y-3">
                {tracks.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.07] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-200">
                        Track {i + 1}
                      </span>
                      {tracks.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeTrack(i)}
                          className="text-xs text-soft transition hover:text-white"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        className="sf-input"
                        placeholder="Song title"
                        value={t.title}
                        onChange={(e) => setTrack(i, "title", e.target.value)}
                      />
                      <input
                        className="sf-input"
                        placeholder="Artist (optional)"
                        value={t.artist}
                        onChange={(e) => setTrack(i, "artist", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {tracks.length < 3 && (
                <button
                  type="button"
                  onClick={addTrack}
                  className="mt-3 text-xs font-medium text-soft transition hover:text-white"
                >
                  + Add a track
                </button>
              )}
            </div>

            <div className="sf-hairline" />

            <div className="space-y-3">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={running || !canCompare}
                className="sf-btn-primary w-full py-3 text-base"
              >
                <TrophyIcon className="h-5 w-5" aria-hidden />
                {running ? "Comparing…" : "Compare Tracks"}
              </button>
              <p className="text-center text-xs text-soft">
                Each track is scored against the brief, then ranked head-to-head.
              </p>
            </div>
          </form>

          {/* Right — comparison */}
          <div className="space-y-5 border-t border-white/5 p-6 sm:p-8 lg:border-t-0">
            {!results && !running && <ArenaEmpty />}
            {running && <RunningState mode="arena" />}
            {results && !running && <ArenaCompare results={results} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArenaEmpty() {
  return (
    <div className="sf-glass-soft flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 ring-1 ring-inset ring-purple-500/30">
        <TrophyIcon className="h-6 w-6 text-lime-400" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-white">
        The matchup appears here
      </h3>
      <p className="mt-2 max-w-sm text-sm text-soft">
        Add a brief and 2–3 tracks, then hit Compare — SyncFit scores each one and
        ranks them with a category-by-category breakdown.
      </p>
    </div>
  );
}
