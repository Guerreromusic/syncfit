"use client";

import * as React from "react";
import Link from "next/link";
import { ReportView } from "@/components/ReportView";
import { readCachedReport } from "@/lib/reportCache";
import type { SavedReport } from "@/lib/types";

/**
 * Rendered when the server store has no report for this id (e.g. durable
 * storage is offline, or a different serverless instance saved it). Falls back
 * to the browser cache so a report you just researched still opens. If it's not
 * cached either, shows a clear not-found state instead of a hard 404.
 */
export function ReportFallback({ id }: { id: string }) {
  // undefined = still checking the cache; null = checked, not found.
  const [report, setReport] = React.useState<SavedReport | null | undefined>(undefined);

  React.useEffect(() => {
    setReport(readCachedReport(id));
  }, [id]);

  if (report === undefined) {
    return (
      <div className="sf-card sf-card-pad">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-700/50" />
        <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-ink-700/40" />
      </div>
    );
  }

  if (report) return <ReportView report={report} />;

  return (
    <div className="space-y-4">
      <Link href="/report" className="text-sm text-soft transition hover:text-white">
        ← Score reports
      </Link>
      <div className="sf-card sf-card-pad">
        <h1 className="text-lg font-bold text-white">Report not available here</h1>
        <p className="mt-2 text-sm leading-relaxed text-soft">
          This report couldn&apos;t be loaded. It may have been created in another
          browser, or durable storage is currently offline (see Settings → API
          status). Reports you research in this browser open from a local cache;
          this one isn&apos;t cached here.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/analyzer" className="sf-btn-white">Research a track</Link>
          <Link href="/report" className="sf-btn-secondary">All reports</Link>
        </div>
      </div>
    </div>
  );
}
