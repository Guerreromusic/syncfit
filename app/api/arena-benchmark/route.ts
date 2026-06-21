// POST /api/arena-benchmark — save a benchmark comparison and return a share token.
// GET  /api/arena-benchmark?token=xxx — fetch a saved benchmark by token.
import { NextResponse } from "next/server";
import { saveBenchmark, getBenchmark } from "@/lib/benchmark-storage";
import type { BenchmarkResult } from "@/lib/benchmark-storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { briefText?: string; results?: BenchmarkResult[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const briefText = (body.briefText ?? "").trim();
  const results = body.results;

  if (!Array.isArray(results) || results.length < 2) {
    return NextResponse.json(
      { error: "At least 2 results are required." },
      { status: 400 },
    );
  }

  // Validate each result has the minimum required fields.
  for (const r of results) {
    if (!r || typeof r.title !== "string" || typeof r.score !== "number") {
      return NextResponse.json(
        { error: "Each result must have title and score." },
        { status: 400 },
      );
    }
  }

  try {
    const record = await saveBenchmark({ briefText, results });
    return NextResponse.json({ token: record.token });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save benchmark." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }
  try {
    const record = await getBenchmark(token);
    if (!record) {
      return NextResponse.json({ error: "Benchmark not found." }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch benchmark." },
      { status: 500 },
    );
  }
}
