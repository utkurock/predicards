import type { Card, Pack, Rarity } from "./types";
import { getMarkets } from "./marketsSource";
import { makeCard } from "./cardFactory";
import { rarityOrder } from "./pricing";

function pickRarity(pack: Pack, slotIndex: number): Rarity {
  // For guaranteed slots, bump up minimum rarity
  let minRarity: Rarity = "common";
  if (slotIndex === 0) {
    if (pack.tier === "silver") minRarity = "rare";
    if (pack.tier === "gold") minRarity = "epic";
  }

  const minIdx = rarityOrder.indexOf(minRarity);

  // Build cumulative distribution from drop rates, zeroing entries below min
  const entries = rarityOrder.map((r, idx) => ({
    r,
    p: idx >= minIdx ? pack.dropRates[r] : 0,
  }));
  const total = entries.reduce((s, e) => s + e.p, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.p;
    if (roll <= 0) return e.r;
  }
  return entries[entries.length - 1].r;
}

function pickMarketForRarity(rarity: Rarity) {
  // Prefer markets whose native rarity matches; fall back to any open market.
  // Reads the live registry (real Polymarket markets once loaded, mock otherwise).
  const markets = getMarkets();
  const matching = markets.filter((m) => m.rarity === rarity);
  const pool = matching.length > 0 ? matching : markets;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openPack(pack: Pack): Card[] {
  const out: Card[] = [];
  for (let i = 0; i < pack.cardCount; i++) {
    const rarity = pickRarity(pack, i);
    const market = pickMarketForRarity(rarity);
    const seed = Math.floor(Math.random() * 1_000_000);
    out.push(makeCard(market, rarity, seed));
  }
  return out;
}

// Forge: 3 same-rarity cards -> 1 of next rarity (probabilistically)
export function forgeResult(rarity: Rarity): Rarity {
  const roll = Math.random();
  if (rarity === "common") {
    if (roll < 0.70) return "rare";
    if (roll < 0.95) return "epic";
    return "legendary";
  }
  if (rarity === "rare") {
    if (roll < 0.65) return "epic";
    if (roll < 0.95) return "legendary";
    return "mythic";
  }
  if (rarity === "epic") {
    return roll < 0.80 ? "legendary" : "mythic";
  }
  return "mythic";
}

export function forgeCard(rarity: Rarity): Card {
  const newRarity = forgeResult(rarity);
  const market = pickMarketForRarity(newRarity);
  return makeCard(market, newRarity, Math.floor(Math.random() * 1_000_000));
}
