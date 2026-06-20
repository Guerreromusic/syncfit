"use client";

import * as React from "react";
import { PitchCard } from "./PitchCard";
import { TrackCover } from "./TrackCover";
import { ArrowRightIcon } from "./icons";
import type { SavedReport } from "@/lib/types";

/**
 * The final multi-track pitch: each report is a TAB you can switch between by
 * clicking, or by sliding/swiping the cards left and right.
 */
export function ProjectPitchView({ reports }: { reports: SavedReport[] }) {
  const count = reports.length;
  const [index, setIndex] = React.useState(0);
  const [drag, setDrag] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  const startX = React.useRef<number | null>(null);
  const moved = React.useRef(false);
  const dragRef = React.useRef(0);
  const widthRef = React.useRef(1);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const tabsRef = React.useRef<HTMLDivElement>(null);

  const go = React.useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(count - 1, i))),
    [count],
  );

  // Keep the active tab scrolled into view.
  React.useEffect(() => {
    const el = tabsRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  // Left / right arrow-key navigation — but NOT while a form control is focused
  // (e.g. the footer player's seek/volume sliders), so arrows don't double-act.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) {
        return;
      }
      if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "ArrowRight") go(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    moved.current = false;
    widthRef.current = viewportRef.current?.offsetWidth || 1;
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 8) moved.current = true;
    dragRef.current = delta;
    setDrag(delta);
  }
  function endDrag() {
    if (startX.current == null) return;
    const threshold = Math.min(120, widthRef.current * 0.18);
    // Read the ref (not state) so the decision is correct regardless of render timing.
    if (dragRef.current < -threshold) go(index + 1);
    else if (dragRef.current > threshold) go(index - 1);
    startX.current = null;
    dragRef.current = 0;
    setDrag(0);
    setDragging(false);
  }
  // Swallow the click that ends a real swipe so it can't trigger a card button.
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  const w = widthRef.current || 1;

  return (
    <div>
      {/* Tabs — prominent, sticky to the top with cover thumbnails */}
      <div
        ref={tabsRef}
        className="sticky top-0 z-20 -mx-1 mb-4 flex gap-2 overflow-x-auto rounded-xl bg-ink-950/70 px-1 py-2 backdrop-blur-md [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {reports.map((r, i) => {
          const active = i === index;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => go(i)}
              aria-current={active ? "true" : undefined}
              className={
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition " +
                (active
                  ? "border-lime-400/60 bg-lime-400/15 shadow-lg shadow-lime-400/10 ring-1 ring-inset ring-lime-400/20"
                  : "border-white/10 bg-white/[0.04] hover:border-purple-400/50")
              }
            >
              <span className="relative shrink-0">
                <TrackCover url={r.marketSignal.artworkUrl} className="h-9 w-9 rounded-md" />
                <span
                  className={
                    "absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold " +
                    (active
                      ? "bg-lime-400 text-ink-950"
                      : "bg-ink-800 text-soft ring-1 ring-inset ring-white/10")
                  }
                >
                  {i + 1}
                </span>
              </span>
              <span className="min-w-0">
                <span
                  className={
                    "block max-w-[130px] truncate text-xs font-semibold " +
                    (active ? "text-white" : "text-soft")
                  }
                >
                  {r.name?.trim() || r.track.title}
                </span>
                <span className="block max-w-[130px] truncate text-[10px] text-soft">
                  {r.track.artist}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Sliding cards — smooth 3D rotation as they swipe left/right */}
      <div
        ref={viewportRef}
        className="overflow-hidden"
        style={{ touchAction: "pan-y", perspective: "1500px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
            transformStyle: "preserve-3d",
            transition: dragging ? "none" : "transform .5s cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {reports.map((r, i) => {
            // Offset of this slide from the centred one (in viewport widths).
            const off = i - index + (dragging ? drag / w : 0);
            const c = Math.max(-1.5, Math.min(1.5, off));
            const rotateY = (-c * 22).toFixed(2);
            const scale = (1 - Math.min(Math.abs(c), 1) * 0.1).toFixed(3);
            const opacity = 1 - Math.min(Math.abs(c), 1) * 0.5;
            return (
              <div key={r.id} className="w-full shrink-0 px-2">
                <div
                  style={{
                    transform: `rotateY(${rotateY}deg) scale(${scale})`,
                    opacity,
                    transformOrigin: "center center",
                    transition: dragging
                      ? "none"
                      : "transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <PitchCard report={r} variant="glass" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous track"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-30"
        >
          <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
          Prev
        </button>
        <div className="flex items-center gap-1.5">
          {reports.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to track ${i + 1}`}
              className={
                "h-2 rounded-full transition-all " +
                (i === index ? "w-5 bg-lime-400" : "w-2 bg-white/20 hover:bg-white/40")
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          aria-label="Next track"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-soft transition hover:border-purple-400/50 hover:text-white disabled:opacity-30"
        >
          Next
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-soft">
        Track {index + 1} of {count} · swipe or use the tabs to switch
      </p>
    </div>
  );
}
