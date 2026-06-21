"use client";

import * as React from "react";

/**
 * Small brand logo. Tries three keyless favicon/logo sources in order:
 *   1. Clearbit Logo API (high-quality vector-sourced PNGs)
 *   2. DuckDuckGo icon service
 *   3. Google favicon service
 * If all three fail, renders a letter avatar so something is always visible.
 */

const BRAND_COLORS = [
  "#7c3aed",
  "#0d9488",
  "#2563eb",
  "#b45309",
  "#dc2626",
  "#059669",
  "#9333ea",
  "#0891b2",
];

function letterColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return BRAND_COLORS[Math.abs(h) % BRAND_COLORS.length];
}

export function BrandLogo({
  brand,
  className = "h-7 w-7",
  showName = false,
}: {
  brand?: { name: string; domain: string } | null;
  className?: string;
  showName?: boolean;
}) {
  const domain = brand?.domain?.trim();
  const [step, setStep] = React.useState(0);

  if (!brand || !domain) return null;

  const SOURCES = [
    `https://logo.clearbit.com/${domain}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ];

  // All sources exhausted → always render a letter avatar
  if (step >= SOURCES.length) {
    const initial = brand.name.trim().charAt(0).toUpperCase();
    const bg = letterColor(brand.name);
    const avatar = (
      <span
        className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white ring-1 ring-inset ring-white/20 ${className}`}
        style={{ background: bg, fontSize: "45%" }}
        title={brand.name}
        aria-label={brand.name}
      >
        {initial}
      </span>
    );
    if (!showName) return avatar;
    return (
      <span className="inline-flex items-center gap-1.5">
        {avatar}
        <span className="text-[11px] font-medium text-soft">{brand.name}</span>
      </span>
    );
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SOURCES[step]}
      alt={`${brand.name} logo`}
      title={brand.name}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setStep((s) => s + 1)}
      className={`shrink-0 rounded-full bg-white/95 object-contain p-0.5 ring-1 ring-inset ring-white/10 ${className}`}
    />
  );

  if (!showName) return img;
  return (
    <span className="inline-flex items-center gap-1.5">
      {img}
      <span className="text-[11px] font-medium text-soft">{brand.name}</span>
    </span>
  );
}
