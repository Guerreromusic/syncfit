import * as React from "react";

/** SyncFit mark: a lime→purple equalizer glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-glow " +
        (className || "")
      }
      aria-hidden
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="9" width="2.6" height="6" rx="1.3" fill="#BEF264" />
        <rect x="8" y="5" width="2.6" height="14" rx="1.3" fill="#E4D7FF" />
        <rect x="13" y="7" width="2.6" height="10" rx="1.3" fill="#BEF264" />
        <rect x="18" y="10" width="2.6" height="4" rx="1.3" fill="#E4D7FF" />
      </svg>
    </span>
  );
}
