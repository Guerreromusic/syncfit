"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";
import { NAV, isActive } from "./navItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-purple-500/[0.06] px-4 py-6 shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <LogoMark />
        <span className="leading-tight">
          <span className="block text-sm font-bold text-white">SyncFit</span>
          <span className="block text-xs text-soft">by Synclat</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                (active
                  ? "bg-purple-600/25 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] ring-1 ring-inset ring-purple-400/40"
                  : "text-soft hover:bg-white/5 hover:text-white")
              }
            >
              <Icon
                aria-hidden
                className={
                  "h-5 w-5 " + (active ? "text-lime-400" : "text-soft group-hover:text-purple-200")
                }
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="sf-glass-soft mt-auto p-4">
        <p className="text-xs font-semibold text-purple-200">Musicathon MVP</p>
        <p className="mt-1 text-xs leading-relaxed text-soft">
          Built for Musicathon using Musixmatch APIs. Real-time data only — no
          lyrics stored.
        </p>
      </div>
    </aside>
  );
}
