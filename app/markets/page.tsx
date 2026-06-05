"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useCommission } from "@/lib/commissionStore";
import { RarityBadge } from "@/components/RarityBadge";
import { CommissionBanner } from "@/components/CommissionBanner";
import { estDailyYieldPerCard, IN_APP_FEE_RATE } from "@/lib/commission";
import type { Category } from "@/lib/types";
import { TrendingUp, TrendingDown, ExternalLink, Search } from "lucide-react";

const CATS: (Category | "all")[] = ["all", "tournament", "team", "player", "match", "wild"];

function fmtVol(v: number | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function MarketsPage() {
  const markets = useStore((s) => s.markets);
  const stats = useCommission((s) => s.stats);

  const [cat, setCat] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let arr = [...markets];
    if (cat !== "all") arr = arr.filter((m) => m.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((m) => m.statement.toLowerCase().includes(q));
    }
    return arr.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  }, [markets, cat, query]);

  // Network-wide commission stats (realized in-app fees = accPerCard × supply per market).
  const totals = useMemo(() => {
    let distributed = 0;
    let cards = 0;
    for (const s of Object.values(stats)) {
      distributed += (s.accPerCard ?? 0) * (s.supply ?? 0);
      cards += s.supply ?? 0;
    }
    return { distributed, cards };
  }, [stats]);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="section-sub">Powered by Polymarket</p>
        <h1 className="section-title">Markets</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Every market here is a live Polymarket prediction market. Own its card and you earn from
          both sides: passive yield as the prediction market trades on Polymarket, plus a{" "}
          {Math.round(IN_APP_FEE_RATE * 100)}% commission on every secondary sale of its cards —
          split equally across all holders.
        </p>
      </div>

      {/* Network commission stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <NetStat label="Live markets" value={`${markets.length}`} />
        <NetStat label="Cards minted" value={`${totals.cards}`} />
        <NetStat
          label="Commission paid"
          value={`${totals.distributed.toFixed(2)}`}
          suffix="USDT"
          accent
        />
      </div>

      {/* Earnings banner */}
      <div className="mt-4">
        <CommissionBanner />
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="pill"
            data-active={cat === c}
          >
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
      <div className="mt-4 hidden grid-cols-[1fr_90px_90px_110px_90px_120px] gap-3 border-b border-line-subtle px-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-text-muted md:grid">
        <span>Market</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="text-right">PM Volume</span>
        <span className="text-right">Cards</span>
        <span className="text-right">Yield/day</span>
      </div>

      <div className="divide-y divide-line-subtle">
        {rows.map((m) => {
          const stat = stats[m.id] ?? { supply: 0, accPerCard: 0 };
          const price = (m.impliedProbability * 100).toFixed(1);
          const up = (m.change24h ?? 0) >= 0;
          return (
            <div
              key={m.id}
              className="grid grid-cols-2 items-center gap-3 px-4 py-3 md:grid-cols-[1fr_90px_90px_110px_90px_120px]"
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
              <span className="tabular text-right font-mono text-[12px] text-text-secondary">
                {stat.supply || 0}
              </span>
              <span className="tabular text-right font-mono text-[12px] text-accent">
                {(() => {
                  const y = estDailyYieldPerCard(m, stat);
                  return y >= 0.01 ? `${y.toFixed(2)}` : "<0.01";
                })()}
              </span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="px-4 py-16 text-center text-sm text-text-muted">
            No markets match your filters.
          </div>
        )}
      </div>
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
      <div className={`mt-1 tabular font-mono text-lg font-semibold ${accent ? "text-accent" : "text-text-primary"}`}>
        {value}
        {suffix && <span className="ml-1 text-[11px] font-normal text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
