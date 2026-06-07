"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useMarketListings, buyListing } from "@/lib/market";
import { useWallet } from "@/components/WalletProvider";
import { CardComponent } from "@/components/Card";
import { HydrationGate } from "@/components/HydrationGate";
import { rarityWeight, rarityLabel } from "@/lib/pricing";
import { Button } from "@/components/Button";
import type { Category, Rarity } from "@/lib/types";
import { useToast } from "@/components/Toaster";
import { Filter, Search, X, TrendingUp, TrendingDown } from "lucide-react";

const rarities: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];
const categories: Category[] = ["tournament", "team", "player", "match", "wild"];

type Sort = "price-asc" | "price-desc" | "recent" | "rarity";

export default function MarketPage() {
  return (
    <HydrationGate>
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </HydrationGate>
  );
}

function Inner() {
  const { listings, loaded } = useMarketListings();
  const balance = useStore((s) => s.balance);
  const { address } = useWallet();
  const toast = useToast((s) => s.push);
  const searchParams = useSearchParams();
  const missingMarketId = searchParams.get("missingMarketId");

  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");
  const [showEndingSoon, setShowEndingSoon] = useState(false);

  const filtered = useMemo(() => {
    let arr = [...listings];
    if (missingMarketId) {
      arr = arr.filter((l) => l.card.marketId === missingMarketId);
    }
    if (rarityFilter !== "all") arr = arr.filter((l) => l.card.rarity === rarityFilter);
    if (categoryFilter !== "all") arr = arr.filter((l) => l.card.category === categoryFilter);
    if (query) arr = arr.filter((l) => l.card.statement.toLowerCase().includes(query.toLowerCase()));
    if (showEndingSoon) {
      const cutoff = new Date("2026-06-30").getTime();
      arr = arr.filter((l) => new Date(l.card.resolutionDate).getTime() < cutoff);
    }
    switch (sort) {
      case "price-asc": arr.sort((a, b) => a.price - b.price); break;
      case "price-desc": arr.sort((a, b) => b.price - a.price); break;
      case "rarity": arr.sort((a, b) => rarityWeight[b.card.rarity] - rarityWeight[a.card.rarity]); break;
      case "recent": arr.sort((a, b) => +new Date(b.listedAt) - +new Date(a.listedAt)); break;
    }
    return arr;
  }, [listings, rarityFilter, categoryFilter, sort, query, showEndingSoon, missingMarketId]);

  const buy = async (listingId: string, price: number, statement: string) => {
    if (balance < price) {
      toast(`Need ${price} USDT. Your balance is ${balance.toFixed(2)}.`, "error");
      return;
    }
    const res = await buyListing(listingId);
    if (res.ok) toast(`Bought "${statement.slice(0, 40)}…"`, "success");
    else toast(res.error ?? "Purchase failed.", "error");
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="section-title">Marketplace</h1>
          <p className="section-sub mt-1.5">
            <span className="tabular text-text-primary">{filtered.length.toLocaleString()}</span> of {listings.length.toLocaleString()} listings
            {missingMarketId && (
              <span className="ml-2 inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                Filtered to parlay-missing card
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search predictions…"
              className="h-9 w-56 rounded-lg border border-line-subtle bg-bg-card pl-8 pr-3 text-sm outline-none placeholder:text-text-muted focus:border-line-bright"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-lg border border-line-subtle bg-bg-card px-3 text-sm outline-none focus:border-line-bright"
          >
            <option value="recent">Recently listed</option>
            <option value="price-asc">Price · low to high</option>
            <option value="price-desc">Price · high to low</option>
            <option value="rarity">Rarity</option>
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line-subtle pb-4">
        <Pill
          active={rarityFilter === "all"}
          onClick={() => setRarityFilter("all")}
        >
          All rarities
        </Pill>
        {rarities.map((r) => (
          <Pill key={r} active={rarityFilter === r} onClick={() => setRarityFilter(r)}>
            {rarityLabel[r]}
          </Pill>
        ))}
        <div className="mx-2 h-4 w-px bg-line" />
        <Pill active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
          All categories
        </Pill>
        {categories.map((c) => (
          <Pill key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
            {c}
          </Pill>
        ))}
        <div className="mx-2 h-4 w-px bg-line" />
        <Pill active={showEndingSoon} onClick={() => setShowEndingSoon(!showEndingSoon)}>
          Ending soon
        </Pill>
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((l) => (
          <div key={l.id} className="space-y-2">
            <CardComponent
              card={l.card}
              href={`/market/${l.id}`}
              compact
              showPrice
              priceLabel="Listed"
              priceValue={l.price}
            />
            <div className="flex items-center justify-between rounded-lg border border-line-subtle bg-bg-card px-2 py-1.5">
              <div className="flex flex-col leading-tight">
                <span className="tabular font-mono text-xs font-semibold">{l.price} USDT</span>
                <span className={`flex items-center gap-0.5 text-[10px] ${l.change24h >= 0 ? "text-accent" : "text-live"}`}>
                  {l.change24h >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {(l.change24h * 100).toFixed(1)}%
                </span>
              </div>
              {l.sellerId === address ? (
                <span className="rounded-md border border-line-subtle px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted">
                  Yours
                </span>
              ) : (
                <Button size="sm" onClick={() => buy(l.id, l.price, l.card.statement)}>
                  Buy
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="panel p-16 text-center text-sm text-text-secondary">
          {!loaded
            ? "Loading marketplace…"
            : listings.length === 0
            ? "Marketplace is empty. Seed it from the Dev page to populate listings."
            : "No listings match. Try widening filters."}
        </div>
      )}
    </div>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs capitalize transition-all ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-line-subtle bg-bg-card text-text-secondary hover:border-line hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
