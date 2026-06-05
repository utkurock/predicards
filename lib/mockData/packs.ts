import type { Pack } from "../types";

// Prices and drop rates are calibrated against rarityValue (see lib/pricing.ts)
// so the expected card value in each pack stays below its price — the house
// clears ~9–12% on every pack:
//   bronze $1  → EV ≈ $0.91  (house +8.8%)
//   silver $5  → EV ≈ $4.40  (house +11.9%)
//   gold   $10 → EV ≈ $8.99  (house +10.1%)
export const packs: Pack[] = [
  {
    id: "bronze",
    tier: "bronze",
    price: 1,
    cardCount: 5,
    description: "Entry tier. Mostly commons with a chance of rare.",
    guaranteed: "All Common+",
    dropRates: { common: 0.80, rare: 0.17, epic: 0.03, legendary: 0.0, mythic: 0.0 },
  },
  {
    id: "silver",
    tier: "silver",
    price: 5,
    cardCount: 5,
    description: "Guaranteed Rare+. Solid value for set hunters.",
    guaranteed: "≥1 Rare+",
    dropRates: { common: 0.35, rare: 0.40, epic: 0.20, legendary: 0.045, mythic: 0.005 },
  },
  {
    id: "gold",
    tier: "gold",
    price: 10,
    cardCount: 7,
    description: "Guaranteed Epic+. Best odds at Legendary and Mythic.",
    guaranteed: "≥1 Epic+",
    dropRates: { common: 0.22, rare: 0.43, epic: 0.28, legendary: 0.06, mythic: 0.01 },
  },
];
