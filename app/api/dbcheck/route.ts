// TEMPORARY diagnostic — verifies the Supabase Postgres round-trip in
// production (schema create + write + read + cleanup). No secrets. Remove after.
import { NextResponse } from "next/server";
import { isDbConfigured, kvGet, kvSet } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, reason: "POSTGRES_URL not set" });
  }
  try {
    const probe = { hello: "supabase", t: Date.now() };
    await kvSet("__selftest", probe);
    const read = await kvGet<{ hello?: string; t?: number }>("__selftest", {});
    const roundTripOk = read?.hello === "supabase" && read?.t === probe.t;
    return NextResponse.json({ ok: true, roundTripOk, read });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      errorName: e instanceof Error ? e.name : "Unknown",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
}
