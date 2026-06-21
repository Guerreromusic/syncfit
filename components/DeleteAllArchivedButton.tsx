"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { TrashIcon } from "./icons";

/**
 * Permanently delete EVERY archived item in a section (pitches or projects) at
 * once, after a confirmation. Deletes each id via its DELETE route, then refreshes.
 */
export function DeleteAllArchivedButton({
  ids,
  endpointBase,
  label,
}: {
  ids: string[];
  /** e.g. "/api/reports" or "/api/pitch-projects". */
  endpointBase: string;
  /** e.g. "archived pitches". */
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!ids.length) return null;

  async function confirmDelete() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`${endpointBase}/${id}`, { method: "DELETE" })),
      );
      const failed = results.some(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok),
      );
      if (failed) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Some couldn’t be deleted — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErr(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 transition hover:border-red-400/70 hover:bg-red-500/20"
      >
        <TrashIcon className="h-3.5 w-3.5" aria-hidden />
        Delete all ({ids.length})
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete all"
            onClick={() => !busy && setOpen(false)}
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
                    Delete all {label} permanently?
                  </h3>
                  <p className="mt-1 text-sm text-soft">
                    All <span className="font-medium text-white">{ids.length}</span>{" "}
                    {label} will be deleted forever. This can’t be undone.
                  </p>
                </div>
              </div>

              {err && <p className="mt-3 text-xs text-red-300">{err}</p>}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => !busy && setOpen(false)}
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
                  Delete all
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
