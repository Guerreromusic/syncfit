// =============================================================================
// SyncFit by Synclat — MusicBrainz adapter (keyless credits & rights)
// =============================================================================
// Spotify's public API does NOT expose songwriter/producer credits. MusicBrainz
// does — keyless. Looked up by the ISRC Musixmatch already gives us (or by
// title+artist), it returns writers/composers, producers, label, and release
// date for the SINGLE-track report. Server-side; never throws.
//
// MusicBrainz requires a descriptive User-Agent and throttles to ~1 req/sec, so
// calls are sequential and spaced. Best-effort: any miss returns partial/null.
// =============================================================================

import { fetchWithTimeout } from "../fetchWithTimeout";
import type { TrackCredits } from "../types";

const MB = "https://musicbrainz.org/ws/2";
const UA = "SyncFit/1.0 (https://syncfit-fawn.vercel.app)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mb(path: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(
      `${MB}${path}`,
      { cache: "no-store", headers: { "User-Agent": UA, Accept: "application/json" } },
      8000,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pushUnique(arr: string[], name?: string) {
  const n = (name || "").trim();
  if (n && !arr.includes(n)) arr.push(n);
}

const WRITER_ROLES = new Set(["composer", "lyricist", "writer", "songwriter"]);

export async function getTrackCredits(params: {
  isrc?: string;
  title: string;
  artist?: string;
}): Promise<TrackCredits | null> {
  // 1) Find the recording — by ISRC (precise) when available, else title+artist.
  let recId: string | null = null;
  if (params.isrc) {
    const j = await mb(`/recording?query=isrc:${encodeURIComponent(params.isrc)}&fmt=json&limit=1`);
    recId = j?.recordings?.[0]?.id ?? null;
  }
  if (!recId && params.title) {
    await sleep(1100);
    const q = encodeURIComponent(
      `recording:"${params.title}"${params.artist ? ` AND artist:"${params.artist}"` : ""}`,
    );
    const j = await mb(`/recording?query=${q}&fmt=json&limit=1`);
    recId = j?.recordings?.[0]?.id ?? null;
  }
  if (!recId) return null;

  // 2) Recording → producers (artist-rels), work id, first release.
  await sleep(1100);
  const rec = await mb(`/recording/${recId}?inc=artist-rels+work-rels+releases&fmt=json`);
  if (!rec) return null;
  const producers: string[] = [];
  let workId: string | null = null;
  for (const rel of rec.relations ?? []) {
    if (rel?.type === "producer") pushUnique(producers, rel?.artist?.name);
    if (rel?.work?.id && !workId) workId = rel.work.id;
  }
  const release = (rec.releases ?? [])[0];
  const releaseId: string | null = release?.id ?? null;
  let releaseDate: string | undefined = release?.date || rec["first-release-date"] || undefined;

  // 3) Work → writers / composers / lyricists.
  const writers: string[] = [];
  if (workId) {
    await sleep(1100);
    const work = await mb(`/work/${workId}?inc=artist-rels&fmt=json`);
    for (const rel of work?.relations ?? []) {
      if (WRITER_ROLES.has(rel?.type)) pushUnique(writers, rel?.artist?.name);
    }
  }

  // 4) Release → label.
  let label: string | undefined;
  if (releaseId) {
    await sleep(1100);
    const rel = await mb(`/release/${releaseId}?inc=labels&fmt=json`);
    const name = rel?.["label-info"]?.[0]?.label?.name;
    if (name) label = name;
    if (!releaseDate && rel?.date) releaseDate = rel.date;
  }

  if (!writers.length && !producers.length && !label) return null;
  return {
    writers: writers.length ? writers : undefined,
    producers: producers.length ? producers : undefined,
    label,
    releaseDate,
  };
}
