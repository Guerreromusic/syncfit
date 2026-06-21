"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  try {
    const stored = localStorage.getItem("sf_sid");
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem("sf_sid", newId);
    return newId;
  } catch {
    // SSR safety — should never hit since this is client-only
    return "unknown";
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const startRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>("");

  // Initialize session ID once on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || sessionId === "unknown") return;

    // Reset start time for this route
    startRef.current = Date.now();

    // Immediate POST on route entry
    fetch("/api/analytics/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, path: pathname, seconds: 0 }),
    }).catch(() => {/* best-effort */});

    // 30s heartbeat interval
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      navigator.sendBeacon(
        "/api/analytics/session",
        JSON.stringify({ sessionId, path: pathname, seconds: elapsed }),
      );
    }, 30_000);

    // Cleanup: fire final beacon with elapsed seconds
    return () => {
      clearInterval(interval);
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      navigator.sendBeacon(
        "/api/analytics/session",
        JSON.stringify({ sessionId, path: pathname, seconds: elapsed }),
      );
    };
  }, [pathname]);

  return null;
}
