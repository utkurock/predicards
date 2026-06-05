"use client";

import { create } from "zustand";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase/client";
import type {
  Card,
  League,
  LeagueEntry,
  LeagueState,
  Market,
  ParlaySet,
} from "./types";
import { markets as seedMarkets } from "./mockData/markets";
import { setMarketsRegistry } from "./marketsSource";
import { generateParlays } from "./parlayGen";
import { useCommission } from "./commissionStore";
import { claimableForCard, isEarningCard } from "./commission";
import { potentialPayout, vaultBuyback } from "./pricing";
import { makeCard } from "./cardFactory";
import {
  buildSchedule,
  championshipPrize,
  generateBots,
  lineupStrength as computeLineupStrength,
  playRound,
  standings,
} from "./leagueLogic";

type MarketStatus = "open" | "live" | "resolved_yes" | "resolved_no";
type MarketStatusMap = Record<string, MarketStatus>;

// The slice of state that is persisted per-user to Firestore (users/{uid}).
type PersistedState = {
  balance: number;
  collection: Card[];
  parlays: ParlaySet[];
  marketStatus: MarketStatusMap;
  totalPnL: number;
  leagues: Record<string, LeagueState>;
};

type State = PersistedState & {
  hydrated: boolean;
  // Live market catalog (real Polymarket markets once loaded; mock fallback). NOT persisted.
  markets: Market[];
};

type Actions = {
  spend: (amount: number) => boolean;
  credit: (amount: number) => void;
  addCards: (cards: Card[]) => void;
  removeCardById: (id: string) => Card | undefined;
  burnCards: (ids: string[]) => void;
  listCard: (cardId: string, price: number) => void;
  unlistCard: (cardId: string) => void;
  sellToVault: (cardId: string) => number;
  applyPurchase: (card: Card, newBalance: number) => void;
  activateParlay: (parlayId: string) => boolean;
  resolveMarket: (marketId: string, outcome: "yes" | "no") => void;
  setMarkets: (markets: Market[]) => void;
  claimCommission: () => number;
  claimCardCommission: (cardId: string) => number;
  resetAll: () => void;
  seedDemo: () => void;
  joinLeague: (league: League, cardIds: string[]) => { ok: boolean; reason?: string };
  playNextRound: (leagueId: string, league: League) => boolean;
  playAllRounds: (leagueId: string, league: League) => void;
  claimLeague: (leagueId: string, league: League) => number;
  leaveLeague: (leagueId: string) => void;
};

const initialMarketStatus = (): MarketStatusMap =>
  Object.fromEntries(seedMarkets.map((m) => [m.id, m.status]));

const freshPersisted = (): PersistedState => ({
  balance: 500,
  collection: [],
  parlays: generateParlays(seedMarkets), // regenerated from live markets once they load
  marketStatus: initialMarketStatus(),
  totalPnL: 0,
  leagues: {},
});

export const useStore = create<State & Actions>()((set, get) => ({
  ...freshPersisted(),
  hydrated: false,
  markets: seedMarkets,

  spend: (amount) => {
    const { balance } = get();
    if (balance < amount) return false;
    set({ balance: Number((balance - amount).toFixed(2)) });
    return true;
  },

  credit: (amount) => {
    set({ balance: Number((get().balance + amount).toFixed(2)) });
  },

  addCards: (cards) => {
    set({ collection: [...get().collection, ...cards] });
  },

  removeCardById: (id) => {
    const card = get().collection.find((c) => c.id === id);
    if (card) set({ collection: get().collection.filter((c) => c.id !== id) });
    return card;
  },

  burnCards: (ids) => {
    set({ collection: get().collection.filter((c) => !ids.includes(c.id)) });
  },

  listCard: (cardId, price) => {
    set({
      collection: get().collection.map((c) =>
        c.id === cardId ? { ...c, status: "listed", currentMarketPrice: price } : c
      ),
    });
  },

  unlistCard: (cardId) => {
    set({
      collection: get().collection.map((c) =>
        c.id === cardId ? { ...c, status: "in_album" } : c
      ),
    });
  },

  // Sell a card back to the house vault at 15% below its value. Credits balance,
  // removes the card. Only album cards (not listed/locked) can be sold. Returns
  // the amount paid, or 0 if the card can't be sold.
  sellToVault: (cardId) => {
    const card = get().collection.find((c) => c.id === cardId);
    if (!card || card.status !== "in_album") return 0;
    const amount = vaultBuyback(card.rarity);
    set({
      collection: get().collection.filter((c) => c.id !== cardId),
      balance: Number((get().balance + amount).toFixed(2)),
    });
    return amount;
  },

  // Called after a successful server-side marketplace purchase.
  applyPurchase: (card, newBalance) => {
    set({
      collection: [...get().collection, card],
      balance: Number(newBalance.toFixed(2)),
    });
  },

  activateParlay: (parlayId) => {
    const parlay = get().parlays.find((p) => p.id === parlayId);
    if (
      !parlay ||
      parlay.status === "activated" ||
      parlay.status === "settled_won" ||
      parlay.status === "settled_lost"
    )
      return false;
    const collection = get().collection;
    const lockedIds: string[] = [];
    const required = [...parlay.requiredMarketIds];
    for (const card of collection) {
      if (card.status === "in_album" && required.includes(card.marketId)) {
        lockedIds.push(card.id);
        required.splice(required.indexOf(card.marketId), 1);
      }
      if (required.length === 0) break;
    }
    if (required.length > 0) return false;
    set({
      collection: collection.map((c) =>
        lockedIds.includes(c.id) ? { ...c, status: "locked_in_parlay" } : c
      ),
      parlays: get().parlays.map((p) =>
        p.id === parlayId ? { ...p, status: "activated" } : p
      ),
    });
    return true;
  },

  resolveMarket: (marketId, outcome) => {
    const status: MarketStatus = outcome === "yes" ? "resolved_yes" : "resolved_no";
    const { collection, parlays, markets } = get();
    const market = markets.find((m) => m.id === marketId);
    const stat = useCommission.getState().stats[marketId] ?? { supply: 0, accPerCard: 0 };
    let payout = 0;

    const newCollection = collection.map((c) => {
      if (c.marketId !== marketId) return c;
      // Settle accrued commission before the card stops earning at resolution.
      if (isEarningCard(c)) payout += claimableForCard(c, market, stat);
      if (c.status === "in_album" || c.status === "listed") {
        if (outcome === "yes") {
          payout += c.potentialPayout;
          return { ...c, status: "settled_won" as const };
        }
        return { ...c, status: "settled_lost" as const };
      }
      return c;
    });

    const newParlays = parlays.map((p) => {
      if (p.status !== "activated") return p;
      if (!p.requiredMarketIds.includes(marketId)) return p;
      if (outcome === "no") return { ...p, status: "settled_lost" as const };
      const newStatus = { ...get().marketStatus, [marketId]: status };
      const allYes = p.requiredMarketIds.every((mid) => newStatus[mid] === "resolved_yes");
      if (allYes) {
        const parlayPayout =
          p.requiredMarketIds.reduce((sum, mid) => {
            const card = collection.find(
              (c) => c.marketId === mid && c.status === "locked_in_parlay"
            );
            return sum + (card ? potentialPayout(card.rarity) : 0);
          }, 0) * p.multiplier;
        payout += parlayPayout;
        return { ...p, status: "settled_won" as const };
      }
      return p;
    });

    set({
      collection: newCollection,
      parlays: newParlays,
      marketStatus: { ...get().marketStatus, [marketId]: status },
      balance: Number((get().balance + payout).toFixed(2)),
      totalPnL: Number((get().totalPnL + payout).toFixed(2)),
    });
  },

  // Install the live market catalog: update the store (for display), mirror it to the
  // module registry (for packLogic), seed marketStatus for unknown ids, and regenerate
  // parlay sets from the live markets — freezing any parlay already in progress.
  setMarkets: (markets) => {
    if (!markets || markets.length === 0) return;
    setMarketsRegistry(markets);
    const status = { ...get().marketStatus };
    for (const m of markets) {
      if (!(m.id in status)) status[m.id] = m.status;
    }
    // Regenerate definitions, but keep activated/settled parlays exactly as they were
    // (def + status) so a refresh never disrupts a parlay the user has locked cards into.
    const prev = get().parlays;
    const parlays = generateParlays(markets).map((gen) => {
      const existing = prev.find((p) => p.id === gen.id);
      if (existing && existing.status !== "incomplete") return existing;
      return existing ? { ...gen, status: existing.status } : gen;
    });
    set({ markets, marketStatus: status, parlays });
  },

  // Claim accrued commission across all held cards: credit balance, reset checkpoints.
  claimCommission: () => {
    const { collection, markets } = get();
    const stats = useCommission.getState().stats;
    let total = 0;
    const newCollection = collection.map((c) => {
      if (!isEarningCard(c)) return c;
      const market = markets.find((m) => m.id === c.marketId);
      const stat = stats[c.marketId] ?? { supply: 0, accPerCard: 0 };
      const amt = claimableForCard(c, market, stat);
      if (amt <= 0) return c;
      total += amt;
      return { ...c, commissionBase: stat.accPerCard, volumeBase: market?.volume ?? c.volumeBase };
    });
    if (total <= 0) return 0;
    set({
      collection: newCollection,
      balance: Number((get().balance + total).toFixed(2)),
      totalPnL: Number((get().totalPnL + total).toFixed(2)),
    });
    return Number(total.toFixed(2));
  },

  // Settle one card's accrued commission — used to auto-claim before listing it for sale
  // so a holder never forfeits earnings on resale.
  claimCardCommission: (cardId) => {
    const { collection, markets } = get();
    const card = collection.find((c) => c.id === cardId);
    if (!card || !isEarningCard(card)) return 0;
    const market = markets.find((m) => m.id === card.marketId);
    const stat = useCommission.getState().stats[card.marketId] ?? { supply: 0, accPerCard: 0 };
    const amt = claimableForCard(card, market, stat);
    if (amt <= 0) return 0;
    set({
      collection: collection.map((c) =>
        c.id === cardId
          ? { ...c, commissionBase: stat.accPerCard, volumeBase: market?.volume ?? c.volumeBase }
          : c
      ),
      balance: Number((get().balance + amt).toFixed(2)),
      totalPnL: Number((get().totalPnL + amt).toFixed(2)),
    });
    return Number(amt.toFixed(2));
  },

  resetAll: () => {
    set({ ...freshPersisted(), hydrated: true });
  },

  seedDemo: () => {
    const targetMarkets = ["m8", "m12", "m13", "m15", "m16", "m18", "m1", "m4"];
    const cards: Card[] = [];
    let seed = 100;
    for (const mid of targetMarkets) {
      const market = seedMarkets.find((m) => m.id === mid);
      if (!market) continue;
      const rarity =
        market.rarity === "legendary"
          ? "legendary"
          : market.rarity === "epic"
          ? "epic"
          : market.rarity === "common"
          ? "common"
          : "rare";
      cards.push(makeCard(market, rarity, seed++, "user"));
    }
    set({ collection: cards, balance: 500 });
  },

  joinLeague: (league, cardIds) => {
    const existing = get().leagues[league.id];
    if (existing) return { ok: false, reason: "Already joined this league." };
    if (cardIds.length < league.minLineup)
      return { ok: false, reason: `Need at least ${league.minLineup} cards.` };
    if (cardIds.length > league.maxLineup)
      return { ok: false, reason: `Max ${league.maxLineup} cards.` };

    const collection = get().collection;
    const picked = cardIds
      .map((id) => collection.find((c) => c.id === id))
      .filter((c): c is Card => Boolean(c));
    if (picked.length !== cardIds.length)
      return { ok: false, reason: "Some cards are no longer available." };
    if (picked.some((c) => c.status !== "in_album"))
      return { ok: false, reason: "All cards must be in your album (not listed/locked)." };

    if (!get().spend(league.entryFee))
      return { ok: false, reason: `Need ${league.entryFee} USDT entry fee.` };

    const power = computeLineupStrength(picked);
    const userEntryId = `${league.id}:user`;
    const bots = generateBots(league, userEntryId);
    const userEntry: LeagueEntry = {
      id: userEntryId,
      leagueId: league.id,
      ownerLabel: "You",
      isUser: true,
      lineupCardIds: cardIds,
      lineupStrength: power,
      rosterPower: power,
      wins: 0, draws: 0, losses: 0, points: 0, balanceDelta: 0,
    };
    const entries = [userEntry, ...bots];
    const matches = buildSchedule(entries, league.rounds);

    set({
      collection: collection.map((c) =>
        cardIds.includes(c.id) ? { ...c, status: "locked_in_league" } : c
      ),
      leagues: {
        ...get().leagues,
        [league.id]: {
          leagueId: league.id,
          status: "live",
          entries,
          matches,
          currentRound: 0,
          userEntryId,
          claimed: false,
        },
      },
    });
    return { ok: true };
  },

  playNextRound: (leagueId, league) => {
    const ls = get().leagues[leagueId];
    if (!ls || ls.status === "finished") return false;
    if (ls.currentRound >= league.rounds) return false;
    const nextRound = ls.currentRound + 1;
    const { entries, matches } = playRound(
      ls.entries,
      ls.matches,
      nextRound,
      league.entryFee,
      league
    );
    const done = nextRound >= league.rounds;
    set({
      leagues: {
        ...get().leagues,
        [leagueId]: {
          ...ls,
          entries,
          matches,
          currentRound: nextRound,
          status: done ? "finished" : "live",
        },
      },
    });
    return true;
  },

  playAllRounds: (leagueId, league) => {
    let cont = true;
    while (cont) cont = get().playNextRound(leagueId, league);
  },

  claimLeague: (leagueId, league) => {
    const ls = get().leagues[leagueId];
    if (!ls || ls.status !== "finished" || ls.claimed) return 0;
    const ranked = standings(ls.entries);
    const userIdx = ranked.findIndex((e) => e.id === ls.userEntryId);
    const rank = userIdx + 1;
    const user = ranked[userIdx];
    const prize = championshipPrize(rank, league.entryFee, league.capacity);
    const roundsPnL = user ? user.balanceDelta : 0;
    const totalReturn = Number((prize + roundsPnL).toFixed(2));
    set({
      collection: get().collection.map((c) =>
        ls.entries.find((e) => e.isUser)?.lineupCardIds.includes(c.id) &&
        c.status === "locked_in_league"
          ? { ...c, status: "in_album" }
          : c
      ),
      balance: Number((get().balance + totalReturn).toFixed(2)),
      totalPnL: Number((get().totalPnL + totalReturn - league.entryFee).toFixed(2)),
      leagues: { ...get().leagues, [leagueId]: { ...ls, claimed: true } },
    });
    return totalReturn;
  },

  leaveLeague: (leagueId) => {
    const ls = get().leagues[leagueId];
    if (!ls) return;
    const userLineup = ls.entries.find((e) => e.isUser)?.lineupCardIds ?? [];
    set({
      collection: get().collection.map((c) =>
        userLineup.includes(c.id) && c.status === "locked_in_league"
          ? { ...c, status: "in_album" }
          : c
      ),
      leagues: Object.fromEntries(
        Object.entries(get().leagues).filter(([k]) => k !== leagueId)
      ),
    });
  },
}));

// ─── Cloud sync (Firestore) ────────────────────────────────────────────────

let currentUid: string | null = null;
let unsubSave: (() => void) | null = null;
let unsubDoc: (() => void) | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
// JSON of the slice we last wrote or received from the server. Used to skip
// redundant writes AND to break the save→snapshot→save echo loop.
let lastSyncedJson: string | null = null;

function persistedSlice(s: State & Actions): PersistedState {
  return {
    balance: s.balance,
    collection: s.collection,
    parlays: s.parlays,
    marketStatus: s.marketStatus,
    totalPnL: s.totalPnL,
    leagues: s.leagues,
  };
}

const sliceJson = (slice: PersistedState) => JSON.stringify(slice);

// Load the signed-in user's state from Firestore, then keep it in sync both ways:
// auto-save local changes, and apply server-side changes (e.g. one of your listed
// cards getting bought by someone else credits your balance live).
export async function loadUserState(uid: string): Promise<void> {
  currentUid = uid;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const base = freshPersisted();

  const loaded: PersistedState = snap.exists()
    ? (() => {
        const data = snap.data() as Partial<PersistedState>;
        return {
          balance: typeof data.balance === "number" ? data.balance : base.balance,
          collection: data.collection ?? base.collection,
          // Seed parlays / market status if the doc predates them or is empty.
          parlays: data.parlays && data.parlays.length ? data.parlays : base.parlays,
          marketStatus:
            data.marketStatus && Object.keys(data.marketStatus).length
              ? data.marketStatus
              : base.marketStatus,
          totalPnL: typeof data.totalPnL === "number" ? data.totalPnL : base.totalPnL,
          leagues: data.leagues ?? base.leagues,
        };
      })()
    : base;

  // Mark as synced before setState so the (about-to-attach) saver treats it as clean.
  lastSyncedJson = sliceJson(loaded);
  useStore.setState({ ...loaded, hydrated: true });

  startAutoSave(uid);
  startDocListener(uid);
}

function startAutoSave(uid: string) {
  if (unsubSave) unsubSave();
  unsubSave = useStore.subscribe((state) => {
    if (currentUid !== uid || !state.hydrated) return;
    const json = sliceJson(persistedSlice(state));
    if (json === lastSyncedJson) return; // nothing actually changed
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      lastSyncedJson = json;
      void setDoc(
        doc(db, "users", uid),
        { ...persistedSlice(useStore.getState()), address: uid, updatedAt: Date.now() },
        { merge: true }
      ).catch(() => {});
    }, 600);
  });
}

// Apply server-originated changes to balance/collection/totalPnL (the fields the
// buy route mutates out-of-band). Skips our own optimistic write echoes.
function startDocListener(uid: string) {
  if (unsubDoc) unsubDoc();
  unsubDoc = onSnapshot(doc(db, "users", uid), (snap) => {
    if (currentUid !== uid || !snap.exists() || snap.metadata.hasPendingWrites) return;
    const data = snap.data() as Partial<PersistedState>;
    const cur = persistedSlice(useStore.getState());
    const next: PersistedState = {
      ...cur,
      balance: typeof data.balance === "number" ? data.balance : cur.balance,
      collection: data.collection ?? cur.collection,
      totalPnL: typeof data.totalPnL === "number" ? data.totalPnL : cur.totalPnL,
    };
    const nextJson = sliceJson(next);
    if (nextJson === sliceJson(cur)) return; // no remote delta
    lastSyncedJson = nextJson; // set before setState to avoid re-saving the echo
    useStore.setState({ balance: next.balance, collection: next.collection, totalPnL: next.totalPnL });
  });
}

function stopSync() {
  if (unsubSave) unsubSave();
  if (unsubDoc) unsubDoc();
  unsubSave = null;
  unsubDoc = null;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  lastSyncedJson = null;
}

// Called on disconnect / sign-out.
export function resetUserState(): void {
  stopSync();
  currentUid = null;
  useStore.setState({ ...freshPersisted(), hydrated: false });
}

// ─── Read-only selector helpers ─────────────────────────────────────────────
export function parlayReadiness(parlay: ParlaySet, collection: Card[]) {
  const owned = new Set(
    collection
      .filter((c) => c.status === "in_album" || c.status === "locked_in_parlay")
      .map((c) => c.marketId)
  );
  const have = parlay.requiredMarketIds.filter((mid) => owned.has(mid)).length;
  const missing = parlay.requiredMarketIds.filter((mid) => !owned.has(mid));
  return { have, total: parlay.requiredMarketIds.length, missing };
}
