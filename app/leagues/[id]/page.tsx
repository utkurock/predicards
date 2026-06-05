"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Coins,
  PlayCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toaster";
import { todaysLeagues } from "@/lib/mockData/leagues";
import { HydrationGate } from "@/components/HydrationGate";
import { Button } from "@/components/Button";
import { CardComponent } from "@/components/Card";
import {
  cardStrength,
  championshipPrize,
  lineupStrength as computeLineupStrength,
  standings,
  tierColor,
  tierLabel,
} from "@/lib/leagueLogic";
import { rarityLabel, rarityWeight } from "@/lib/pricing";
import type { Card } from "@/lib/types";

export default function LeagueDetailPage() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const league = useMemo(
    () => todaysLeagues.find((l) => l.id === params.id),
    [params.id]
  );
  const state = useStore((s) => (league ? s.leagues[league.id] : undefined));

  if (!league) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center text-text-secondary">
        League not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10">
      <Link
        href="/leagues"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All leagues
      </Link>

      <Header league={league} state={state} />

      {!state ? (
        <Entry leagueId={league.id} />
      ) : (
        <Stage leagueId={league.id} />
      )}
    </div>
  );
}

function Header({
  league,
  state,
}: {
  league: ReturnType<typeof todaysLeagues.find>;
  state: ReturnType<typeof useStore.getState>["leagues"][string] | undefined;
}) {
  if (!league) return null;
  const color = tierColor(league.tier);
  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color }}>
          {tierLabel[league.tier]} · {league.date}
        </div>
        <h1 className="mt-1 text-[36px] font-bold leading-[1.05] tracking-[-0.025em]">
          {league.name}
        </h1>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <div className="rounded-lg border border-line-subtle bg-bg-card px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-text-muted">Entry</div>
          <div className="tabular font-mono text-[13px] font-semibold">{league.entryFee} USDT</div>
        </div>
        <div className="rounded-lg border border-line-subtle bg-bg-card px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-text-muted">Pot</div>
          <div className="tabular font-mono text-[13px] font-semibold">
            {league.entryFee * league.capacity} USDT
          </div>
        </div>
        <div className="rounded-lg border border-line-subtle bg-bg-card px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-text-muted">Squad</div>
          <div className="tabular font-mono text-[13px] font-semibold">
            {league.minLineup}-{league.maxLineup}
          </div>
        </div>
        {state && (
          <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-accent">
            <div className="text-[9px] uppercase tracking-wider opacity-80">Round</div>
            <div className="tabular font-mono text-[13px] font-semibold">
              {state.currentRound} / {league.rounds}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Entry / lineup selection ---------------- */

function Entry({ leagueId }: { leagueId: string }) {
  const league = todaysLeagues.find((l) => l.id === leagueId)!;
  const collection = useStore((s) => s.collection);
  const balance = useStore((s) => s.balance);
  const join = useStore((s) => s.joinLeague);
  const toast = useToast((s) => s.push);

  const eligible = useMemo(
    () =>
      [...collection]
        .filter((c) => c.status === "in_album")
        .sort((a, b) => cardStrength(b) - cardStrength(a)),
    [collection]
  );

  const [picked, setPicked] = useState<string[]>([]);
  const pickedCards = picked
    .map((id) => eligible.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));
  const power = computeLineupStrength(pickedCards);

  const toggle = (id: string) => {
    setPicked((p) =>
      p.includes(id)
        ? p.filter((x) => x !== id)
        : p.length >= league.maxLineup
        ? p
        : [...p, id]
    );
  };

  const canEnter =
    picked.length >= league.minLineup &&
    picked.length <= league.maxLineup &&
    balance >= league.entryFee;

  const insufficient = balance < league.entryFee;

  const submit = () => {
    const res = join(league, picked);
    if (!res.ok) {
      toast(res.reason ?? "Could not join.", "error");
      return;
    }
    toast(`Joined ${league.name}. Lineup locked.`, "success");
  };

  if (eligible.length < league.minLineup) {
    return (
      <div className="mt-10 panel p-10 text-center">
        <Trophy className="mx-auto h-8 w-8 text-text-muted" />
        <h2 className="mt-4 text-lg font-semibold">Not enough cards</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You need at least {league.minLineup} cards in your album to enter this league.
          You currently have {eligible.length}.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/packs">
            <Button>Open a pack</Button>
          </Link>
          {process.env.NODE_ENV !== "production" && (
            <Link href="/dev">
              <Button variant="outline">Seed demo</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Card picker */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-[18px] font-semibold">Pick your squad</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Min {league.minLineup}, max {league.maxLineup}. Sorted by strength.
            </p>
          </div>
          <div className="text-right text-[11px] text-text-muted">
            <div>
              Selected{" "}
              <span className="tabular font-mono text-text-primary">{picked.length}</span>
              <span className="text-text-muted"> / {league.maxLineup}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {eligible.map((c) => {
            const isPicked = picked.includes(c.id);
            const blocked = !isPicked && picked.length >= league.maxLineup;
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={blocked}
                className={`group relative text-left transition-all ${
                  blocked ? "opacity-40" : ""
                }`}
              >
                <div
                  className={`relative overflow-hidden rounded-xl ring-2 transition-all ${
                    isPicked
                      ? "ring-accent"
                      : "ring-transparent hover:ring-line"
                  }`}
                >
                  <CardComponent card={c} compact />
                  {isPicked && (
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-ink">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-0.5 text-[10px]">
                  <span className="text-text-muted">
                    {rarityLabel[c.rarity]} · ×{rarityWeight[c.rarity]}
                  </span>
                  <span className="tabular font-mono text-text-primary">
                    {cardStrength(c).toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary panel */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="panel p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Lineup power
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="bignum text-[44px]">{power.toFixed(1)}</span>
            <span className="text-xs text-text-secondary">/ vs ~{league.tier === "bronze" ? 12 : league.tier === "silver" ? 24 : 48} baseline</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <Field
              label="Squad size"
              value={`${picked.length} / ${league.maxLineup}`}
              ok={picked.length >= league.minLineup}
            />
            <Field
              label="Entry"
              value={`${league.entryFee} USDT`}
              ok={!insufficient}
            />
          </div>

          <div className="mt-4 space-y-1">
            {(["mythic", "legendary", "epic", "rare", "common"] as const).map((r) => {
              const n = pickedCards.filter((c) => c.rarity === r).length;
              if (n === 0) return null;
              return (
                <div key={r} className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">{rarityLabel[r]}</span>
                  <span className="tabular font-mono text-text-primary">×{n}</span>
                </div>
              );
            })}
          </div>

          <Button
            disabled={!canEnter}
            onClick={submit}
            size="lg"
            className="mt-5 w-full"
          >
            {insufficient
              ? "Insufficient balance"
              : picked.length < league.minLineup
              ? `Pick ${league.minLineup - picked.length} more`
              : `Enter for ${league.entryFee} USDT`}
            {canEnter && <ChevronRight className="h-4 w-4" />}
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            Selected cards lock until the league ends. You forfeit the entry fee if you leave early.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${
        ok ? "border-line-subtle bg-bg-base" : "border-live/30 bg-live/5"
      }`}
    >
      <div className="text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="tabular font-mono text-[12px] font-semibold">{value}</div>
    </div>
  );
}

/* ---------------- Stage: live + finished ---------------- */

function Stage({ leagueId }: { leagueId: string }) {
  const league = todaysLeagues.find((l) => l.id === leagueId)!;
  const state = useStore((s) => s.leagues[leagueId])!;
  const playNext = useStore((s) => s.playNextRound);
  const playAll = useStore((s) => s.playAllRounds);
  const claim = useStore((s) => s.claimLeague);
  const leave = useStore((s) => s.leaveLeague);
  const toast = useToast((s) => s.push);
  const router = useRouter();

  const ranked = useMemo(() => standings(state.entries), [state.entries]);
  const userRank = ranked.findIndex((e) => e.id === state.userEntryId) + 1;
  const userEntry = state.entries.find((e) => e.id === state.userEntryId)!;
  const finished = state.status === "finished";
  const prize = finished
    ? championshipPrize(userRank, league.entryFee, league.capacity)
    : 0;

  const handleClaim = () => {
    const total = claim(leagueId, league);
    toast(`Claimed ${total.toFixed(2)} USDT. Lineup unlocked.`, "success");
    router.push("/leagues");
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Standings */}
        <div className="panel">
          <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3">
            <div>
              <div className="text-sm font-semibold">Standings</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">
                {finished ? "Final" : `After round ${state.currentRound}`}
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              W · D · L · Pts
            </div>
          </div>
          <div className="divide-y divide-line-subtle">
            {ranked.map((e, i) => {
              const isUser = e.isUser;
              const rank = i + 1;
              const inPrize = finished && rank <= 3;
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-4 px-5 py-3 text-sm ${
                    isUser ? "bg-accent/[0.04]" : ""
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular ${
                      rank === 1
                        ? "bg-rarity-legendary/20 text-rarity-legendary"
                        : rank === 2
                        ? "bg-rarity-rare/20 text-rarity-rare"
                        : rank === 3
                        ? "bg-rarity-epic/20 text-rarity-epic"
                        : "bg-bg-base text-text-muted"
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={isUser ? "font-semibold" : ""}>{e.ownerLabel}</span>
                      {isUser && (
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent">
                          You
                        </span>
                      )}
                      {inPrize && (
                        <Trophy className="h-3 w-3 text-rarity-legendary" />
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-muted">
                      Power {e.rosterPower.toFixed(1)} · {e.lineupCardIds.length} cards
                    </div>
                  </div>
                  <div className="flex items-center gap-3 tabular font-mono text-[12px]">
                    <span className="w-6 text-right text-text-secondary">{e.wins}</span>
                    <span className="w-6 text-right text-text-muted">{e.draws}</span>
                    <span className="w-6 text-right text-text-secondary">{e.losses}</span>
                    <span className="w-8 text-right font-semibold">{e.points}</span>
                    <span
                      className={`w-16 text-right ${
                        e.balanceDelta > 0
                          ? "text-accent"
                          : e.balanceDelta < 0
                          ? "text-live"
                          : "text-text-muted"
                      }`}
                    >
                      {e.balanceDelta >= 0 ? "+" : ""}
                      {e.balanceDelta.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Match log */}
        <div className="panel">
          <div className="border-b border-line-subtle px-5 py-3">
            <div className="text-sm font-semibold">Match log</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              Each round you face one opponent
            </div>
          </div>
          <div className="divide-y divide-line-subtle">
            {state.matches
              .filter((m) => m.round <= state.currentRound)
              .map((m) => {
                const home = state.entries.find((e) => e.id === m.homeEntryId)!;
                const away = state.entries.find((e) => e.id === m.awayEntryId)!;
                const userInvolved = home.isUser || away.isUser;
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-[40px_1fr_auto_1fr] items-center gap-3 px-5 py-3 text-sm ${
                      userInvolved ? "bg-accent/[0.03]" : ""
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      R{m.round}
                    </span>
                    <div className="text-right">
                      <span className={home.isUser ? "font-semibold text-text-primary" : "text-text-secondary"}>
                        {home.ownerLabel}
                      </span>
                    </div>
                    <div className="tabular font-mono text-[13px] font-semibold">
                      <span className={m.result === "home_win" ? "text-accent" : m.result === "away_win" ? "text-text-muted" : ""}>
                        {m.homeScore.toFixed(2)}
                      </span>
                      <span className="mx-1.5 text-text-muted">·</span>
                      <span className={m.result === "away_win" ? "text-accent" : m.result === "home_win" ? "text-text-muted" : ""}>
                        {m.awayScore.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className={away.isUser ? "font-semibold text-text-primary" : "text-text-secondary"}>
                        {away.ownerLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            {state.currentRound === 0 && (
              <div className="px-5 py-8 text-center text-xs text-text-muted">
                No matches yet — play the first round.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="panel p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Your run
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="bignum text-[40px]">#{userRank}</span>
            <span className="text-xs text-text-secondary">of {state.entries.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            <Pill label="W" value={userEntry.wins} />
            <Pill label="D" value={userEntry.draws} />
            <Pill label="L" value={userEntry.losses} />
          </div>
          <div className="mt-4 rounded-lg border border-line-subtle bg-bg-base p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Per-round PnL</span>
              <span
                className={`tabular font-mono font-semibold ${
                  userEntry.balanceDelta > 0
                    ? "text-accent"
                    : userEntry.balanceDelta < 0
                    ? "text-live"
                    : ""
                }`}
              >
                {userEntry.balanceDelta >= 0 ? "+" : ""}
                {userEntry.balanceDelta.toFixed(2)} USDT
              </span>
            </div>
            {finished && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Championship</span>
                <span className="tabular font-mono font-semibold text-accent">
                  +{prize.toFixed(2)} USDT
                </span>
              </div>
            )}
          </div>

          {!finished ? (
            <div className="mt-5 space-y-2">
              <Button
                onClick={() => {
                  const ok = playNext(leagueId, league);
                  if (ok) toast(`Round ${state.currentRound + 1} played.`, "success");
                }}
                size="lg"
                className="w-full"
              >
                <PlayCircle className="h-4 w-4" />
                Play round {state.currentRound + 1}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  playAll(leagueId, league);
                  toast("All rounds played.", "info");
                }}
                size="md"
                className="w-full"
              >
                <Zap className="h-4 w-4" />
                Sim to end
              </Button>
            </div>
          ) : !state.claimed ? (
            <Button onClick={handleClaim} size="lg" className="mt-5 w-full">
              <Trophy className="h-4 w-4" />
              Claim {(prize + userEntry.balanceDelta).toFixed(2)} USDT
            </Button>
          ) : (
            <div className="mt-5 rounded-lg border border-line-subtle bg-bg-base p-3 text-center text-[11px] text-text-muted">
              Prize claimed · cards unlocked
            </div>
          )}

          {state.currentRound === 0 && !finished && (
            <button
              onClick={() => {
                if (confirm("Forfeit entry fee and unlock cards?")) {
                  leave(leagueId);
                  toast("Left the league. Entry fee forfeited.", "info");
                  router.push("/leagues");
                }
              }}
              className="mt-3 w-full text-center text-[11px] text-text-muted hover:text-live"
            >
              Forfeit entry
            </button>
          )}
        </div>

        <div className="panel p-5">
          <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Per-round payouts
          </div>
          <div className="mt-2 space-y-1.5 text-[11px]">
            <PayoutRow label="Win" amount={`+${(league.entryFee * 0.3).toFixed(2)}`} positive />
            <PayoutRow label="Draw" amount="0.00" />
            <PayoutRow label="Loss" amount={`−${(league.entryFee * 0.1).toFixed(2)}`} negative />
          </div>
        </div>
      </aside>

    </div>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line-subtle bg-bg-base px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="bignum mt-0.5 text-base">{value}</div>
    </div>
  );
}

function PayoutRow({
  label, amount, positive, negative,
}: {
  label: string;
  amount: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span
        className={`tabular font-mono font-semibold ${
          positive ? "text-accent" : negative ? "text-live" : "text-text-muted"
        }`}
      >
        {amount} USDT
      </span>
    </div>
  );
}
