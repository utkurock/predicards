// Commission economy. Card holders earn from two volume sources, split EQUALLY PER CARD
// across all holders of a given market's cards:
//   1. In-app fee  — a cut of every card purchase on our marketplace (real redistribution).
//   2. Polymarket  — passive yield as the underlying Polymarket market's volume grows.
// All amounts are virtual USDT (play-money economy).

import type { Card, Market } from "./types";

// Defaults — overridable at runtime from the config/commission Firestore doc (see /dev).
export const IN_APP_FEE_RATE = 0.05;       // 5% fee taken from each card sale (secondary sales)
export const POLY_YIELD_BPS = 0.000005;    // 0.0005% of Polymarket volume growth accrues as yield
                                           // (tuned: keeps virtual payouts sane vs a ~500 USDT balance)

// Client-side runtime override of the Polymarket yield rate, fed from the config doc.
// The server reads the config doc directly for the in-app fee; this powers client calc/display.
let activePolyBps = POLY_YIELD_BPS;
export function setActivePolyBps(bps: number): void {
  if (Number.isFinite(bps) && bps >= 0) activePolyBps = bps;
}
export function getActivePolyBps(): number {
  return activePolyBps;
}

// Per-market global ledger, stored at marketStats/{marketId}.
export type MarketStat = {
  supply: number;     // total cards minted for this market (the per-card divisor)
  accPerCard: number; // cumulative in-app commission distributed, per card
};

export const emptyStat = (): MarketStat => ({ supply: 0, accPerCard: 0 });

export function normalizeStat(raw: Partial<MarketStat> | undefined): MarketStat {
  return {
    supply: typeof raw?.supply === "number" && raw.supply > 0 ? raw.supply : 0,
    accPerCard: typeof raw?.accPerCard === "number" ? raw.accPerCard : 0,
  };
}

// In-app commission one card can currently claim (delta since its checkpoint).
export function inAppClaimable(card: Card, stat: MarketStat): number {
  const base = card.commissionBase ?? stat.accPerCard; // undefined → no back-claim
  return Math.max(0, stat.accPerCard - base);
}

// Polymarket passive yield one card can currently claim, split equally per card.
export function polyClaimable(card: Card, market: Market | undefined, stat: MarketStat): number {
  if (!market || typeof market.volume !== "number") return 0;
  const base = card.volumeBase ?? market.volume; // undefined → no back-claim
  const supply = Math.max(1, stat.supply);
  return (Math.max(0, market.volume - base) * activePolyBps) / supply;
}

export function claimableForCard(card: Card, market: Market | undefined, stat: MarketStat): number {
  return inAppClaimable(card, stat) + polyClaimable(card, market, stat);
}

// Forward-looking estimate: virtual USDT a single card earns per day from Polymarket
// volume, split equally per card. Drives the "Est. yield" column on the markets page.
export function estDailyYieldPerCard(market: Market | undefined, stat: MarketStat): number {
  const v24 = market?.volume24hr ?? 0;
  const supply = Math.max(1, stat.supply);
  return (v24 * activePolyBps) / supply;
}

// Only cards you actually hold earn (not listed/burned/settled).
export function isEarningCard(card: Card): boolean {
  return (
    card.status === "in_album" ||
    card.status === "locked_in_parlay" ||
    card.status === "locked_in_league"
  );
}
