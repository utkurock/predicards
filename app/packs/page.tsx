"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PackArt } from "@/components/PackArt";
import { packs } from "@/lib/mockData/packs";
import { HydrationGate } from "@/components/HydrationGate";
import { rarityLabel } from "@/lib/pricing";
import type { Rarity } from "@/lib/types";
import { motion } from "framer-motion";

export default function PacksPage() {
  return (
    <HydrationGate>
      <PacksInner />
    </HydrationGate>
  );
}

function PacksInner() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="section-title">Pack store</h1>
          <p className="section-sub mt-1.5">3 tiers / Published drop rates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {packs.map((pack, idx) => (
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Link
              href={`/packs/${pack.id}`}
              className="group flex h-full flex-col gap-4 panel p-4 transition-all hover:-translate-y-0.5 hover:shadow-glass"
            >
              <PackArt tier={pack.tier} />
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-bold capitalize">{pack.tier}</h2>
                    <div className="tabular font-mono">
                      <span className="text-xl font-bold">{pack.price}</span>
                      <span className="ml-1 text-xs text-text-muted">USDT</span>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-[1.25rem] text-text-secondary">
                    {pack.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <Spec label="Cards" value={`${pack.cardCount}`} />
                  <Spec label="Floor" value={pack.guaranteed} />
                </div>

                <div className="space-y-1 rounded-lg border border-line-subtle bg-bg-base p-2.5">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">Drop rates</div>
                  {(["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).map((r) => {
                    const pct = pack.dropRates[r] * 100;
                    return (
                      <div key={r} className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary">{rarityLabel[r]}</span>
                        <span className="tabular font-mono text-text-primary">
                          {pct < 1 ? pct.toFixed(1) : pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-accent-ink shadow-soft transition-all group-hover:gap-2.5">
                  View pack
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line-subtle bg-bg-base px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="font-mono text-xs">{value}</div>
    </div>
  );
}
