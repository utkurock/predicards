import type { Card, Rarity } from "./types";

export const rarityOrder: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export const rarityWeight: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

export const rarityLabel: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

export const editionTotal: Record<Rarity, number> = {
  common: 5000,
  rare: 1500,
  epic: 500,
  legendary: 100,
  mythic: 25,
};

// ─── Canonical card value (the card's "worth" in USDT), by rarity ───
// Rarer = more valuable. Pack prices/odds are calibrated (see mockData/packs.ts)
// so the expected card value handed out stays ~8–12% below the pack price — the
// house always clears at least 5–10%. The vault buys cards back at 15% under value.
export const rarityValue: Record<Rarity, number> = {
  common: 0.08,
  rare: 0.45,
  epic: 1.4,
  legendary: 5.0,
  mythic: 18.0,
};

export function cardValue(rarity: Rarity): number {
  return rarityValue[rarity];
}

// Vault buyback: players can sell any card back to the house at 15% below value.
export const VAULT_BUYBACK_RATE = 0.85;
export function vaultBuyback(rarity: Rarity): number {
  return Number((rarityValue[rarity] * VAULT_BUYBACK_RATE).toFixed(2));
}

export function payoutMultiplier(impliedProbability: number): number {
  if (impliedProbability <= 0) return 100;
  return Math.max(1.05, 0.95 / impliedProbability);
}

// Stake size scales with rarity — common = 1 USDT cost basis, legendary = 0.4 USDT
export function baseMintPrice(rarity: Rarity, impliedProbability: number): number {
  const stakes: Record<Rarity, number> = {
    common: 1.0,
    rare: 0.85,
    epic: 0.7,
    legendary: 0.45,
    mythic: 0.25,
  };
  const stake = stakes[rarity];
  // mint price ≈ stake × impliedProbability (so payout = stake × multiplier ≈ stake/impliedProbability)
  return Number((stake * impliedProbability).toFixed(3));
}

export function potentialPayout(rarity: Rarity): number {
  const stakes: Record<Rarity, number> = {
    common: 1.0,
    rare: 0.85,
    epic: 0.7,
    legendary: 0.45,
    mythic: 0.25,
  };
  return Number(stakes[rarity].toFixed(2));
}

// Mock random walk for current price: drifts around mint price with sentiment bias
export function simulateMarketPrice(mintPrice: number, seed: number, sentiment = 0): number {
  const rnd = pseudoRandom(seed);
  const drift = (rnd - 0.5) * 0.6 + sentiment * 0.2;
  const next = mintPrice * (1 + drift);
  return Math.max(0.001, Number(next.toFixed(3)));
}

export function change24h(seed: number): number {
  const r = pseudoRandom(seed) - 0.5;
  return Number((r * 0.4).toFixed(3));
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function fairValueEstimate(card: Card): number {
  // mock: weighted blend of mint price and current price + a small "model edge"
  return Number(((card.impliedOddsAtMint * 0.4 + card.currentMarketPrice * 0.6) * 1.1).toFixed(3));
}
