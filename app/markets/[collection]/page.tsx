"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useCommission } from "@/lib/commissionStore";
import { CommissionBanner } from "@/components/CommissionBanner";
import { MarketsTable } from "@/components/MarketsTable";
import { getCollection } from "@/lib/collections";
import type { Market } from "@/lib/types";
import { ChevronLeft } from "lucide-react";

function fmtVol(v: number | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function CollectionPage() {
  const params = useParams<{ collection: string }>();
  const collection = getCollection(params?.collection);

  const stats = useCommission((s) => s.stats);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collection) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/markets?collection=${collection.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { markets?: Market[] }) => {
        if (!cancelled && Array.isArray(d.markets)) setMarkets(d.markets);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [collection]);

  // Network commission for this collection (cards + realized fees), from the global ledger.
  const totals = useMemo(() => {
    const ids = new Set(markets.map((m) => m.id));
    let distributed = 0;
    let cards = 0;
    let volume = 0;
    for (const m of markets) volume += m.volume ?? 0;
    for (const [id, s] of Object.entries(stats)) {
      if (!ids.has(id)) continue;
      distributed += (s.accPerCard ?? 0) * (s.supply ?? 0);
      cards += s.supply ?? 0;
    }
    return { distributed, cards, volume };
  }, [markets, stats]);

  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <Link
        href="/markets"
        className="inline-flex items-center gap-1 text-[12px] text-text-muted hover:text-text-secondary"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All collections
      </Link>

      {/* Collection header */}
      <div
        className="mt-3 flex items-center gap-4 rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, rgb(${collection.accent} / 0.22), rgb(${collection.accent} / 0.04))`,
        }}
      >
        <span className="text-5xl drop-shadow-sm">{collection.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">{collection.label}</h1>
            {!collection.mintable && (
              <span className="rounded-full border border-line-subtle bg-bg-card/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                Browse only
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-text-secondary">
            {collection.blurb}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <NetStat label="Live markets" value={`${markets.length}`} />
        <NetStat label="PM volume" value={fmtVol(totals.volume)} />
        {collection.mintable ? (
          <NetStat
            label="Commission paid"
            value={`${totals.distributed.toFixed(2)}`}
            suffix="USDT"
            accent
          />
        ) : (
          <NetStat label="Cards" value="Soon" />
        )}
      </div>

      {collection.mintable && (
        <div className="mt-4">
          <CommissionBanner />
        </div>
      )}

      {loading && markets.length === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-text-muted">Loading markets…</div>
      ) : (
        <div className="mt-6">
          <MarketsTable markets={markets} mintable={collection.mintable} />
        </div>
      )}
    </div>
  );
}

function NetStat({
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
    <div className="panel px-4 py-3 shadow-soft">
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div
        className={`tabular mt-1 font-mono text-lg font-semibold ${
          accent ? "text-accent" : "text-text-primary"
        }`}
      >
        {value}
        {suffix && <span className="ml-1 text-[11px] font-normal text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
