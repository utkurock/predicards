"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { useStore, parlayReadiness } from "@/lib/store";
import { CardComponent } from "@/components/Card";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { ArrowLeft, Lock, ShoppingCart, Check, Trophy } from "lucide-react";
import { useToast } from "@/components/Toaster";
import { potentialPayout } from "@/lib/pricing";

export default function SetPage() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const params = useParams<{ setId: string }>();
  const router = useRouter();
  const collection = useStore((s) => s.collection);
  const parlays = useStore((s) => s.parlays);
  const markets = useStore((s) => s.markets);
  const activate = useStore((s) => s.activateParlay);
  const toast = useToast((s) => s.push);

  const parlay = useMemo(() => parlays.find((p) => p.id === params.setId), [parlays, params.setId]);
  if (!parlay) {
    return <div className="mx-auto max-w-3xl px-6 py-20 text-center text-text-secondary">Set not found.</div>;
  }

  const readiness = parlayReadiness(parlay, collection);
  const isReady = readiness.have === readiness.total;
  const isActive = parlay.status === "activated" || parlay.status === "settled_won";

  const slotData = parlay.requiredMarketIds
    .map((mid) => {
      const market = markets.find((m) => m.id === mid);
      const card = collection.find(
        (c) => c.marketId === mid && (c.status === "in_album" || c.status === "locked_in_parlay" || c.status === "settled_won")
      );
      return { market, card };
    })
    // Drop legs whose market dropped out of the live pool (e.g. a frozen activated parlay).
    .filter((s): s is { market: NonNullable<typeof s.market>; card: typeof s.card } => Boolean(s.market));

  const potential = slotData.reduce((sum, s) => {
    if (s.card) return sum + s.card.potentialPayout;
    // Estimate missing legs from the market's own rarity, not a flat assumption.
    return sum + potentialPayout(s.market.rarity);
  }, 0) * parlay.multiplier;

  const handleActivate = () => {
    const ok = activate(parlay.id);
    if (ok) {
      toast(`Parlay activated. Potential payout ${potential.toFixed(2)} USDT.`, "success");
    } else {
      toast("Could not activate parlay. Check that all cards are unlocked.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/album" className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to album
      </Link>

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-sub">Parlay set</p>
          <h1 className="section-title mt-1.5">{parlay.name}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">{parlay.description}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Big label="Multiplier" value={`${parlay.multiplier}x`} />
          <Big label="Slots" value={`${readiness.have}/${readiness.total}`} />
          <Big label="Potential" value={`${potential.toFixed(2)}`} suffix="USDT" />
        </div>
      </div>

      {/* Activate banner */}
      <div className={`mb-8 rounded-xl border p-4 ${
        isActive ? "border-accent/40 bg-accent/5" : isReady ? "border-accent/30 bg-accent/5" : "border-line-subtle bg-bg-card"
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isActive ? (
              parlay.status === "settled_won" ? (
                <Trophy className="h-5 w-5 text-accent" />
              ) : (
                <Lock className="h-5 w-5 text-accent" />
              )
            ) : isReady ? (
              <Check className="h-5 w-5 text-accent" />
            ) : (
              <ShoppingCart className="h-5 w-5 text-text-secondary" />
            )}
            <div>
              <div className="text-sm font-semibold">
                {parlay.status === "settled_won"
                  ? "Parlay won. Payout credited."
                  : parlay.status === "settled_lost"
                  ? "One leg resolved NO. Parlay settled."
                  : isActive
                  ? "Cards locked. Awaiting market resolution."
                  : isReady
                  ? "Ready to activate."
                  : `Missing ${readiness.missing.length} card${readiness.missing.length === 1 ? "" : "s"}.`}
              </div>
              <div className="text-xs text-text-secondary">
                Combined payout if all legs resolve YES: <span className="tabular font-mono text-text-primary">{potential.toFixed(2)} USDT</span>
              </div>
            </div>
          </div>
          {isReady && !isActive && (
            <Button onClick={handleActivate}>Activate parlay</Button>
          )}
          {!isReady && !isActive && (
            <Link href="/market">
              <Button variant="outline">Find missing cards</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {slotData.map(({ market, card }) => (
          <div key={market.id}>
            {card ? (
              <CardComponent card={card} href={`/card/${card.id}`} compact />
            ) : (
              <Link
                href={`/market?missingMarketId=${market.id}`}
                className="group flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl border-2 border-dashed border-line bg-bg-card/40 p-3 transition-colors hover:border-line-bright"
              >
                <div className="flex flex-1 items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-text-muted group-hover:text-text-secondary" />
                </div>
                <div className="text-[11px] font-medium leading-snug text-text-secondary line-clamp-3">
                  {market.statement}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
                  Find on market
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Big({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="panel px-3 py-2.5 text-right">
      <div className="font-mono text-[10px] uppercase text-text-muted">{label}</div>
      <div className="bignum tabular mt-1 text-2xl">
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
