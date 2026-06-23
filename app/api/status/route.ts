// GET /api/status — returns API key presence/state only (never the values).
import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getApiStatuses } from "@/lib/env";
import { isDbConfigured, dbHealthy } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const statuses = getApiStatuses();
  const storage = statuses.find((s) => s.key === "storage");

  if (storage) {
    if (isDbConfigured()) {
      // Probe the Supabase/Postgres connection so the row reflects reality.
      const ok = await dbHealthy();
      if (ok) {
        storage.state = "connected";
        storage.note =
          "Connected — reports, projects & Live Audience persist in Supabase Postgres.";
      } else {
        storage.state = "missing";
        storage.note =
          "Database is configured but not reachable — check the Supabase integration in Vercel → Storage.";
      }
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Legacy Blob path — a suspended store still lists fine but rejects writes,
      // so probe with a real (cheap) write.
      try {
        const probe = await put(
          `healthcheck/probe-${Date.now()}.txt`,
          "ok",
          { access: "public", addRandomSuffix: false, contentType: "text/plain" },
        );
        await del(probe.url).catch(() => {});
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        storage.state = "missing";
        storage.note = /suspend/i.test(msg)
          ? "Blob store is SUSPENDED — connect Supabase (Vercel → Storage) or reactivate the Blob store so data persists."
          : "Blob store is configured but writes fail — connect Supabase (Vercel → Storage) so data persists.";
      }
    }
  }

  return NextResponse.json({ statuses });
}
