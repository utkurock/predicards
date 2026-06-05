// Polymarket as the underlying data source — we pull real World Cup prediction
// markets from the public Gamma API and wrap them as our collectible-card Markets.
// We are the middleman: prices, volume, and resolution all come from Polymarket.

import type { Market, Category, Rarity, MarketStatus } from "../types";
import type { GammaEvent, GammaMarket } from "./types";

const GAMMA = "https://gamma-api.polymarket.com";
const TTL_MS = 180_000; // in-memory cache window (~3 min)
const MAX_MARKETS = 120; // cap payload + keep minting pool sane
const PER_EVENT = 14; // per-event cap so a 60-outcome "Winner" event can't flood the pool

// The "fifa-world-cup" tag is the comprehensive source (Winner, Top Goalscorer, all
// group winners, continent…). Its full payload exceeds Next's 2MB fetch-cache limit,
// so we fetch it uncached and cache the small mapped result ourselves (below).
const WORLD_CUP_TAG = "fifa-world-cup";

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

function mapMarket(gm: GammaMarket, event: GammaEvent): Market | null {
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

// Process-level cache of the mapped result so we hit Polymarket at most once per TTL.
let cache: { at: number; markets: Market[] } | null = null;

// Pull every World Cup market from the fifa-world-cup tag, map to our shape, cache.
export async function fetchWorldCupMarkets(): Promise<Market[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.markets;

  const wcEvents = await fetchEventsByTag(WORLD_CUP_TAG);
  const events = new Map<string, GammaEvent>();
  for (const e of wcEvents) events.set(e.id, e);

  const markets: Market[] = [];
  const seen = new Set<string>();
  for (const event of events.values()) {
    // Favorites first within each event — surfaces the marquee cards (Brazil, Argentina,
    // Mbappé…) instead of a flood of ~0% longshots — then cap the event's contribution.
    const mapped = (event.markets || [])
      .map((gm) => mapMarket(gm, event))
      .filter((m): m is Market => m !== null)
      .sort((a, b) => b.impliedProbability - a.impliedProbability)
      .slice(0, PER_EVENT);
    for (const m of mapped) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        markets.push(m);
      }
    }
  }

  // Most-traded first, so the ticker and pack pool surface the liquid, relevant markets.
  markets.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  const result = markets.slice(0, MAX_MARKETS);

  if (result.length > 0) cache = { at: Date.now(), markets: result };
  return result;
}
