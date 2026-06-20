"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, CheckIcon } from "./icons";

export type ProjectOption = {
  id: string;
  label: string;
  sub: string;
  score: number;
};

/**
 * Create a pitch PROJECT — name it and pick the tracks to bundle. Selection
 * order becomes the tab order. On create, jumps to the swipeable project view.
 */
export function CreatePitchProject({ options }: { options: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function create() {
    if (selected.length < 1) {
      setError("Pick at least one track to pitch.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pitch-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, reportIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't create the project.");
        return;
      }
      router.push(`/projects/${data.project.id}`);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="sf-btn-primary">
        <PlusIcon className="h-4 w-4" aria-hidden />
        New pitch project
      </button>
    );
  }

  return (
    <div className="sf-card sf-card-pad space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">New pitch project</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-soft transition hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="sf-label">Project name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Nike Summer Campaign — shortlist"
          className="sf-input"
        />
      </div>

      <div>
        <p className="sf-label">
          Tracks to pitch{" "}
          <span className="font-normal text-soft/70">
            ({selected.length} selected · order = tab order)
          </span>
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-soft">No saved reports yet — run a SyncFit analysis first.</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {options.map((o) => {
              const pos = selected.indexOf(o.id);
              const on = pos !== -1;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => toggle(o.id)}
                    aria-pressed={on}
                    className={
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition " +
                      (on
                        ? "border-lime-400/40 bg-lime-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-purple-400/40")
                    }
                  >
                    <span
                      className={
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold " +
                        (on ? "bg-lime-400 text-ink-950" : "bg-white/10 text-soft")
                      }
                    >
                      {on ? pos + 1 : <CheckIcon className="h-3 w-3 opacity-0" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{o.label}</span>
                      <span className="block truncate text-xs text-soft">{o.sub}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-soft">{o.score}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={create}
          disabled={busy || selected.length < 1}
          className="sf-btn-primary"
        >
          {busy ? "Creating…" : `Create pitch (${selected.length})`}
        </button>
      </div>
    </div>
  );
}
