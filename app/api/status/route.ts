// GET /api/status — returns API key presence/state only (never the values).
import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getApiStatuses } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const statuses = getApiStatuses();

  // When a Blob token is present, probe the store with a real WRITE so the
  // "Durable storage" row reflects REALITY. A suspended/over-quota store still
  // lists fine but rejects every write, which would otherwise silently wipe
  // persistence (reports, projects, Live Audience) with a false "connected".
  const storage = statuses.find((s) => s.key === "storage");
  if (storage && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const probe = await put(
        `healthcheck/probe-${Date.now()}.txt`,
        "ok",
        { access: "public", addRandomSuffix: false, contentType: "text/plain" },
      );
      await del(probe.url).catch(() => {});
      // healthy — leave as "connected"
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      storage.state = "missing";
      storage.note = /suspend/i.test(msg)
        ? "Blob store is SUSPENDED (usually over free-tier quota or a billing issue) — reports, projects & Live Audience can't persist until you reactivate it in Vercel → Storage."
        : "Blob store is configured but writes fail — reports, projects & Live Audience can't persist. Check the store in Vercel → Storage.";
    }
  }

  return NextResponse.json({ statuses });
}
