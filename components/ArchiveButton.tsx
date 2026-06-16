"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/** Toggle a report's archived state, then refresh the server-rendered list. */
export function ArchiveButton({
  id,
  archived,
  className,
}: {
  id: string;
  archived: boolean;
  className?: string;
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
      await fetch(`/api/reports/${id}`, {
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
