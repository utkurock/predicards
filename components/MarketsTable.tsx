"use client";

import { useMemo, useState } from "react";
import { useCommission } from "@/lib/commissionStore";
import { RarityBadge } from "@/components/RarityBadge";
import { estDailyYieldPerCard } from "@/lib/commission";
import type { Category, Market } from "@/lib/types";
import { TrendingUp, TrendingDown, ExternalLink, Search } from "lucide-react";

const CATS: (Category | "all")[] = ["all", "tournament", "team", "player", "match", "wild"];

function fmtVol(v: number | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// The markets table for one collection. `mintable` toggles the card/commission columns
// and the World-Cup-specific category sub-filter (those only make sense where cards mint).
export function MarketsTable({
  markets,
  mintable,
}: {
  markets: Market[];
  mintable: boolean;
}) {
  const stats = useCommission((s) => s.stats);
  const [cat, setCat] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let arr = [...markets];
    if (mintable && cat !== "all") arr = arr.filter((m) => m.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((m) => m.statement.toLowerCase().includes(q));
    }
    return arr.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  }, [markets, cat, query, mintable]);

  const gridCols = mintable
    ? "md:grid-cols-[1fr_90px_90px_110px_90px_120px]"
    : "md:grid-cols-[1fr_90px_90px_120px]";

  return (
    <>
      {/* Filters */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {mintable &&
          CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className="pill" data-active={cat === c}>
              {c === "all" ? "All" : c[0].toUpperCase() + c.slice(1)}
            </button>
          ))}
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets…"
            className="w-56 rounded-full border border-line-subtle bg-bg-card py-2 pl-9 pr-3 text-[13px] outline-none placeholder:text-text-muted focus:border-line"
          />
        </div>
      </div>

      {/* Table header */}
      <div
        className={`mt-4 hidden grid-cols-[1fr_90px_90px_110px_90px_120px] gap-3 border-b border-line-subtle px-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-text-muted md:grid ${gridCols}`}
      >
        <span>Market</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="text-right">PM Volume</span>
        {mintable && <span className="text-right">Cards</span>}
        {mintable && <span className="text-right">Yield/day</span>}
      </div>

      <div className="divide-y divide-line-subtle">
        {rows.map((m) => {
          const stat = stats[m.id] ?? { supply: 0, accPerCard: 0 };
          const price = (m.impliedProbability * 100).toFixed(1);
          const up = (m.change24h ?? 0) >= 0;
          return (
            <div
              key={m.id}
              className={`grid grid-cols-2 items-center gap-3 px-4 py-3 ${gridCols}`}
            >
              <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <RarityBadge rarity={m.rarity} size="xs" />
                    <span className="truncate text-[13px] font-medium">{m.statement}</span>
                  </div>
                  {m.sourceUrl && (
                    <a
                      href={m.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-text-secondary"
                    >
                      Polymarket <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <span className="tabular text-right font-mono text-[13px] text-text-primary">
                {price}%
              </span>
              <span
                className={`tabular flex items-center justify-end gap-0.5 font-mono text-[12px] ${
                  up ? "text-accent" : "text-live"
                }`}
              >
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(m.change24h ?? 0).toFixed(1)}
              </span>
              <span className="tabular text-right font-mono text-[12px] text-text-secondary">
                {fmtVol(m.volume)}
              </span>
              {mintable && (
                <span className="tabular text-right font-mono text-[12px] text-text-secondary">
                  {stat.supply || 0}
                </span>
              )}
              {mintable && (
                <span className="tabular text-right font-mono text-[12px] text-accent">
                  {(() => {
                    const y = estDailyYieldPerCard(m, stat);
                    return y >= 0.01 ? `${y.toFixed(2)}` : "<0.01";
                  })()}
                </span>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="px-4 py-16 text-center text-sm text-text-muted">
            No markets match your filters.
          </div>
        )}
      </div>
    </>
  );
}
