"use client";

import { useEffect, useMemo, useState } from "react";
import { CommissionBanner } from "@/components/CommissionBanner";
import { MarketTile } from "@/components/MarketTile";
import { IN_APP_FEE_RATE } from "@/lib/commission";
import { COLLECTIONS } from "@/lib/collections";
import type { CollectionId } from "@/lib/collections";
import type { Market } from "@/lib/types";
import { Search } from "lucide-react";

const PAGE = 48; // tiles rendered per "page" — keeps the grid snappy across 360 markets

type Filter = CollectionId | "all";

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/markets?all=1", { cache: "no-store" })
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
  }, []);

  // Counts per collection for the filter chips.
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: markets.length };
    for (const m of markets) {
      const k = m.collection ?? "world-cup";
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [markets]);

  const filtered = useMemo(() => {
    let arr = markets;
    if (filter !== "all") arr = arr.filter((m) => (m.collection ?? "world-cup") === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((m) => m.statement.toLowerCase().includes(q));
    }
    return arr;
  }, [markets, filter, query]);

  // Reset the visible window whenever the filter/search changes.
  useEffect(() => {
    setVisible(PAGE);
  }, [filter, query]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="section-sub">Powered by Polymarket</p>
        <h1 className="section-title">Marketplace</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Every live prediction market, in one place. Filter by collection to own a World Cup card
          and you earn a {Math.round(IN_APP_FEE_RATE * 100)}% commission on every secondary sale plus
          passive yield as its market trades. More collections become mintable soon.
        </p>
      </div>

      <div className="mt-6">
        <CommissionBanner />
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[68px] z-20 mt-8 -mx-2 flex flex-wrap items-center gap-2 rounded-2xl bg-bg-base/80 px-2 py-2 backdrop-blur-md">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={counts.all}
        />
        {COLLECTIONS.map((c) => (
          <FilterChip
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
            label={c.label}
            emoji={c.emoji}
            accent={c.accent}
            count={counts[c.id]}
          />
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

      {/* Product grid */}
      {loading && markets.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="panel aspect-[16/10] animate-pulse opacity-60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-text-muted">No markets match your filters.</div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((m) => (
              <MarketTile key={m.id} m={m} />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="rounded-full border border-line bg-bg-card px-5 py-2.5 text-[13px] font-medium text-text-primary shadow-soft transition hover:border-line-bright"
              >
                Load more · {filtered.length - visible} left
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  emoji,
  accent,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji?: string;
  accent?: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
        active
          ? ""
          : "border-line-subtle bg-bg-card text-text-secondary hover:border-line hover:text-text-primary"
      }`}
      style={
        active
          ? {
              borderColor: `rgb(${accent ?? "32 124 255"})`,
              background: `rgb(${accent ?? "32 124 255"} / 0.12)`,
              color: `rgb(${accent ?? "32 124 255"})`,
            }
          : undefined
      }
    >
      {emoji && <span>{emoji}</span>}
      {label}
      {typeof count === "number" && (
        <span className="tabular font-mono text-[10px] opacity-60">{count}</span>
      )}
    </button>
  );
}
