// GET /api/trending — trending Latin tracks enriched with live Songstats data.
import { NextResponse } from "next/server";
import { getTrendingLatin } from "@/lib/api/songstats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tracks = await getTrendingLatin();
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}
