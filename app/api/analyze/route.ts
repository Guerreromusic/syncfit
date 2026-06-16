// POST /api/analyze — run a full SyncFit analysis and (optionally) save it.
// Body: { brief: Brief; track?: NormalizedTrack; trackId?; title?; artist?;
//         previewUrl?; save?: boolean }
import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { discover } from "@/lib/discover";
import { saveReport, toSavedReport } from "@/lib/storage";
import type { Brief, NormalizedTrack } from "@/lib/types";

export const dynamic = "force-dynamic";

type AnalyzeBody = {
  brief?: Partial<Brief>;
  track?: NormalizedTrack;
  trackId?: string;
  title?: string;
  artist?: string;
  previewUrl?: string;
  model?: string;
  save?: boolean;
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

  const brief: Brief = { ...DEFAULT_BRIEF, ...(body.brief || {}) };

  // Validation: empty brief.
  if (!brief.brief || brief.brief.trim().length === 0) {
    return NextResponse.json(
      { error: "Please enter a creative brief before running SyncFit." },
      { status: 400 },
    );
  }

  // Track is OPTIONAL. If none is provided, run TrackFit discovery instead:
  // recommend & rank 10 best-fitting tracks for the brief.
  const hasTrack =
    Boolean(body.track) ||
    Boolean(body.trackId) ||
    Boolean((body.title || "").trim());

  try {
    if (!hasTrack) {
      const discovered = await discover({ brief, model: body.model });
      return NextResponse.json({ mode: "discover", discover: discovered });
    }

    const result = await analyze({
      brief,
      track: body.track,
      trackId: body.trackId,
      title: body.title,
      artist: body.artist,
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
