"use client";

import { useStore } from "@/lib/store";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PriceTicker() {
  const markets = useStore((s) => s.markets);
  const items = markets
    // Skip near-0/near-1 markets so the ticker shows lively prices, not a row of 0.00%.
    .filter((m) => m.impliedProbability >= 0.03 && m.impliedProbability <= 0.97)
    .slice(0, 12)
    .map((m, i) => {
    // Real 24h change from Polymarket when present; otherwise a deterministic placeholder.
    const change =
      typeof m.change24h === "number"
        ? m.change24h
        : ((Math.sin(i * 1.7) * 100 + Math.cos(i * 2.3) * 30) / 100) * 8;
    const price = (m.impliedProbability * 100).toFixed(2);
    return {
      id: m.id,
      label: shortLabel(m.statement),
      price,
      change,
    };
  });
  const doubled = [...items, ...items];
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-line-subtle bg-bg-base/95 backdrop-blur-xl">
      <div className="ticker py-3">
        {doubled.map((it, i) => (
          <div key={`${it.id}-${i}`} className="flex items-center gap-2 px-1">
            <span className="font-mono text-[11px] uppercase text-text-muted">{it.label}</span>
            <span className="tabular font-mono text-[12px] font-semibold text-text-primary">
              {it.price}%
            </span>
            <span
              className={`flex items-center gap-0.5 tabular font-mono text-[11px] ${
                it.change >= 0 ? "text-accent" : "text-live"
              }`}
            >
              {it.change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {it.change >= 0 ? "+" : ""}
              {it.change.toFixed(2)}%
            </span>
            <span className="text-text-muted">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortLabel(s: string) {
  const w = s.split(" ");
  if (w.length <= 4) return s.toUpperCase();
  return (w[0] + " " + w[1] + " " + w[2]).toUpperCase();
}
