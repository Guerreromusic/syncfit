// GET /api/reports/[id]   — fetch a single saved demo report.
// PATCH /api/reports/[id] — archive/restore a report ({ archived: boolean }).
import { NextResponse } from "next/server";
import { getReport, setReportArchived } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const report = await getReport(params.id);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  return NextResponse.json({ report });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: { archived?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.archived !== "boolean") {
    return NextResponse.json(
      { error: "Body must include `archived` (boolean)." },
      { status: 400 },
    );
  }
  const report = await setReportArchived(params.id, body.archived);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  return NextResponse.json({ report });
}
