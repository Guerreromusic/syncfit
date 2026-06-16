"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";
import { BoltIcon } from "./icons";
import { NAV, isActive } from "./navItems";

export function Topbar({ appName }: { appName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        {/* Brand — links home. On desktop the sidebar carries the mark too. */}
        <Link href="/" className="flex items-center gap-3">
          <span className="lg:hidden">
            <LogoMark />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">{appName}</p>
            <p className="hidden text-xs text-soft sm:block">
              Score, explain, and pitch Latin tracks for global sync.
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-600/15 px-3 py-1 text-xs font-medium text-purple-100 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
            Musixmatch Musicathon
          </span>
          <Link href="/analyzer" className="sf-btn-primary">
            <BoltIcon className="h-4 w-4" aria-hidden />
            Run SyncFit
          </Link>
        </div>
      </div>

      {/* Mobile primary nav — the sidebar is hidden below lg, so surface the
          destinations here so they're always reachable. */}
      <nav
        aria-label="Primary"
        className="flex gap-2 overflow-x-auto border-t border-ink-700/50 px-4 py-2 sm:px-6 lg:hidden"
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
                  ? "bg-purple-600/25 text-white ring-1 ring-inset ring-purple-500/40"
                  : "text-soft hover:bg-ink-700/50 hover:text-white")
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
