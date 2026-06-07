"use client";

import { RarityBadge } from "@/components/RarityBadge";
import { getCollection } from "@/lib/collections";
import type { Market } from "@/lib/types";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

function fmtVol(v: number | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// A single market shown as a marketplace "product" tile — image cover, collection
// chip, live price and volume. Links out to the underlying Polymarket market.
export function MarketTile({ m }: { m: Market }) {
  const c = getCollection(m.collection);
  const accent = c?.accent ?? "32 124 255";
  const price = (m.impliedProbability * 100).toFixed(1);
  const up = (m.change24h ?? 0) >= 0;

  return (
    <a
      href={m.sourceUrl || "#"}
      target={m.sourceUrl ? "_blank" : undefined}
      rel="noreferrer"
      className="group panel flex flex-col overflow-hidden shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Cover */}
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ background: `linear-gradient(135deg, rgb(${accent} / 0.30), rgb(${accent} / 0.06))` }}
      >
        {m.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-60">
            {c?.emoji ?? "🪙"}
          </div>
        )}
        {/* collection chip */}
        {c && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <span>{c.emoji}</span>
            {c.label.split(" ")[0]}
          </span>
        )}
        <span className="absolute right-2.5 top-2.5">
          <RarityBadge rarity={m.rarity} size="xs" />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-text-primary">
          {m.statement}
        </p>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="tabular font-mono text-lg font-semibold text-text-primary">{price}%</div>
            <div
              className={`tabular flex items-center gap-0.5 font-mono text-[11px] ${
                up ? "text-accent" : "text-live"
              }`}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(m.change24h ?? 0).toFixed(1)} 24h
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Volume</div>
            <div className="tabular font-mono text-[12px] font-medium text-text-secondary">
              {fmtVol(m.volume)}
            </div>
          </div>
        </div>

        {m.sourceUrl && (
          <div className="flex items-center gap-1 border-t border-line-subtle pt-2 font-mono text-[10px] text-text-muted group-hover:text-text-secondary">
            Polymarket <ExternalLink className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
    </a>
  );
}
