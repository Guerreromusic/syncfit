// POST /api/pitch-projects/[id]/share — mint (or return) a public share token
// for a pitch project. Powers the unauthenticated /share/project/[token] page.
import { NextResponse } from "next/server";
import { setProjectShared } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const project = await setProjectShared(params.id);
  if (!project || !project.shareToken) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  return NextResponse.json({ token: project.shareToken });
}
