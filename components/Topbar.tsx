"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoImage } from "./Logo";
import { NAV, isActive } from "./navItems";

export function Topbar() {
  const pathname = usePathname();

  // Hidden on public pitch-share pages (see Sidebar).
  if (pathname.startsWith("/share")) return null;

  return (
    <header className="sf-liquid sticky top-0 z-20 rounded-none border-x-0 border-t-0 border-b border-white/[0.06] lg:hidden">
      {/* Top row — mobile/tablet only; desktop uses the sidebar, no top banner */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand — the sidebar carries it on desktop */}
        <Link href="/" className="flex items-center">
          <LogoImage className="h-6" />
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] px-3 py-1 text-xs font-medium text-soft">
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
