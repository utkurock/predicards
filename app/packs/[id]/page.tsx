"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Layers, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { packs } from "@/lib/mockData/packs";
import { rarityValue, rarityLabel, rarityOrder, editionTotal } from "@/lib/pricing";
import { PackArt } from "@/components/PackArt";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { useStore } from "@/lib/store";
import type { Market, Rarity } from "@/lib/types";

const rarityBar: Record<Rarity, string> = {
  common: "bg-rarity-common",
  rare: "bg-rarity-rare",
  epic: "bg-rarity-epic",
  legendary: "bg-rarity-legendary",
  mythic: "bg-rarity-mythic",
};
const rarityDot: Record<Rarity, string> = rarityBar;

export default function PackDetailPage() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const markets = useStore((s) => s.markets);
  const pack = packs.find((p) => p.id === id);

  if (!pack) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm text-text-secondary">That pack doesn&rsquo;t exist.</p>
        <Link href="/packs" className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent">
          <ArrowLeft className="h-4 w-4" /> Back to pack store
        </Link>
      </div>
    );
  }

  const rarities = rarityOrder.filter((r) => pack.dropRates[r] > 0);
  // Average value of a single card pulled from this pack (drop-weighted).
  const avgCard = rarityOrder.reduce((s, r) => s + pack.dropRates[r] * rarityValue[r], 0);
  // Highest-tier card this pack can produce, and its value.
  const topRarity = [...rarityOrder].reverse().find((r) => pack.dropRates[r] > 0) ?? "common";
  const tailOdds = (pack.dropRates.legendary + pack.dropRates.mythic) * 100;

  // A few example markets you could pull, grouped by rarity (from the live catalog).
  const samples = (r: Rarity): Market[] => markets.filter((m) => m.rarity === r).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <Link
        href="/packs"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Pack store
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ─── Main column ─── */}
        <div className="space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <div className="w-full max-w-[200px] shrink-0">
              <PackArt tier={pack.tier} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="section-sub">FIFA 26 · Pack</div>
              <h1 className="mt-1 text-3xl font-bold capitalize tracking-tight">{pack.tier} pack</h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                {pack.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Chip icon={<Layers className="h-3.5 w-3.5" />} text={`${pack.cardCount} cards`} />
                <Chip icon={<ShieldCheck className="h-3.5 w-3.5" />} text={pack.guaranteed} />
                <Chip
                  icon={<Trophy className="h-3.5 w-3.5" />}
                  text={`Up to ${rarityLabel[topRarity]}`}
                />
              </div>
            </div>
          </motion.div>

          {/* Inside the pack — odds + value breakdown */}
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Inside the pack</h2>
              <span className="section-sub">Drop rates &amp; card value</span>
            </div>

            {/* Stacked rarity bar */}
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-bg-hover">
              {rarityOrder.map((r) =>
                pack.dropRates[r] > 0 ? (
                  <div
                    key={r}
                    className={rarityBar[r]}
                    style={{ width: `${pack.dropRates[r] * 100}%` }}
                    title={`${rarityLabel[r]} ${(pack.dropRates[r] * 100).toFixed(1)}%`}
                  />
                ) : null
              )}
            </div>

            {/* Rows */}
            <div className="mt-5 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-line-subtle pb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                <span>Rarity</span>
                <span className="w-16 text-right">Odds</span>
                <span className="w-20 text-right">Value</span>
                <span className="w-20 text-right">Edition</span>
              </div>
              <div className="divide-y divide-line-subtle">
                {rarities.map((r) => (
                  <div key={r} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5">
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <span className={`h-2 w-2 rounded-full ${rarityDot[r]}`} />
                      {rarityLabel[r]}
                    </span>
                    <span className="w-16 text-right tabular font-mono text-[13px]">
                      {pack.dropRates[r] * 100 < 1
                        ? (pack.dropRates[r] * 100).toFixed(1)
                        : (pack.dropRates[r] * 100).toFixed(0)}
                      %
                    </span>
                    <span className="w-20 text-right tabular font-mono text-[13px] text-accent">
                      {rarityValue[r].toFixed(2)}
                    </span>
                    <span className="w-20 text-right tabular font-mono text-[12px] text-text-muted">
                      /{editionTotal[r].toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Possible pulls */}
          <div className="panel p-5">
            <h2 className="text-sm font-semibold">Possible pulls</h2>
            <p className="section-sub mt-1">Live markets you could land, by rarity</p>
            <div className="mt-4 space-y-4">
              {rarities.map((r) => {
                const list = samples(r);
                if (list.length === 0) return null;
                return (
                  <div key={r}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${rarityDot[r]}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                        {rarityLabel[r]}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {list.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-bg-card px-3 py-2"
                        >
                          <span className="truncate text-[13px]">{m.statement}</span>
                          <span className="tabular shrink-0 font-mono text-[11px] text-text-muted">
                            {(m.impliedProbability * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="section-sub">Price</div>
                <div className="mt-1 bignum text-4xl">
                  {pack.price}
                  <span className="ml-1.5 text-base font-medium text-text-secondary">USDT</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat label="Cards" value={`${pack.cardCount}`} />
              <Stat label="Guaranteed" value={pack.guaranteed} />
              <Stat label="Avg card value" value={`${avgCard.toFixed(2)}`} suffix="USDT" accent />
              <Stat label="Rare+ odds" value={`${tailOdds.toFixed(1)}%`} />
            </div>

            <Link href={`/packs/open/${pack.id}`} className="mt-5 block">
              <Button size="lg" className="w-full">
                Open pack <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-3 text-center text-[11px] text-text-muted">
              {pack.cardCount} reveals · charged when you tear the pack
            </p>
          </div>

          <div className="panel p-4">
            <div className="flex items-center gap-2 text-[11px] text-text-secondary">
              <Trophy className="h-3.5 w-3.5 text-accent" />
              Top reward
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${rarityDot[topRarity]}`} />
                {rarityLabel[topRarity]}
              </span>
              <span className="tabular font-mono text-sm text-accent">
                {rarityValue[topRarity].toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-bg-card px-2.5 py-1 text-[11px] text-text-secondary shadow-soft">
      <span className="text-accent">{icon}</span>
      {text}
    </span>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line-subtle bg-bg-card px-3 py-2.5 shadow-soft">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className={`mt-1 tabular font-mono text-[15px] font-semibold ${accent ? "text-accent" : "text-text-primary"}`}>
        {value}
        {suffix && <span className="ml-1 text-[10px] font-normal text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
