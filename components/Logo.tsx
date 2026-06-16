import * as React from "react";

/**
 * SyncFit mark — symmetric purple→lime equalizer wave, matching the brand logo:
 * end dots → rising bars → a purple+lime tall pair at the centre → falling bars
 * → end dots.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={"shrink-0 " + (className || "h-7 w-11")}
      viewBox="0 0 48 30"
      fill="none"
      role="img"
      aria-label="SyncFit"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* purple side */}
      <rect x="2.1" y="12" width="3.2" height="6" rx="1.6" fill="#A855F7" />
      <rect x="7.9" y="8.5" width="3.2" height="13" rx="1.6" fill="#A855F7" />
      <rect x="13.7" y="5" width="3.2" height="20" rx="1.6" fill="#A855F7" />
      <rect x="19.5" y="1" width="3.2" height="28" rx="1.6" fill="#9333EA" />
      {/* lime side */}
      <rect x="25.3" y="1" width="3.2" height="28" rx="1.6" fill="#93C932" />
      <rect x="31.1" y="5" width="3.2" height="20" rx="1.6" fill="#A3E635" />
      <rect x="36.9" y="8.5" width="3.2" height="13" rx="1.6" fill="#A3E635" />
      <rect x="42.7" y="12" width="3.2" height="6" rx="1.6" fill="#A3E635" />
    </svg>
  );
}

/**
 * The real brand logo (uploaded, trimmed to a transparent-background PNG).
 * Used for the app header/sidebar lockup.
 */
export function LogoImage({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/syncfit-logo.png"
      alt="SyncFit by Synclat"
      className={"w-auto " + (className || "h-8")}
    />
  );
}
