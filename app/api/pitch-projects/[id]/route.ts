// PATCH /api/pitch-projects/[id] — rename ({ name }) or archive ({ archived }).
// DELETE /api/pitch-projects/[id] — remove a project.
import { NextResponse } from "next/server";
import { setProjectName, setProjectArchived, deleteProject } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: { name?: unknown; archived?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.archived === "boolean") {
    const project = await setProjectArchived(params.id, body.archived);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  }

  if (typeof body.name === "string") {
    const project = await setProjectName(params.id, body.name);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json({ project });
  }

  return NextResponse.json(
    { error: "Body must include `name` (string) or `archived` (boolean)." },
    { status: 400 },
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await deleteProject(params.id);
  return NextResponse.json({ ok: true });
}
