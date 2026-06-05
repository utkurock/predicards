"use client";

import Link from "next/link";
import { ArrowRight, Trophy, Users, Coins, CalendarDays } from "lucide-react";
import { todaysLeagues } from "@/lib/mockData/leagues";
import { useStore } from "@/lib/store";
import { HydrationGate } from "@/components/HydrationGate";
import { tierColor, tierLabel } from "@/lib/leagueLogic";

export default function LeaguesPage() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const leagues = useStore((s) => s.leagues);
  const collection = useStore((s) => s.collection);
  const eligibleCount = collection.filter((c) => c.status === "in_album").length;

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="section-title">Leagues</h1>
          <p className="section-sub mt-2">Daily fantasy / 7 rounds / Winner takes the pot</p>
        </div>
        <div className="text-right text-xs text-text-muted">
          <div className="flex items-center justify-end gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {todaysLeagues[0]?.date}
          </div>
          <div className="mt-1 tabular font-mono">{eligibleCount} cards eligible</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {todaysLeagues.map((league) => {
          const state = leagues[league.id];
          const joined = !!state;
          const pot = league.entryFee * league.capacity;
          const color = tierColor(league.tier);

          return (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="group relative flex h-full flex-col gap-5 overflow-hidden panel p-6 transition-all hover:border-line"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />
              <div
                className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full opacity-[0.08] blur-2xl"
                style={{ background: color }}
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color }}>
                    {tierLabel[league.tier]}
                  </div>
                  <h2 className="mt-1 text-[20px] font-bold leading-tight">{league.name}</h2>
                </div>
                {joined && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {state!.status === "finished" && !state!.claimed
                      ? "Ready to claim"
                      : state!.status === "finished"
                      ? "Settled"
                      : `Round ${state!.currentRound}/${league.rounds}`}
                  </span>
                )}
              </div>

              <div className="relative grid grid-cols-3 gap-3 text-[11px]">
                <Stat label="Entry" value={`${league.entryFee} USDT`} icon={<Coins className="h-3 w-3" />} />
                <Stat label="Pot" value={`${pot} USDT`} icon={<Trophy className="h-3 w-3" />} />
                <Stat label="Squad" value={`${league.minLineup}-${league.maxLineup}`} icon={<Users className="h-3 w-3" />} />
              </div>

              <div className="relative space-y-1.5 rounded-lg border border-line-subtle bg-bg-base p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">Prize split</div>
                <PrizeRow label="1st" pct="50%" amount={pot * 0.5} />
                <PrizeRow label="2nd" pct="25%" amount={pot * 0.25} />
                <PrizeRow label="3rd" pct="12.5%" amount={pot * 0.125} />
                <PrizeRow label="4th" pct="entry" amount={league.entryFee} />
              </div>

              <div className="relative mt-auto flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  {league.capacity - 1} bot opponents · {league.rounds} matches
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-text-primary">
                  {joined ? "Open" : "Enter"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line-subtle bg-bg-base px-2.5 py-2">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 tabular font-mono text-[12px] font-semibold">{value}</div>
    </div>
  );
}

function PrizeRow({ label, pct, amount }: { label: string; pct: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-text-secondary">
        {label} <span className="ml-1 text-text-muted">· {pct}</span>
      </span>
      <span className="tabular font-mono text-text-primary">
        {amount.toFixed(2)} <span className="text-text-muted">USDT</span>
      </span>
    </div>
  );
}
