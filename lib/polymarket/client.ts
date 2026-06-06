// Polymarket as the underlying data source — we pull real prediction markets from
// the public Gamma API and wrap them as our collectible-card Markets. We are the
// middleman: prices, volume, and resolution all come from Polymarket.
//
// Markets are organised into top-level "collections" (see lib/collections.ts). Each
// collection maps to one Polymarket tag; we fetch per-tag, map to our shape, and stamp
// every market with its collection id. The World Cup collection is the mint pool;
// the others are browse-only (phase 1).

import type { Market, Category, Rarity, MarketStatus } from "../types";
import type { GammaEvent, GammaMarket } from "./types";
import { COLLECTIONS, PRIMARY_COLLECTION, getCollection } from "../collections";
import type { Collection, CollectionId } from "../collections";

const GAMMA = "https://gamma-api.polymarket.com";
const TTL_MS = 180_000; // in-memory cache window (~3 min)

// Parse a JSON-encoded string field; return [] on anything unexpected.
function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

// Longshots are rarer — mirrors the original mock distribution where low-probability
// outcomes were legendary/mythic. This is OUR value-add layer on top of Polymarket.
function rarityFromProbability(p: number): Rarity {
  if (p >= 0.6) return "common";
  if (p >= 0.35) return "rare";
  if (p >= 0.15) return "epic";
  if (p >= 0.05) return "legendary";
  return "mythic";
}

// Map a Polymarket question/event into our card categories using keyword heuristics.
// These are tuned for World Cup; other collections fall through to "wild" (the
// category sub-filter is only surfaced for the World Cup collection in the UI).
function categoryFor(question: string, eventTitle: string): Category {
  const q = `${eventTitle} ${question}`.toLowerCase();
  if (/\bvs\.?\b| v\. | versus /.test(q)) return "match";
  if (/goalscorer|golden (boot|ball)|assist|\bgoals?\b|young player|top scorer|mvp/.test(q))
    return "player";
  if (/group [a-l]\b|advance|qualif|knockout|reach|eliminat/.test(q)) return "team";
  if (/winner|win the|continent|champion|final|semi/.test(q)) return "tournament";
  return "wild";
}

function statusFor(gm: GammaMarket, yesProb: number): MarketStatus {
  if (gm.closed) return yesProb >= 0.5 ? "resolved_yes" : "resolved_no";
  if (gm.acceptingOrders === false) return "open";
  return "live";
}

function mapMarket(gm: GammaMarket, event: GammaEvent, collectionId: CollectionId): Market | null {
  const statement = (gm.question || gm.groupItemTitle || "").trim();
  if (!statement) return null;

  const prices = parseJsonArray(gm.outcomePrices);
  const yesProb = prices.length ? Number(prices[0]) : NaN;
  if (!Number.isFinite(yesProb) || yesProb <= 0 || yesProb >= 1) return null; // skip degenerate/0-1

  const rarity = rarityFromProbability(yesProb);
  const category = categoryFor(statement, event.title || "");
  const volume =
    gm.volumeNum ?? (gm.volume ? Number(gm.volume) : undefined);
  const change24h =
    typeof gm.oneDayPriceChange === "number"
      ? Math.round(gm.oneDayPriceChange * 100 * 100) / 100 // fraction → pct points
      : undefined;

  return {
    id: `pm_${gm.id}`,
    statement,
    category,
    collection: collectionId,
    impliedProbability: yesProb,
    resolutionDate: (gm.endDate || event.title || "").slice(0, 10) || "2026-07-19",
    status: statusFor(gm, yesProb),
    rarity,
    imageUrl: gm.image || gm.icon || undefined,
    sourceUrl: gm.slug ? `https://polymarket.com/market/${gm.slug}` : undefined,
    volume: Number.isFinite(volume as number) ? (volume as number) : undefined,
    volume24hr: typeof gm.volume24hr === "number" ? gm.volume24hr : undefined,
    change24h,
  };
}

async function fetchEventsByTag(tagSlug: string): Promise<GammaEvent[]> {
  const url =
    `${GAMMA}/events?closed=false&active=true&limit=200` +
    `&tag_slug=${encodeURIComponent(tagSlug)}&order=volume24hr&ascending=false`;
  try {
    // Uncached: the raw payload is multi-MB. We cache the small mapped result instead.
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as GammaEvent[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Per-collection process-level cache of the mapped result so we hit Polymarket at
// most once per TTL per tag. The raw payloads exceed Next's 2MB fetch-cache limit,
// so we own the caching here.
const cache = new Map<CollectionId, { at: number; markets: Market[] }>();

// Pull one collection's markets from its Polymarket tag, map to our shape, cache.
export async function fetchCollectionMarkets(collection: Collection): Promise<Market[]> {
  const cached = cache.get(collection.id);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.markets;

  const evts = await fetchEventsByTag(collection.tagSlug);
  const events = new Map<string, GammaEvent>();
  for (const e of evts) events.set(e.id, e);

  const markets: Market[] = [];
  const seen = new Set<string>();
  for (const event of events.values()) {
    // Favorites first within each event — surfaces the marquee cards (Brazil, Argentina,
    // Mbappé…) instead of a flood of ~0% longshots — then cap the event's contribution.
    const mapped = (event.markets || [])
      .map((gm) => mapMarket(gm, event, collection.id))
      .filter((m): m is Market => m !== null)
      .sort((a, b) => b.impliedProbability - a.impliedProbability)
      .slice(0, collection.perEventCap);
    for (const m of mapped) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        markets.push(m);
      }
    }
  }

  // Most-traded first, so the ticker and pack pool surface the liquid, relevant markets.
  markets.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  const result = markets.slice(0, collection.maxMarkets);

  if (result.length > 0) cache.set(collection.id, { at: Date.now(), markets: result });
  return result;
}

// Back-compat: the store/pack pool drives off World Cup. MarketsLoader + /api/markets
// (no params) still call this; it's just the primary collection now.
export async function fetchWorldCupMarkets(): Promise<Market[]> {
  const wc = getCollection(PRIMARY_COLLECTION);
  return wc ? fetchCollectionMarkets(wc) : [];
}

// Fetch a collection's markets by id (used by the marketplace collection pages).
export async function fetchMarketsByCollectionId(id: string): Promise<Market[]> {
  const c = getCollection(id);
  return c ? fetchCollectionMarkets(c) : [];
}

export type CollectionSummary = {
  id: CollectionId;
  marketCount: number;
  totalVolume: number;
  volume24h: number;
};

// Lightweight stats per collection for the marketplace landing grid. Fetches every
// collection (each cached independently), then summarises — cheap after warm-up.
export async function fetchCollectionSummaries(): Promise<CollectionSummary[]> {
  const summaries = await Promise.all(
    COLLECTIONS.map(async (c) => {
      const markets = await fetchCollectionMarkets(c);
      let totalVolume = 0;
      let volume24h = 0;
      for (const m of markets) {
        totalVolume += m.volume ?? 0;
        volume24h += m.volume24hr ?? 0;
      }
      return { id: c.id, marketCount: markets.length, totalVolume, volume24h };
    })
  );
  return summaries;
}
