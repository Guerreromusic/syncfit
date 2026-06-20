// POST /api/extract — pull plain text out of an attached PDF or Word (.docx)
// file so it can seed the Research brief. Multipart form-data: { file }.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 12 * 1024 * 1024; // 12MB
const MAX_CHARS = 8000; // keep the brief/prompt bounded

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file attached." }, { status: 400 });
  }

  const name = file.name || "document";
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 422 });
  }
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 12MB)." }, { status: 413 });
  }

  try {
    let text = "";

    if (ext === "pdf" || file.type === "application/pdf") {
      // unpdf bundles a serverless-friendly pdfjs (no native deps) — works on Vercel.
      const { getDocumentProxy, extractText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const out = await extractText(pdf, { mergePages: true });
      text = Array.isArray(out.text) ? out.text.join("\n") : out.text ?? "";
    } else if (
      ext === "docx" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result?.value ?? "";
    } else if (ext === "doc") {
      return NextResponse.json(
        { error: "Legacy .doc isn’t supported — save it as .docx or PDF." },
        { status: 415 },
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file. Attach a PDF or a Word .docx." },
        { status: 415 },
      );
    }

    // Tidy whitespace.
    text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) {
      return NextResponse.json(
        { error: "Couldn’t read any text from that file (it may be scanned/image-only)." },
        { status: 422 },
      );
    }

    const truncated = text.length > MAX_CHARS;
    return NextResponse.json({
      name,
      text: text.slice(0, MAX_CHARS),
      truncated,
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn’t extract text from that file." },
      { status: 500 },
    );
  }
}
