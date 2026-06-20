"use client";

import * as React from "react";
import { ModelSwitch } from "@/components/ModelSwitch";
import { RunningState } from "@/components/RunningState";
import { ArenaCompare } from "@/components/ArenaCompare";
import { TrophyIcon, ImportIcon, DocIcon } from "@/components/icons";
import { OPENROUTER_MODELS, DEFAULT_OPENROUTER_MODEL } from "@/lib/models";
import type { AnalyzeResult, Brief, SavedReport } from "@/lib/types";

// The brief is the factor tracks compete to fit. Track Arena keeps the input
// simple (free-text only) and fills the rest of the Brief shape with neutral
// defaults that are identical for every contender — so the head-to-head ranking
// stays apples-to-apples and is driven by how each track fits the brief text.
const BRIEF_DEFAULTS: Omit<Brief, "brief"> = {
  projectType: "Ad",
  region: "LATAM",
  mood: "Energetic",
  language: "Any",
  brandSafety: "Medium",
  licenseTier: "Micro",
};

type Entry = { title: string; artist: string };

export default function ArenaPage() {
  const [briefText, setBriefText] = React.useState("");
  const [model, setModel] = React.useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [tracks, setTracks] = React.useState<Entry[]>([
    { title: "", artist: "" },
    { title: "", artist: "" },
  ]);

  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<AnalyzeResult[] | null>(null);
  const [imported, setImported] = React.useState(false);

  // Report picker (Import report) + searched-tracks import state.
  const [showReports, setShowReports] = React.useState(false);
  const [reports, setReports] = React.useState<SavedReport[] | null>(null);
  const [reportsLoading, setReportsLoading] = React.useState(false);
  const [importNote, setImportNote] = React.useState<string | null>(null);
  const [briefNote, setBriefNote] = React.useState<string | null>(null);

  // Import tracks (+brief) queued from Reports via "Add to Arena". Consume once.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("syncfit:arena:tracks");
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list) && list.length > 0) {
        const picked = list
          .slice(0, 3)
          .map((x: { title?: string; artist?: string }) => ({
            title: String(x.title || ""),
            artist: String(x.artist || ""),
          }));
        setTracks(picked.length >= 2 ? picked : [...picked, { title: "", artist: "" }]);
        const b = sessionStorage.getItem("syncfit:arena:brief");
        if (b) setBriefText(b);
        setImported(true);
      }
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem("syncfit:arena:tracks");
    sessionStorage.removeItem("syncfit:arena:brief");
  }, []);

  function setTrack(i: number, field: keyof Entry, value: string) {
    setTracks((t) => t.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  }
  function addTrack() {
    setTracks((t) => (t.length >= 3 ? t : [...t, { title: "", artist: "" }]));
  }
  function removeTrack(i: number) {
    setTracks((t) => (t.length <= 2 ? t : t.filter((_, idx) => idx !== i)));
  }

  // Import brief: open a picker of previous reports and adopt one's brief text.
  async function openBriefPicker() {
    setBriefNote(null);
    setShowReports((v) => !v);
    if (reports === null && !reportsLoading) {
      setReportsLoading(true);
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        setReports(Array.isArray(data.reports) ? data.reports : []);
      } catch {
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    }
  }

  function importBriefFromReport(r: SavedReport) {
    if (r.brief.brief) setBriefText(r.brief.brief);
    setShowReports(false);
    setBriefNote(`Imported the brief from “${r.track.title}”.`);
  }

  // Import the tracks from your most recent Research run (persisted in session).
  function importSearchedTracks() {
    setImportNote(null);
    try {
      const raw = sessionStorage.getItem("syncfit:research:tracks");
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list) || list.length === 0) {
        setImportNote("No researched tracks yet — run a Research first, then import them here.");
        return;
      }
      const picked = list
        .slice(0, 3)
        .map((x: { title?: string; artist?: string }) => ({
          title: String(x.title || ""),
          artist: String(x.artist || ""),
        }))
        .filter((x: Entry) => x.title.trim());
      if (picked.length === 0) {
        setImportNote("No researched tracks to import.");
        return;
      }
      setTracks(picked.length >= 2 ? picked : [...picked, { title: "", artist: "" }]);
      const b = sessionStorage.getItem("syncfit:research:brief");
      if (b && !briefText.trim()) setBriefText(b);
      setImported(true);
      setImportNote(`Imported ${picked.length} researched track${picked.length > 1 ? "s" : ""}.`);
    } catch {
      setImportNote("Couldn't read researched tracks.");
    }
  }

  const filledCount = tracks.filter((t) => t.title.trim()).length;
  const canCompare = Boolean(briefText.trim()) && filledCount >= 2;

  async function runArena() {
    if (running) return;
    setError(null);
    if (!briefText.trim()) {
      setError("Enter a brief — it's what the tracks compete to fit.");
      return;
    }
    const filled = tracks.filter((t) => t.title.trim());
    if (filled.length < 2) {
      setError("Enter at least 2 track names to compare.");
      return;
    }

    const brief: Brief = { ...BRIEF_DEFAULTS, brief: briefText.trim() };

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
            Set a brief, then see which of up to 3 tracks fits it best.
          </p>
        </div>
        <ModelSwitch model={model} models={OPENROUTER_MODELS} onChange={setModel} />
      </header>

      {/* Simple single-column flow: brief → contender lineup → compare */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runArena();
        }}
        className="space-y-5"
      >
        {/* The brief */}
        <div className="sf-card sf-card-pad">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold leading-tight text-white">
                The brief
              </h2>
              <p className="text-xs text-soft">What are the tracks competing to fit?</p>
            </div>
            <button
              type="button"
              onClick={openBriefPicker}
              aria-expanded={showReports}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
            >
              <DocIcon className="h-4 w-4" aria-hidden />
              Import brief
            </button>
          </div>

          {showReports && (
            <div className="mb-2 rounded-xl border border-white/10 bg-ink-900/60 p-2">
              {reportsLoading ? (
                <p className="px-2 py-3 text-xs text-soft">Loading reports…</p>
              ) : reports && reports.filter((r) => !r.archived).length > 0 ? (
                <ul className="max-h-52 space-y-1 overflow-y-auto">
                  {reports
                    .filter((r) => !r.archived && r.brief.brief)
                    .map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => importBriefFromReport(r)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.04]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-white">
                              {r.track.title}
                            </span>
                            <span className="block truncate text-xs text-soft">
                              {r.brief.brief}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-lime-300">
                            Use brief
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="px-2 py-3 text-xs text-soft">
                  No saved report briefs yet — run a SyncFit analysis first.
                </p>
              )}
            </div>
          )}

          <textarea
            className="sf-input min-h-[72px] resize-y"
            aria-label="Brief for the arena comparison"
            placeholder="e.g. Energetic Colombian football brand ad — celebratory, stadium-crowd feel, family-friendly."
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
          />
          {briefNote && <p className="mt-2 text-xs text-lime-300">{briefNote}</p>}
        </div>

        {/* The contender lineup */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">The lineup</h2>
              {imported && (
                <span className="rounded-full bg-lime-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-lime-300 ring-1 ring-inset ring-lime-500/25">
                  Imported
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={importSearchedTracks}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white"
            >
              <ImportIcon className="h-4 w-4" aria-hidden />
              Import searched tracks
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-purple-200">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/25 text-[11px] font-bold text-purple-100 ring-1 ring-inset ring-purple-400/40">
                      {i + 1}
                    </span>
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
                <input
                  className="sf-input"
                  aria-label={`Track ${i + 1} song title`}
                  placeholder="Song title"
                  value={t.title}
                  onChange={(e) => setTrack(i, "title", e.target.value)}
                />
                <input
                  className="sf-input mt-2"
                  aria-label={`Track ${i + 1} artist name`}
                  placeholder="Artist name"
                  value={t.artist}
                  onChange={(e) => setTrack(i, "artist", e.target.value)}
                />
              </div>
            ))}

            {tracks.length < 3 && (
              <button
                type="button"
                onClick={addTrack}
                className="flex min-h-[148px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 text-sm font-medium text-soft transition hover:border-purple-400/50 hover:bg-white/[0.02] hover:text-white"
              >
                <span className="text-2xl leading-none">+</span>
                Add a track
              </button>
            )}
          </div>
          {importNote && <p className="mt-2 text-xs text-lime-300">{importNote}</p>}
        </div>

        {/* Action */}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={running || !canCompare}
            className="sf-btn-white px-6 py-2.5 text-sm"
          >
            <TrophyIcon className="h-4 w-4" aria-hidden />
            {running ? "Comparing…" : "Compare Tracks"}
          </button>
          <p className="text-center text-xs text-soft">
            Each track is scored against your brief, then ranked head-to-head.
          </p>
        </div>
      </form>

      {/* Results — full width below */}
      {running && (
        <div className="sf-card sf-card-pad">
          <RunningState mode="arena" />
        </div>
      )}
      {results && !running && <ArenaCompare results={results} />}
    </div>
  );
}
