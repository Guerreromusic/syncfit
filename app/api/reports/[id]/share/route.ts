// POST /api/reports/[id]/share — mint (or return) a public pitch-share token.
// The token powers the unauthenticated /share/[token] pitch page. Idempotent:
// calling again returns the same token. Stores only the token — no new data.
import { NextResponse } from "next/server";
import { setReportShared } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const report = await setReportShared(params.id);
  if (!report || !report.shareToken) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  return NextResponse.json({ token: report.shareToken });
}
