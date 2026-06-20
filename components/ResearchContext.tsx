"use client";

import * as React from "react";
import type { AnalyzeResult, Brief, DiscoverResult } from "@/lib/types";

type Status = "idle" | "running" | "done" | "error";

export type ResearchRun = {
  brief: Brief;
  model: string;
  title?: string;
  artist?: string;
  trackId?: string;
  previewUrl?: string;
  /** Human label shown in the progress bar + completion notification. */
  query: string;
};

type ResearchState = {
  status: Status;
  mode: "discover" | "single" | null;
  result: AnalyzeResult | null;
  discover: DiscoverResult | null;
  savedId: string | null;
  error: string | null;
  startedAt: number | null;
  query: string;
  /** Incremented on every delivered result — the analyzer reacts to fresh output. */
  resultId: number;
  /** True while a completed/failed run hasn't been acknowledged by the user. */
  unseen: boolean;
};

type ResearchCtx = ResearchState & {
  run: (r: ResearchRun) => void;
  acknowledge: () => void;
  reset: () => void;
};

const INITIAL: ResearchState = {
  status: "idle",
  mode: null,
  result: null,
  discover: null,
  savedId: null,
  error: null,
  startedAt: null,
  query: "",
  resultId: 0,
  unseen: false,
};

const Ctx = React.createContext<ResearchCtx | null>(null);

export function useResearch(): ResearchCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useResearch must be used within <ResearchProvider>");
  return ctx;
}

/**
 * Runs SyncFit research in the BACKGROUND. Because this provider lives in the
 * root layout (above the page tree), an in-flight request is NOT aborted when the
 * user navigates to another page — they can keep working while research runs, a
 * global progress bar stays on screen, and a notification fires on completion.
 */
export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ResearchState>(INITIAL);
  const runIdRef = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);

  const run = React.useCallback((r: ResearchRun) => {
    // Supersede any in-flight run.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myRun = ++runIdRef.current;

    setState((s) => ({
      ...s,
      status: "running",
      startedAt: Date.now(),
      query: r.query,
      error: null,
      unseen: false,
    }));

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        brief: r.brief,
        model: r.model,
        title: r.title,
        artist: r.artist,
        trackId: r.trackId,
        previewUrl: r.previewUrl,
        save: true,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (myRun !== runIdRef.current) return; // a newer run started — ignore
        if (!res.ok) {
          setState((s) => ({
            ...s,
            status: "error",
            error: data.error || "Research failed.",
            unseen: true,
          }));
          return;
        }
        if (data.mode === "discover") {
          setState((s) => ({
            ...s,
            status: "done",
            mode: "discover",
            discover: data.discover as DiscoverResult,
            result: null,
            savedId: null,
            unseen: true,
            resultId: s.resultId + 1,
          }));
        } else {
          setState((s) => ({
            ...s,
            status: "done",
            mode: "single",
            result: data.result as AnalyzeResult,
            savedId: data.savedId ?? null,
            discover: null,
            unseen: true,
            resultId: s.resultId + 1,
          }));
        }
        notifyComplete(r.query);
      })
      .catch((err) => {
        if (myRun !== runIdRef.current || err?.name === "AbortError") return;
        setState((s) => ({
          ...s,
          status: "error",
          error: "Network error while running SyncFit.",
          unseen: true,
        }));
      });
  }, []);

  const acknowledge = React.useCallback(() => {
    setState((s) => ({ ...s, unseen: false }));
  }, []);

  const reset = React.useCallback(() => {
    runIdRef.current++;
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  const value = React.useMemo<ResearchCtx>(
    () => ({ ...state, run, acknowledge, reset }),
    [state, run, acknowledge, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Best-effort desktop notification when research finishes (no-op if denied). */
function notifyComplete(query: string) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("SyncFit research complete", {
        body: query ? `Results ready for “${truncate(query, 60)}”.` : "Your results are ready.",
        icon: "/favicon.ico",
      });
    }
  } catch {
    /* notifications unavailable — the in-app toast still fires */
  }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
}
