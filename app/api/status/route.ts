// GET /api/status — returns API key presence/state only (never the values).
import { NextResponse } from "next/server";
import { getApiStatuses } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ statuses: getApiStatuses() });
}
