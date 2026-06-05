import { NextResponse } from "next/server";
import { fetchWorldCupMarkets } from "@/lib/polymarket/client";

export const runtime = "nodejs";
// The client caches the mapped result in-memory for ~3 min (see lib/polymarket/client.ts);
// this header lets any CDN/browser cache the JSON too. Route stays dynamic.
export const dynamic = "force-dynamic";

// GET /api/markets — real World Cup markets pulled from Polymarket, mapped to our shape.
export async function GET() {
  try {
    const markets = await fetchWorldCupMarkets();
    return NextResponse.json(
      { markets, source: "polymarket", count: markets.length },
      { headers: { "Cache-Control": "s-maxage=180, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { markets: [], source: "polymarket", count: 0, error: err instanceof Error ? err.message : "fetch failed" },
      { status: 200 }
    );
  }
}
