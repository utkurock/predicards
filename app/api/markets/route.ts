import { NextResponse } from "next/server";
import {
  fetchWorldCupMarkets,
  fetchMarketsByCollectionId,
  fetchCollectionSummaries,
  fetchAllMarkets,
} from "@/lib/polymarket/client";
import { isCollectionId } from "@/lib/collections";

export const runtime = "nodejs";
// The client caches the mapped result in-memory for ~3 min (see lib/polymarket/client.ts);
// this header lets any CDN/browser cache the JSON too. Route stays dynamic.
export const dynamic = "force-dynamic";

const CACHE = { "Cache-Control": "s-maxage=180, stale-while-revalidate=600" };

// GET /api/markets                  → World Cup markets (mint pool; drives the store)
// GET /api/markets?summary=1        → per-collection summary stats for the landing grid
// GET /api/markets?collection=<id>  → one collection's markets for its marketplace page
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    if (searchParams.get("summary") === "1") {
      const collections = await fetchCollectionSummaries();
      return NextResponse.json({ collections, source: "polymarket" }, { headers: CACHE });
    }

    if (searchParams.get("all") === "1") {
      const markets = await fetchAllMarkets();
      return NextResponse.json(
        { markets, source: "polymarket", count: markets.length },
        { headers: CACHE }
      );
    }

    const collection = searchParams.get("collection") ?? undefined;
    if (collection) {
      if (!isCollectionId(collection)) {
        return NextResponse.json(
          { markets: [], source: "polymarket", count: 0, error: "unknown collection" },
          { status: 200 }
        );
      }
      const markets = await fetchMarketsByCollectionId(collection);
      return NextResponse.json(
        { markets, source: "polymarket", count: markets.length, collection },
        { headers: CACHE }
      );
    }

    const markets = await fetchWorldCupMarkets();
    return NextResponse.json(
      { markets, source: "polymarket", count: markets.length },
      { headers: CACHE }
    );
  } catch (err) {
    return NextResponse.json(
      {
        markets: [],
        collections: [],
        source: "polymarket",
        count: 0,
        error: err instanceof Error ? err.message : "fetch failed",
      },
      { status: 200 }
    );
  }
}
