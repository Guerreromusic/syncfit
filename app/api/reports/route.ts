// GET /api/reports — list saved demo reports (newest first).
import { NextResponse } from "next/server";
import { listReports } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reports = await listReports();
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
