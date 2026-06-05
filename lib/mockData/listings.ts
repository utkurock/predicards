import type { MarketListing, Rarity } from "../types";
import { markets } from "./markets";
import { makeCard } from "../cardFactory";
import { change24h } from "../pricing";

const rarities: Rarity[] = ["common", "common", "rare", "rare", "epic", "legendary"];
const sellerIds = ["0xA1...c4f", "0x9F...221", "0x3B...88e", "0xC7...4a1", "0x12...d09", "0xE5...77a"];

// Deterministic PRNG so SSR and CSR produce identical listings (no hydration mismatch).
function rand01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function buildListings(): MarketListing[] {
  const out: MarketListing[] = [];
  let seed = 1;
  for (let i = 0; i < 150; i++) {
    const market = markets[i % markets.length];
    const rarity =
      market.rarity === "mythic"
        ? "mythic"
        : market.rarity === "legendary" && rand01(i + 1) < 0.7
        ? "legendary"
        : rarities[i % rarities.length];
    const card = makeCard(market, rarity, seed++, sellerIds[i % sellerIds.length]);
    card.status = "listed";
    const listingPrice = Number((card.currentMarketPrice * (0.9 + rand01(i + 101) * 0.3)).toFixed(3));
    out.push({
      id: `l_${i}`,
      card,
      sellerId: sellerIds[i % sellerIds.length],
      price: listingPrice,
      change24h: change24h(seed),
      listedAt: new Date(2026, 4, 10 + (i % 10)).toISOString(),
    });
  }
  return out;
}

export const listings = buildListings();
