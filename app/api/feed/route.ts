import { NextResponse } from "next/server";
import { fetchMatchFeed } from "@/lib/polymarket/feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live data, short edge cache — the client also polls on an interval.
const CACHE = { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" };

// GET /api/feed → live/upcoming/finished football fixtures from Polymarket.
export async function GET() {
  try {
    const matches = await fetchMatchFeed(12);
    return NextResponse.json(
      { matches, source: "polymarket", count: matches.length },
      { headers: CACHE }
    );
  } catch (err) {
    return NextResponse.json(
      {
        matches: [],
        source: "polymarket",
        count: 0,
        error: err instanceof Error ? err.message : "fetch failed",
      },
      { status: 200 }
    );
  }
}
