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
  const lastPingRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>("");

  // Initialize session ID once on mount
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || sessionId === "unknown") return;

    // Reset ping timer for this route
    lastPingRef.current = Date.now();

    // Immediate POST on route entry (0 delta — just registers the page visit)
    fetch("/api/analytics/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, path: pathname, seconds: 0 }),
    }).catch(() => {/* best-effort */});

    // 30s heartbeat — send DELTA since last ping to avoid double-counting
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - lastPingRef.current) / 1000);
      lastPingRef.current = now;
      navigator.sendBeacon(
        "/api/analytics/session",
        JSON.stringify({ sessionId, path: pathname, seconds: delta }),
      );
    }, 30_000);

    // Cleanup: send remaining delta since last ping
    return () => {
      clearInterval(interval);
      const delta = Math.floor((Date.now() - lastPingRef.current) / 1000);
      if (delta > 0) {
        navigator.sendBeacon(
          "/api/analytics/session",
          JSON.stringify({ sessionId, path: pathname, seconds: delta }),
        );
      }
    };
  }, [pathname]);

  return null;
}
