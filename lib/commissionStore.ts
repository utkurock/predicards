"use client";

import { create } from "zustand";
import { collection, doc, increment, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase/client";
import type { Card } from "./types";
import {
  normalizeStat,
  setActivePolyBps,
  IN_APP_FEE_RATE,
  POLY_YIELD_BPS,
  type MarketStat,
} from "./commission";

export type CommissionRates = { inAppFeeRate: number; polyYieldBps: number };

type CommissionState = {
  stats: Record<string, MarketStat>; // keyed by marketId
  rates: CommissionRates;
  loaded: boolean;
};

export const useCommission = create<CommissionState>(() => ({
  stats: {},
  rates: { inAppFeeRate: IN_APP_FEE_RATE, polyYieldBps: POLY_YIELD_BPS },
  loaded: false,
}));

// Shared subscriptions: the per-market ledger + the adjustable rate config.
let unsubStats: (() => void) | null = null;
let unsubConfig: (() => void) | null = null;
let subscribers = 0;

function ensureSubscription() {
  if (unsubStats) return;
  unsubStats = onSnapshot(
    collection(db, "marketStats"),
    (snap) => {
      const stats: Record<string, MarketStat> = {};
      for (const d of snap.docs) stats[d.id] = normalizeStat(d.data());
      useCommission.setState({ stats, loaded: true });
    },
    () => useCommission.setState({ loaded: true })
  );
  unsubConfig = onSnapshot(doc(db, "config", "commission"), (snap) => {
    const data = snap.data() as Partial<CommissionRates> | undefined;
    const rates: CommissionRates = {
      inAppFeeRate:
        typeof data?.inAppFeeRate === "number" ? data.inAppFeeRate : IN_APP_FEE_RATE,
      polyYieldBps:
        typeof data?.polyYieldBps === "number" ? data.polyYieldBps : POLY_YIELD_BPS,
    };
    setActivePolyBps(rates.polyYieldBps); // keep client-side calc in sync
    useCommission.setState({ rates });
  });
}

// Call once (e.g. from a layout-level loader) to keep the ledger live for everyone.
export function startCommissionFeed(): () => void {
  subscribers += 1;
  ensureSubscription();
  return () => {
    subscribers -= 1;
    if (subscribers === 0) {
      unsubStats?.();
      unsubConfig?.();
      unsubStats = null;
      unsubConfig = null;
    }
  };
}

// Persist new commission rates (from /dev). Writes the config doc the feed listens to.
export async function saveCommissionRates(rates: CommissionRates): Promise<void> {
  await setDoc(doc(db, "config", "commission"), rates, { merge: true });
}

export function getStat(marketId: string): MarketStat {
  return useCommission.getState().stats[marketId] ?? { supply: 0, accPerCard: 0 };
}

// Stamp freshly minted cards with their commission checkpoint (current accPerCard) and
// bump each market's global supply (the per-card divisor). Returns the stamped cards.
export function recordMint(cards: Card[]): Card[] {
  const stats = useCommission.getState().stats;

  const stamped = cards.map((c) => ({
    ...c,
    commissionBase: stats[c.marketId]?.accPerCard ?? 0,
  }));

  // Increment supply per market — fire-and-forget; admin SDK reads it on buys.
  const counts = new Map<string, number>();
  for (const c of cards) counts.set(c.marketId, (counts.get(c.marketId) ?? 0) + 1);
  for (const [marketId, n] of counts) {
    void setDoc(
      doc(db, "marketStats", marketId),
      { supply: increment(n) },
      { merge: true }
    ).catch(() => {});
  }

  return stamped;
}
