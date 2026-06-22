// TEMPORARY diagnostic — performs a real Vercel Blob round-trip and returns the
// outcome (no secrets) so we can see WHY writes fail in production. Remove after.
import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const steps: Record<string, unknown> = {};
  steps.tokenPresent = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  try {
    const key = `blobcheck/probe-${Date.now()}.json`;
    const written = await put(key, JSON.stringify({ ok: true, t: Date.now() }), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    steps.putOk = true;
    steps.putUrl = written.url ? "present" : "missing";

    const listed = await list({ prefix: "blobcheck/" });
    steps.listOk = true;
    steps.listCount = listed.blobs.length;

    const res = await fetch(written.url, { cache: "no-store" });
    steps.fetchStatus = res.status;
    steps.fetchOk = res.ok;

    await del(written.url);
    steps.delOk = true;

    return NextResponse.json({ ok: true, steps });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      steps,
      errorName: e instanceof Error ? e.name : "Unknown",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
}
