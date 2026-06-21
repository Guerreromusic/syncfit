// POST /api/banner — generate a Higgsfield campaign banner for a saved report.
// Returns immediately if bannerUrl already exists (one image per report).
import { NextResponse } from "next/server";
import { getReport, setReportBanner } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HF_API_KEY = process.env.HIGGSFIELD_API_KEY ?? "";

function buildPrompt(report: NonNullable<Awaited<ReturnType<typeof getReport>>>): string {
  const { track, brief, analysis } = report;
  const brand = analysis.brand?.name;
  const parts: string[] = [
    "Cinematic, ultra-realistic marketing campaign key visual,",
    brand
      ? `hero campaign banner for ${brand},`
      : `hero campaign banner for a ${brief.projectType} production,`,
    `${brief.mood.toLowerCase()} mood,`,
    brief.projectType !== "Ad" ? `${brief.projectType.toLowerCase()} industry aesthetic,` : "commercial advertising aesthetic,",
    track.genre ? `${track.genre} music genre,` : "",
    track.language && track.language !== "Any" ? `${track.language}-language market,` : "",
    `inspired by the brief: "${brief.brief.slice(0, 160)}",`,
    `professional product photography, dramatic lighting, no text, no people faces,`,
    `4K photorealistic, rich color palette, commercial production quality.`,
  ];
  return parts.filter(Boolean).join(" ");
}

export async function POST(req: Request) {
  let body: { reportId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const reportId = typeof body.reportId === "string" ? body.reportId : null;
  if (!reportId) {
    return NextResponse.json({ error: "reportId is required." }, { status: 400 });
  }

  const report = await getReport(reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  // One banner per report — return existing immediately
  if (report.bannerUrl) {
    return NextResponse.json({ bannerUrl: report.bannerUrl, cached: true });
  }

  if (!HF_API_KEY) {
    return NextResponse.json(
      { error: "HIGGSFIELD_API_KEY is not configured. Add it to your environment variables." },
      { status: 503 }
    );
  }

  const prompt = buildPrompt(report);

  // Submit image generation job to Higgsfield
  let jobId: string;
  try {
    const res = await fetch("https://api.higgsfield.ai/v1/generation", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model: "nano_banana_pro",
        aspect_ratio: "16:9",
        num_images: 1,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `Higgsfield API error ${res.status}: ${text}` }, { status: 502 });
    }
    const data = await res.json();
    jobId = data.id ?? data.job_id ?? data.jobId ?? "";
    if (!jobId) {
      return NextResponse.json({ error: "No job ID in Higgsfield response." }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json({ error: `Higgsfield request failed: ${String(e)}` }, { status: 502 });
  }

  // Poll for completion (up to ~50 s with 2 s intervals)
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`https://api.higgsfield.ai/v1/generation/${jobId}`, {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const status: string = data.status ?? "";
      if (status === "completed" || status === "finished" || status === "succeeded") {
        const url: string =
          data.output?.url ??
          data.output?.images?.[0] ??
          data.url ??
          data.image_url ??
          data.images?.[0]?.url ??
          data.images?.[0] ??
          "";
        if (!url) {
          return NextResponse.json({ error: "No image URL in Higgsfield response." }, { status: 502 });
        }
        await setReportBanner(reportId, url);
        return NextResponse.json({ bannerUrl: url });
      }
      if (status === "failed" || status === "error") {
        return NextResponse.json({ error: data.error ?? "Banner generation failed." }, { status: 502 });
      }
    } catch {
      // transient — keep polling
    }
  }

  return NextResponse.json({ error: "Banner generation timed out." }, { status: 504 });
}
