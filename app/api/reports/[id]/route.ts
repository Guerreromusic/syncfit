// GET /api/reports/[id]    — fetch a single saved demo report.
// PATCH /api/reports/[id]  — archive/restore ({ archived: boolean }) or rename
//                            the AI brief name ({ name: string }).
// DELETE /api/reports/[id] — permanently delete the report (and scrub it from projects).
import { NextResponse } from "next/server";
import {
  getReport,
  setReportArchived,
  setReportName,
  deleteReport,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await deleteReport(params.id);
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const report = await getReport(params.id);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  // Don't expose the private share token on the generic GET — the dedicated
  // /share mint endpoint is the only place a token should be handed out.
  const { shareToken: _omitToken, ...safe } = report;
  return NextResponse.json({ report: safe });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: { archived?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Rename (editable AI brief name).
  if (typeof body.name === "string") {
    const report = await setReportName(params.id, body.name);
    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }
    return NextResponse.json({ report });
  }

  // Archive / restore.
  if (typeof body.archived === "boolean") {
    const report = await setReportArchived(params.id, body.archived);
    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }
    return NextResponse.json({ report });
  }

  return NextResponse.json(
    { error: "Body must include `name` (string) or `archived` (boolean)." },
    { status: 400 },
  );
}
