"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";
import { NAV, isActive } from "./navItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.015] px-3 py-5 lg:flex">
      <Link href="/" className="mb-5 flex items-center gap-3 px-2">
        <LogoMark />
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">SyncFit</span>
          <span className="block text-[10px] leading-tight text-soft">by Synclat</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition " +
                (active
                  ? "bg-purple-500/12 text-white"
                  : "text-soft hover:bg-white/[0.04] hover:text-white")
              }
            >
              <Icon
                aria-hidden
                className={
                  "h-[18px] w-[18px] " +
                  (active ? "text-lime-400" : "text-soft group-hover:text-purple-200")
                }
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-4">
        <p className="text-[11px] font-medium text-purple-200/80">Musicathon MVP</p>
        <p className="mt-1 text-[11px] leading-relaxed text-soft">
          Built with Musixmatch APIs. Real-time data only — no lyrics stored.
        </p>
      </div>
    </aside>
  );
}
