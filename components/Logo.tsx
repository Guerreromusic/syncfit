import * as React from "react";

/**
 * SyncFit mark — a purple→lime equalizer wave (matches the brand logo).
 * Bars-only, transparent background, so it sits cleanly anywhere.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={"shrink-0 " + (className || "h-8 w-10")}
      viewBox="0 0 40 32"
      fill="none"
      role="img"
      aria-label="SyncFit"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="10.5" width="4" height="11" rx="2" fill="#A983FF" />
      <rect x="8.4" y="6.5" width="4" height="19" rx="2" fill="#8B5CF6" />
      <rect x="14.8" y="1.5" width="4" height="29" rx="2" fill="#7C3AED" />
      <rect x="21.2" y="1.5" width="4" height="29" rx="2" fill="#A3E635" />
      <rect x="27.6" y="6.5" width="4" height="19" rx="2" fill="#84CC16" />
      <rect x="34" y="10.5" width="4" height="11" rx="2" fill="#BEF264" />
    </svg>
  );
}

/** Full lockup: mark + "SyncFit" wordmark. */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2.5 " + (className || "")}>
      <LogoMark className="h-7 w-9" />
      <span className="text-lg font-bold tracking-tight text-white">SyncFit</span>
    </span>
  );
}
