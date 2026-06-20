// POST /api/analyze — run a full SyncFit analysis and (optionally) save it.
// Body: { brief: Brief; track?: NormalizedTrack; trackId?; title?; artist?;
//         previewUrl?; save?: boolean }
import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { discover } from "@/lib/discover";
import { saveReport, toSavedReport } from "@/lib/storage";
import { hasSpotifyLink, resolveSpotifyTrackUrl } from "@/lib/api/spotify";
import type { Brief, NormalizedTrack } from "@/lib/types";

const SPOTIFY_URL_RE =
  /https?:\/\/\S*open\.spotify\.com\/\S+|https?:\/\/(?:spotify\.link|spotify\.app\.link)\/\S+|spotify:(?:track|album|playlist):\S+/g;

export const dynamic = "force-dynamic";
// Analyze chains Musixmatch + Songstats + an LLM call — needs headroom past
// Vercel's default 10s function timeout.
export const maxDuration = 60;

type AnalyzeBody = {
  brief?: Partial<Brief>;
  track?: NormalizedTrack;
  trackId?: string;
  title?: string;
  artist?: string;
  previewUrl?: string;
  model?: string;
  save?: boolean;
  /** "Show 10 more" — track labels already shown, to get a different set. */
  exclude?: string[];
};

const DEFAULT_BRIEF: Brief = {
  brief: "",
  projectType: "Ad",
  region: "LATAM",
  mood: "Energetic",
  language: "Any",
  brandSafety: "Medium",
  licenseTier: "Micro",
};

export async function POST(req: Request) {
  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let brief: Brief = { ...DEFAULT_BRIEF, ...(body.brief || {}) };
  let title = body.title;
  let artist = body.artist;

  // UNIFIED SMART INPUT: a pasted Spotify track link (full, URI, or mobile
  // short-link) is resolved to the real track, then the rest of the team works on
  // it. A link ALWAYS means "research THIS track" — never silently discover.
  const linkSource = `${body.title || ""} ${brief.brief || ""}`;
  if (hasSpotifyLink(linkSource)) {
    const resolved = await resolveSpotifyTrackUrl(linkSource);
    if (resolved?.title) {
      title = resolved.title;
      artist = resolved.artist || artist;
      // Strip the URL so the AI gets clean creative context (if any remains).
      brief = { ...brief, brief: (brief.brief || "").replace(SPOTIFY_URL_RE, "").trim() };
    } else {
      return NextResponse.json(
        {
          error:
            "Couldn't read that Spotify track link. Open the song in Spotify → Share → Copy link, or paste the song name instead.",
        },
        { status: 422 },
      );
    }
  }

  // Track is OPTIONAL. With a track named (song/artist or a resolved Spotify
  // link), research runs on it directly. Without one, run TrackFit discovery.
  const hasTrack =
    Boolean(body.track) ||
    Boolean(body.trackId) ||
    Boolean((title || "").trim());

  // A BRIEF IS REQUIRED. The SyncFit score is always RELATIVE to the placement,
  // so scoring a track (or a pasted link) with no brief would be meaningless —
  // always ask for it. Discovery needs a brief to know what to look for.
  if (!brief.brief || brief.brief.trim().length === 0) {
    return NextResponse.json(
      {
        error: hasTrack
          ? "What's the brief? The SyncFit score is always relative to your placement — add a short brief (e.g. “30-second energetic car ad, family-friendly”) so we can score this track accurately."
          : "Tell us the brief — what's the placement for? (e.g. “upbeat summer ad, stadium energy”). Then deploy to discover the best-fitting tracks.",
        needsBrief: true,
      },
      { status: 422 },
    );
  }

  try {
    if (!hasTrack) {
      const discovered = await discover({
        brief,
        model: body.model,
        exclude: Array.isArray(body.exclude) ? body.exclude : undefined,
      });
      return NextResponse.json({ mode: "discover", discover: discovered });
    }

    const result = await analyze({
      brief,
      track: body.track,
      trackId: body.trackId,
      title,
      artist,
      previewUrl: body.previewUrl,
      model: body.model,
    });

    let savedId: string | undefined;
    if (body.save) {
      const report = await saveReport(toSavedReport(brief, result));
      savedId = report.id;
    }

    return NextResponse.json({ mode: "single", result, savedId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json(
      { error: `SyncFit error: ${message}` },
      { status: 502 },
    );
  }
}
