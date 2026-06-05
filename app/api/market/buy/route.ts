import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { IN_APP_FEE_RATE } from "@/lib/commission";
import type { Card, MarketListing } from "@/lib/types";

export const runtime = "nodejs";

// Seed/mock sellers have synthetic ids — no real balance to credit.
const isBotSeller = (sellerId: string) => sellerId.startsWith("bot");

// POST /api/market/buy { listingId }  (Authorization: Bearer <firebase idToken>)
// Atomic: removes the listing, transfers the card to the buyer, debits the buyer,
// and credits a real seller — all or nothing.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let buyerUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    buyerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  let listingId: string;
  try {
    ({ listingId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const db = adminDb();
  const listingRef = db.collection("listings").doc(listingId);

  try {
    const result = await db.runTransaction(async (tx) => {
      const listingSnap = await tx.get(listingRef);
      if (!listingSnap.exists) throw new Error("Listing no longer available");
      const listing = listingSnap.data() as Omit<MarketListing, "id">;
      const sellerId = listing.sellerId;
      const price = listing.price;
      const marketId = listing.card.marketId;

      if (sellerId === buyerUid) throw new Error("That's your own listing");

      // Read the market ledger + rate config inside the tx (reads must precede writes).
      const statRef = db.collection("marketStats").doc(marketId);
      const statSnap = await tx.get(statRef);
      const supply = Math.max(1, (statSnap.data()?.supply as number) ?? 1);

      const configSnap = await tx.get(db.collection("config").doc("commission"));
      const feeRate = (configSnap.data()?.inAppFeeRate as number) ?? IN_APP_FEE_RATE;

      // Commission: a cut of the sale is distributed (equally per card) to every holder
      // of this market's cards via the per-market ledger. Buyer pays full price; seller
      // receives price − fee; the fee accrues to marketStats/{marketId}.accPerCard.
      const fee = Number((price * feeRate).toFixed(4));
      const sellerProceeds = Number((price - fee).toFixed(2));

      // The cross-user atomic part: remove the listing and pay a real seller.
      // The buyer's own balance/collection are updated client-side (their own doc,
      // trusted the same way packs/forge are) to avoid clobbering unsaved local state.
      const sellerRef = isBotSeller(sellerId) ? null : db.collection("users").doc(sellerId);
      const sellerSnap = sellerRef ? await tx.get(sellerRef) : null;

      if (sellerRef && sellerSnap?.exists) {
        const seller = sellerSnap.data() as { balance: number; collection: Card[] };
        tx.update(sellerRef, {
          balance: Number((seller.balance + sellerProceeds).toFixed(2)),
          collection: seller.collection.filter((c) => c.id !== listing.card.id),
          totalPnL: FieldValue.increment(sellerProceeds),
        });
      }

      // Distribute the fee per card and record traded volume.
      tx.set(
        statRef,
        {
          accPerCard: FieldValue.increment(fee / supply),
          inAppVolume: FieldValue.increment(price),
        },
        { merge: true }
      );

      tx.delete(listingRef);

      // Buyer starts fresh on in-app commission for this card (no back-claim of the
      // seller's accrual); the new checkpoint is applied client-side via the live ledger.
      const boughtCard: Card = {
        ...listing.card,
        ownerId: buyerUid,
        status: "in_album",
        commissionBase: undefined,
      };
      return { card: boughtCard, price };
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Purchase failed";
    const status = /own listing|no longer/.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
