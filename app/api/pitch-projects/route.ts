// POST /api/pitch-projects — create a pitch project from selected report ids.
import { NextResponse } from "next/server";
import { createProject, listReports } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: unknown; reportIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  const reportIds = Array.isArray(body.reportIds)
    ? body.reportIds.filter((x): x is string => typeof x === "string")
    : [];

  if (reportIds.length < 1) {
    return NextResponse.json(
      { error: "Pick at least one track to pitch." },
      { status: 400 },
    );
  }

  // Keep only ids that map to real reports, preserving the requested order.
  const known = new Set((await listReports()).map((r) => r.id));
  const valid = reportIds.filter((id) => known.has(id));
  if (!valid.length) {
    return NextResponse.json(
      { error: "None of the selected tracks were found." },
      { status: 400 },
    );
  }

  const project = await createProject(name, valid);
  return NextResponse.json({ project });
}
