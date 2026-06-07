"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useMarketListings, buyListing } from "@/lib/market";
import { useWallet } from "@/components/WalletProvider";
import { CardComponent } from "@/components/Card";
import { Button } from "@/components/Button";
import { RarityBadge } from "@/components/RarityBadge";
import { HydrationGate } from "@/components/HydrationGate";
import { useToast } from "@/components/Toaster";
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { fairValueEstimate, rarityLabel } from "@/lib/pricing";

export default function ListingDetail() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { listings } = useMarketListings();
  const balance = useStore((s) => s.balance);
  const { address } = useWallet();
  const toast = useToast((s) => s.push);
  const [buying, setBuying] = useState(false);

  const listing = useMemo(() => listings.find((l) => l.id === params.id), [listings, params.id]);

  if (!listing) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-center text-text-secondary">Listing not found or already sold.</div>;
  }

  const card = listing.card;
  const fv = fairValueEstimate(card);
  const edge = (1 - listing.price / fv) * 100;

  const buy = async () => {
    if (balance < listing.price) {
      toast(`Need ${listing.price} USDT. Your balance is ${balance.toFixed(2)}.`, "error");
      return;
    }
    setBuying(true);
    const res = await buyListing(listing.id);
    setBuying(false);
    if (res.ok) {
      toast("Card added to your album.", "success");
      router.push("/album");
    } else {
      toast(res.error ?? "Purchase failed.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/market" className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to market
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[420px_1fr]">
        <CardComponent card={card} />

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <RarityBadge rarity={card.rarity} />
              <span className="font-mono text-[10px] uppercase text-text-muted">{card.category}</span>
            </div>
            <h1 className="section-title">{card.statement}</h1>
            <div className="mt-4 flex items-center gap-3 font-mono text-[11px] text-text-secondary">
              <span>Seller <span className="text-text-primary">{listing.sellerId}</span></span>
              <span className="text-text-muted">/</span>
              <span>Listed {new Date(listing.listedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Big label="Listing price" value={`${listing.price}`} suffix="USDT" />
            <Big
              label="24h change"
              value={`${(listing.change24h * 100).toFixed(1)}%`}
              accent={listing.change24h >= 0 ? "up" : "down"}
            />
            <Big label="Fair value est." value={fv.toFixed(3)} suffix="USDT" />
            <Big label="Potential payout" value={`${card.potentialPayout}`} suffix="USDT" accent="accent" />
          </div>

          <div className="panel p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Fair-value read</div>
            <p className="mt-2 text-sm text-text-secondary">
              Listed {edge > 0 ? `${edge.toFixed(0)}% below` : `${Math.abs(edge).toFixed(0)}% above`} our fair-value estimate.
              {edge > 10 ? " Looks like a buy." : edge < -10 ? " Probably overpaying here." : " Roughly fair."}
            </p>
          </div>

          {listing.sellerId === address ? (
            <Link href={`/card/${card.id}`}>
              <Button size="lg" variant="outline" className="w-full">
                Your listing · manage in album
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="w-full" onClick={buy} disabled={buying}>
              <ShoppingCart className="h-4 w-4" /> {buying ? "Buying…" : `Buy for ${listing.price} USDT`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent?: "up" | "down" | "accent" }) {
  const color =
    accent === "up" ? "text-accent"
    : accent === "down" ? "text-live"
    : accent === "accent" ? "text-accent"
    : "text-text-primary";
  return (
    <div className="panel px-4 py-3">
      <div className="font-mono text-[10px] uppercase text-text-muted">{label}</div>
      <div className={`bignum mt-1 text-2xl ${color}`}>
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
