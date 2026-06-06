"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCommission } from "@/lib/commissionStore";
import { CommissionBanner } from "@/components/CommissionBanner";
import { IN_APP_FEE_RATE } from "@/lib/commission";
import { COLLECTIONS } from "@/lib/collections";
import type { CollectionId } from "@/lib/collections";
import { ArrowRight } from "lucide-react";

type Summary = { id: CollectionId; marketCount: number; totalVolume: number; volume24h: number };

function fmtVol(v: number | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function MarketsPage() {
  const stats = useCommission((s) => s.stats);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/markets?summary=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { collections?: Summary[] }) => {
        if (cancelled || !Array.isArray(d.collections)) return;
        const map: Record<string, Summary> = {};
        for (const s of d.collections) map[s.id] = s;
        setSummaries(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Network-wide commission (only the World Cup collection mints today).
  const network = useMemo(() => {
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
        <h1 className="section-title">Marketplace</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Browse live prediction markets by collection. Own a World Cup card and you earn from both
          sides — passive yield as its market trades on Polymarket, plus a{" "}
          {Math.round(IN_APP_FEE_RATE * 100)}% commission on every secondary sale, split across
          holders. More collections become mintable soon.
        </p>
      </div>

      {/* Earnings banner */}
      <div className="mt-6">
        <CommissionBanner />
      </div>

      {/* Collections grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map((c) => {
          const s = summaries[c.id];
          const isWc = c.id === "world-cup";
          return (
            <Link
              key={c.id}
              href={`/markets/${c.id}`}
              className="group panel overflow-hidden shadow-soft transition hover:shadow-lg"
            >
              {/* Cover */}
              <div
                className="relative flex h-28 items-end p-4"
                style={{
                  background: `linear-gradient(135deg, rgb(${c.accent} / 0.22), rgb(${c.accent} / 0.04))`,
                }}
              >
                <span className="absolute right-4 top-3 text-4xl drop-shadow-sm">{c.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-text-primary">{c.label}</h3>
                    {!c.mintable && (
                      <span className="rounded-full border border-line-subtle bg-bg-card/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                        Browse
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 max-w-[85%] text-[11px] leading-snug text-text-secondary">
                    {c.blurb}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 px-4 py-3">
                <Stat label="Markets" value={s ? `${s.marketCount}` : "—"} />
                <Stat label="Volume" value={fmtVol(s?.totalVolume)} />
                {isWc ? (
                  <Stat label="Cards" value={`${network.cards}`} />
                ) : (
                  <Stat label="24h" value={fmtVol(s?.volume24h)} />
                )}
                <ArrowRight className="ml-auto h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="tabular mt-0.5 font-mono text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}
