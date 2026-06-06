// Event collections — the top-level taxonomy of the marketplace (phygitals-style:
// each collection is a "drop" you browse into). Every collection maps to one
// Polymarket tag; markets are pulled per-tag and stamped with their collection id.
//
// Scope (phase 1): only `world-cup` is MINTABLE — packs, parlays and leagues still
// draw exclusively from World Cup (see lib/marketsSource.ts → packLogic). The other
// collections are browse-only: their live Polymarket markets are visible in the
// marketplace, but no cards mint from them yet. Flip `mintable` later to expand.

export type CollectionId = "world-cup" | "sports" | "politics" | "culture";

export type Collection = {
  id: CollectionId;
  label: string;
  blurb: string;
  emoji: string;
  accent: string; // space-separated RGB, used as rgb(var-style) inline for covers
  tagSlug: string; // Polymarket Gamma `tag_slug`
  mintable: boolean; // can packs mint cards from this collection? (world-cup only for now)
  perEventCap: number; // max markets surfaced per event (favorites-first)
  maxMarkets: number; // global cap for this collection's pool
};

export const COLLECTIONS: Collection[] = [
  {
    id: "world-cup",
    label: "World Cup 2026",
    blurb: "Every World Cup market — winners, golden boot, group stages.",
    emoji: "⚽",
    accent: "32 124 255", // Base azure (matches app accent)
    tagSlug: "fifa-world-cup",
    mintable: true,
    perEventCap: 14,
    maxMarkets: 120,
  },
  {
    id: "sports",
    label: "Sports",
    blurb: "NBA, NFL and the leagues — live odds across the sporting world.",
    emoji: "🏀",
    accent: "245 158 11", // amber
    tagSlug: "sports",
    mintable: false,
    perEventCap: 8,
    maxMarkets: 80,
  },
  {
    id: "politics",
    label: "Politics & Elections",
    blurb: "High-volume markets on policy, elections and world events.",
    emoji: "🗳️",
    accent: "139 92 246", // violet
    tagSlug: "politics",
    mintable: false,
    perEventCap: 8,
    maxMarkets: 80,
  },
  {
    id: "culture",
    label: "Pop Culture & Awards",
    blurb: "Oscars, Grammys and the moments the internet bets on.",
    emoji: "🎬",
    accent: "236 72 153", // pink
    tagSlug: "pop-culture",
    mintable: false,
    perEventCap: 8,
    maxMarkets: 80,
  },
];

export const PRIMARY_COLLECTION: CollectionId = "world-cup";

const BY_ID = new Map<string, Collection>(COLLECTIONS.map((c) => [c.id, c]));

export function getCollection(id: string | undefined): Collection | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function isCollectionId(id: string | undefined): id is CollectionId {
  return !!id && BY_ID.has(id);
}
