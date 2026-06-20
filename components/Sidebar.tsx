"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoImage } from "./Logo";
import { NAV, isActive } from "./navItems";

export function Sidebar() {
  const pathname = usePathname();
  const navRef = React.useRef<HTMLElement | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = React.useState<{
    top: number;
    height: number;
    visible: boolean;
  }>({ top: 0, height: 0, visible: false });

  // Settings is pinned to the bottom; the rest live in the main nav.
  const mainNav = NAV.filter((n) => n.href !== "/settings");
  const settings = NAV.find((n) => n.href === "/settings");

  const activeHref =
    mainNav.find((n) => isActive(pathname, n.href))?.href ?? null;

  // Measure the active main-nav item and slide the liquid lozenge to it.
  React.useLayoutEffect(() => {
    if (!activeHref) {
      setIndicator((s) => ({ ...s, visible: false }));
      return;
    }
    const el = itemRefs.current[activeHref];
    const nav = navRef.current;
    if (!el || !nav) return;
    setIndicator({ top: el.offsetTop, height: el.offsetHeight, visible: true });
  }, [activeHref, pathname]);

  // Public pitch-share pages render chrome-free (see /share routes).
  if (pathname.startsWith("/share")) return null;

  const settingsActive = settings ? isActive(pathname, settings.href) : false;

  return (
    <aside className="sf-liquid sticky top-2 z-30 m-2 hidden h-[calc(100vh-1rem)] w-64 shrink-0 flex-col rounded-3xl border border-white/10 px-3 py-5 lg:flex">
      <Link href="/" className="mb-5 flex items-center gap-2 px-2">
        <LogoImage className="h-7" />
        <span className="text-[10px] leading-tight text-soft">by Synclat</span>
      </Link>

      <nav ref={navRef} className="relative flex flex-col gap-0.5" aria-label="Primary">
        {/* Sliding liquid-glass active indicator */}
        <span
          aria-hidden
          className="sf-nav-indicator pointer-events-none"
          style={{
            height: indicator.height,
            transform: `translateY(${indicator.top}px)`,
            opacity: indicator.visible ? 1 : 0,
          }}
        />

        {mainNav.map(({ href, label, icon: Icon, desc }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              ref={(el) => {
                itemRefs.current[href] = el;
              }}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "group relative z-10 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition duration-200 " +
                (active
                  ? "text-white"
                  : "text-soft hover:bg-white/[0.03] hover:text-white hover:ring-1 hover:ring-inset hover:ring-white/[0.08] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]")
              }
            >
              <Icon
                aria-hidden
                className={
                  "h-[18px] w-[18px] transition-colors " +
                  (active ? "text-lime-400" : "text-soft group-hover:text-purple-200")
                }
              />
              {label}

              {/* Hover tooltip — explains what the section holds */}
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 w-56 -translate-y-1/2 translate-x-1 rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2 text-xs font-normal leading-relaxed text-soft opacity-0 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
              >
                {desc}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom-pinned Settings + footer */}
      <div className="mt-auto space-y-4 pt-4">
        {settings && (
          <Link
            href={settings.href}
            aria-current={settingsActive ? "page" : undefined}
            className={
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition duration-200 " +
              (settingsActive
                ? "bg-white/[0.04] text-white ring-1 ring-inset ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "text-soft hover:bg-white/[0.03] hover:text-white hover:ring-1 hover:ring-inset hover:ring-white/[0.08] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]")
            }
          >
            <settings.icon
              aria-hidden
              className={
                "h-[18px] w-[18px] transition-colors " +
                (settingsActive
                  ? "text-lime-400"
                  : "text-soft group-hover:text-purple-200")
              }
            />
            {settings.label}

            <span
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 w-56 -translate-y-1/2 translate-x-1 rounded-xl border border-white/10 bg-ink-900/95 px-3 py-2 text-xs font-normal leading-relaxed text-soft opacity-0 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
            >
              {settings.desc}
            </span>
          </Link>
        )}

        <div className="px-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
            Musixmatch Musicathon
          </span>
          <p className="mt-2 text-[11px] leading-relaxed text-soft">
            Built with Musixmatch APIs. Real-time data only — no lyrics stored.
          </p>
        </div>
      </div>
    </aside>
  );
}
