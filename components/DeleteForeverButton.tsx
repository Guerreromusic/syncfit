"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { TrashIcon } from "./icons";

/**
 * Permanently delete an archived report (pitch) or project. Always asks for
 * confirmation first — the delete is irreversible (removes it from storage for
 * good, and scrubs it from any projects that reference it).
 */
export function DeleteForeverButton({
  id,
  name,
  kind,
  endpoint,
  iconOnly = false,
}: {
  id: string;
  /** Shown in the confirmation so the user knows exactly what they're deleting. */
  name: string;
  kind: "pitch" | "project";
  /** DELETE endpoint. Defaults to the reports route. */
  endpoint?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const ask = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErr(null);
    setOpen(true);
  };
  const cancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!busy) setOpen(false);
  };

  async function confirmDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(endpoint ?? `/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Couldn’t delete — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          onClick={ask}
          aria-label="Delete permanently"
          title="Delete permanently"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-soft transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300"
        >
          <TrashIcon className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={ask}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-soft transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300"
        >
          <TrashIcon className="h-3.5 w-3.5" aria-hidden />
          Delete
        </button>
      )}

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm permanent delete"
            onClick={cancel}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <TrashIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Delete this {kind} permanently?
                </h3>
                <p className="mt-1 text-sm text-soft">
                  <span className="font-medium text-white">{name}</span> will be
                  deleted forever. This can’t be undone.
                </p>
              </div>
            </div>

            {err && <p className="mt-3 text-xs text-red-300">{err}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="rounded-lg border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-soft transition hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                {busy ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <TrashIcon className="h-3.5 w-3.5" aria-hidden />
                )}
                Delete forever
              </button>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
