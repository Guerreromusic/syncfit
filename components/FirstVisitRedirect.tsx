"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * On first landing of a session, send the user to Research. Session-scoped so the
 * Dashboard stays reachable afterward (clicking Dashboard won't bounce away).
 */
export function FirstVisitRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    try {
      if (!sessionStorage.getItem("syncfit:landed")) {
        sessionStorage.setItem("syncfit:landed", "1");
        router.replace("/analyzer");
      }
    } catch {
      /* sessionStorage unavailable — stay on the dashboard */
    }
  }, [router]);
  return null;
}
