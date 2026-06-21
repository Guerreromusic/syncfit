"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "./icons";

/**
 * Inline-editable name. Saves via PATCH `endpoint` with `{ name }` (optimistic,
 * reverts on failure). The endpoint returns the updated entity ({ report } or
 * { project }). Used for both score-report brief names and pitch-project names.
 */
export function EditableName({
  endpoint,
  initialName,
  ariaLabel = "Name",
  title = "Rename",
}: {
  endpoint: string;
  initialName: string;
  ariaLabel?: string;
  title?: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(initialName);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function start() {
    setError(false);
    setDraft(name);
    setEditing(true);
  }

  async function save() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === name) return;
    const prev = name;
    setName(next); // optimistic
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (!res.ok) throw new Error("rename failed");
      const data = await res.json();
      const updated = data.report ?? data.project;
      if (updated?.name) setName(updated.name);
      // Refresh the server-rendered tree so list/card views pick up the new name.
      router.refresh();
    } catch {
      setName(prev); // revert
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={80}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label={ariaLabel}
        className="w-full max-w-md rounded-lg border border-purple-400/60 bg-ink-900/70 px-2 py-1 text-2xl font-bold text-white outline-none focus:border-purple-400"
      />
    );
  }

  return (
    <span className="inline-flex max-w-full flex-col">
      <button
        type="button"
        onClick={start}
        title={error ? "Rename failed — click to try again" : title}
        className="group inline-flex max-w-full items-center gap-2 text-left"
      >
        <span className="line-clamp-2 break-words text-left text-xl font-bold text-white sm:text-2xl">{name}</span>
        <PencilIcon
          className={
            "h-4 w-4 shrink-0 transition group-hover:text-purple-300 " +
            (error ? "text-red-300 " : "text-soft ") +
            (saving ? "animate-pulse" : "opacity-0 group-hover:opacity-100")
          }
          aria-hidden
        />
      </button>
      {error && (
        <span role="status" className="text-xs text-red-300">
          Couldn’t save the name — try again.
        </span>
      )}
    </span>
  );
}
