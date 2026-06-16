"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";
import { NAV, isActive } from "./navItems";

export function Topbar({ appName }: { appName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-md">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-12">
        {/* Brand — mobile only; the sidebar carries it on desktop */}
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <LogoMark />
          <span className="text-sm font-semibold text-white">{appName}</span>
        </Link>

        {/* Quiet right-aligned context chip (desktop) */}
        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-white/[0.07] px-3 py-1 text-xs font-medium text-soft lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
          Musixmatch Musicathon
        </span>
      </div>

      {/* Mobile primary nav — sidebar is hidden below lg */}
      <nav
        aria-label="Primary"
        className="flex gap-1.5 overflow-x-auto border-t border-white/[0.06] px-4 py-2 sm:px-6 lg:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition " +
                (active
                  ? "bg-purple-500/15 text-white"
                  : "text-soft hover:bg-white/[0.04] hover:text-white")
              }
            >
              <Icon
                aria-hidden
                className={"h-4 w-4 " + (active ? "text-lime-400" : "text-soft")}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
