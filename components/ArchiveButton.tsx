"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, RestoreIcon } from "./icons";

/** Toggle a report/project archived state, then refresh the server-rendered list. */
export function ArchiveButton({
  id,
  archived,
  className,
  endpoint,
  iconOnly = false,
}: {
  id: string;
  archived: boolean;
  className?: string;
  /** PATCH endpoint. Defaults to the reports route. */
  endpoint?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function toggle(e: React.MouseEvent) {
    // Sibling of the card's overlay link — keep the click from bubbling.
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await fetch(endpoint ?? `/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });
      router.refresh();
    } catch {
      // best-effort; the list simply won't change
    } finally {
      setBusy(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={archived ? "Restore" : "Archive"}
        title={archived ? "Restore" : "Archive"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
      >
        {busy ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        ) : archived ? (
          <RestoreIcon className="h-4 w-4" aria-hidden />
        ) : (
          <ArchiveIcon className="h-4 w-4" aria-hidden />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        className ||
        "rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-50"
      }
    >
      {busy ? "…" : archived ? "Restore" : "Archive"}
    </button>
  );
}
