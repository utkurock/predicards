"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase/client";
import { useStore } from "./store";
import { useCommission } from "./commissionStore";
import type { Card, MarketListing } from "./types";

type MarketState = {
  listings: MarketListing[];
  loaded: boolean;
  error: string | null;
};

export const useMarket = create<MarketState>(() => ({
  listings: [],
  loaded: false,
  error: null,
}));

// A single shared Firestore subscription, ref-counted across mounted pages.
let unsub: (() => void) | null = null;
let subscribers = 0;

function ensureSubscription() {
  if (unsub) return;
  unsub = onSnapshot(
    collection(db, "listings"),
    (snap) => {
      const listings: MarketListing[] = snap.docs.map((d) => {
        const data = d.data() as Omit<MarketListing, "id">;
        return { ...data, id: d.id };
      });
      useMarket.setState({ listings, loaded: true, error: null });
    },
    (err) => useMarket.setState({ loaded: true, error: err.message })
  );
}

// Subscribe to the live marketplace while a component is mounted.
export function useMarketListings(): MarketState {
  useEffect(() => {
    subscribers += 1;
    ensureSubscription();
    return () => {
      subscribers -= 1;
      if (subscribers === 0 && unsub) {
        unsub();
        unsub = null;
        useMarket.setState({ loaded: false });
      }
    };
  }, []);
  return useMarket();
}

function listingDocId(uid: string, cardId: string) {
  return `${uid}_${cardId}`;
}

// List one of your own cards on the shared marketplace.
export async function listCardForSale(card: Card, price: number): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Connect your wallet first.");
  // Auto-claim the card's accrued commission before it stops earning on the market —
  // so a holder never forfeits prediction/secondary-sale earnings by listing.
  const claimed = useStore.getState().claimCardCommission(card.id);
  const fresh = useStore.getState().collection.find((c) => c.id === card.id) ?? card;
  const id = listingDocId(uid, card.id);
  const listing: Omit<MarketListing, "id"> = {
    card: { ...fresh, ownerId: uid, status: "listed", currentMarketPrice: price },
    sellerId: uid,
    price,
    change24h: 0,
    listedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "listings", id), listing);
  useStore.getState().listCard(card.id, price);
  return claimed;
}

// Pull your card back off the market.
export async function unlistCardFromSale(cardId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Connect your wallet first.");
  await deleteDoc(doc(db, "listings", listingDocId(uid, cardId)));
  useStore.getState().unlistCard(cardId);
}

export type BuyResult = { ok: boolean; error?: string };

// Buy a listing. The actual transfer + balance moves run server-side atomically.
export async function buyListing(listingId: string): Promise<BuyResult> {
  const user = auth.currentUser;
  if (!user) return { ok: false, error: "Connect your wallet first." };
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/market/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Purchase failed" };
    // Server handled the listing + seller atomically; debit our own balance locally.
    const balance = useStore.getState().balance;
    const newBalance = Number((balance - (data.price as number)).toFixed(2));
    // Stamp fresh commission checkpoints so the buyer earns only from purchase onward
    // (no back-claim of the seller's accrual).
    const bought = data.card as Card;
    const market = useStore.getState().markets.find((m) => m.id === bought.marketId);
    const stat = useCommission.getState().stats[bought.marketId];
    const stamped: Card = {
      ...bought,
      commissionBase: stat?.accPerCard ?? 0,
      volumeBase: market?.volume ?? bought.volumeBase,
    };
    useStore.getState().applyPurchase(stamped, newBalance);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
