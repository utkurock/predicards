"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore, parlayReadiness } from "@/lib/store";
import { CardComponent } from "@/components/Card";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { CommissionBanner } from "@/components/CommissionBanner";
import { Layers3, Sparkles, Lock, Check, Trophy } from "lucide-react";
import { rarityWeight } from "@/lib/pricing";

type Tab = "sets" | "team" | "player" | "stage" | "all";

export default function AlbumPage() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const collection = useStore((s) => s.collection);
  const parlays = useStore((s) => s.parlays);
  const [tab, setTab] = useState<Tab>("sets");

  const stats = useMemo(() => {
    const active = collection.filter((c) => c.status === "in_album" || c.status === "locked_in_parlay");
    const settled = collection.filter((c) => c.status === "settled_won" || c.status === "settled_lost");
    const byRarity = active.reduce<Record<string, number>>((acc, c) => {
      acc[c.rarity] = (acc[c.rarity] || 0) + 1;
      return acc;
    }, {});
    return { active, settled, byRarity };
  }, [collection]);

  if (collection.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <Layers3 className="mx-auto h-10 w-10 text-text-muted" />
        <h1 className="mt-6 section-title">Your album is empty</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Open a pack to start collecting. Each card you pull is a YES position on a real prediction market.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/packs">
            <Button>Open your first pack</Button>
          </Link>
          {process.env.NODE_ENV !== "production" && (
            <Link href="/dev">
              <Button variant="outline">Seed demo collection</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header + stats */}
      <div className="mb-8">
        <h1 className="section-title">Album</h1>
        <p className="section-sub mt-1.5">{stats.active.length} cards / {parlays.filter(p => p.status === "activated").length} active parlays</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Cards" value={`${stats.active.length}`} />
          <Stat label="Settled" value={`${stats.settled.length}`} />
          <Stat label="Mythic" value={`${stats.byRarity.mythic ?? 0}`} accent="mythic" />
          <Stat label="Legendary" value={`${stats.byRarity.legendary ?? 0}`} accent="legendary" />
          <Stat label="Epic" value={`${stats.byRarity.epic ?? 0}`} accent="epic" />
        </div>
      </div>

      {/* Commission earnings */}
      <div className="mb-8">
        <CommissionBanner />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-line-subtle">
        {(["sets", "team", "player", "stage", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-3 text-sm capitalize transition-colors ${
              tab === t ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "sets" ? "Parlay sets" : t === "stage" ? "By stage" : `By ${t}`}
            {tab === t && (
              <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
            )}
          </button>
        ))}
      </div>

      {tab === "sets" && <ParlaySetsView />}
      {tab === "team" && <ByTeamView />}
      {tab === "player" && <CategoryView category="player" />}
      {tab === "stage" && <ByStageView />}
      {tab === "all" && <AllCardsView />}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const ring =
    accent === "mythic"
      ? "border-rarity-mythic/30"
      : accent === "legendary"
      ? "border-rarity-legendary/30"
      : accent === "epic"
      ? "border-rarity-epic/30"
      : "border-line-subtle";
  return (
    <div className={`rounded-xl border bg-bg-card px-4 py-3 ${ring}`}>
      <div className="font-mono text-[10px] uppercase text-text-muted">{label}</div>
      <div className="bignum mt-1 text-xl">{value}</div>
    </div>
  );
}

function ParlaySetsView() {
  const collection = useStore((s) => s.collection);
  const parlays = useStore((s) => s.parlays);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {parlays.map((parlay) => {
        const readiness = parlayReadiness(parlay, collection);
        const pct = (readiness.have / readiness.total) * 100;
        const isReady = readiness.have === readiness.total;
        return (
          <Link
            key={parlay.id}
            href={`/album/sets/${parlay.id}`}
            className="group relative panel p-5 transition-all hover:border-line"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{parlay.name}</h3>
                  {parlay.status === "activated" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                      <Lock className="h-2.5 w-2.5" /> Activated
                    </span>
                  )}
                  {parlay.status === "settled_won" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
                      <Trophy className="h-2.5 w-2.5" /> Won
                    </span>
                  )}
                  {parlay.status === "settled_lost" && (
                    <span className="rounded-full border border-live/30 bg-live/10 px-1.5 py-0.5 text-[10px] text-live">
                      Lost
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">{parlay.description}</p>
              </div>
              <div className="text-right">
                <div className="tabular font-mono text-lg font-bold text-accent">
                  {parlay.multiplier}x
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  Multiplier
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  Progress · {readiness.have} / {readiness.total}
                </span>
                {isReady && parlay.status === "incomplete" && (
                  <span className="text-accent">Ready to activate</span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-bg-base">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ByTeamView() {
  const collection = useStore((s) => s.collection);
  const teams = ["Brazil", "Argentina", "France", "Germany", "USA", "Saudi", "England", "Spain"];
  return (
    <div className="space-y-8">
      {teams.map((team) => {
        const cards = collection.filter((c) => c.statement.includes(team));
        if (cards.length === 0) return null;
        return (
          <section key={team}>
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">
              {team}
              <span className="ml-2 text-xs font-normal text-text-muted">({cards.length})</span>
            </h3>
            <CardGrid cards={cards} />
          </section>
        );
      })}
    </div>
  );
}

function ByStageView() {
  const collection = useStore((s) => s.collection);
  const stages = [
    { label: "Group stage", keywords: ["group", "Group"] },
    { label: "Round of 16", keywords: ["R16"] },
    { label: "Quarterfinal", keywords: ["quarterfinal", "quarter"] },
    { label: "Semifinal", keywords: ["semifinal", "semi"] },
    { label: "Final", keywords: ["Final", "Cup"] },
  ];
  return (
    <div className="space-y-8">
      {stages.map((stage) => {
        const cards = collection.filter((c) =>
          stage.keywords.some((kw) => c.statement.toLowerCase().includes(kw.toLowerCase()))
        );
        if (cards.length === 0) return null;
        return (
          <section key={stage.label}>
            <h3 className="mb-3 text-sm font-semibold text-text-secondary">
              {stage.label}
              <span className="ml-2 text-xs font-normal text-text-muted">({cards.length})</span>
            </h3>
            <CardGrid cards={cards} />
          </section>
        );
      })}
    </div>
  );
}

function CategoryView({ category }: { category: string }) {
  const collection = useStore((s) => s.collection);
  const cards = collection.filter((c) => c.category === category);
  if (cards.length === 0) {
    return (
      <div className="panel p-12 text-center text-sm text-text-secondary">
        No {category} cards yet.
      </div>
    );
  }
  return <CardGrid cards={cards} />;
}

function AllCardsView() {
  const collection = useStore((s) => s.collection);
  const sorted = [...collection].sort((a, b) => rarityWeight[b.rarity] - rarityWeight[a.rarity]);
  return <CardGrid cards={sorted} />;
}

function CardGrid({ cards }: { cards: ReturnType<typeof useStore.getState>["collection"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {cards.map((card) => (
        <CardComponent key={card.id} card={card} href={`/card/${card.id}`} compact />
      ))}
    </div>
  );
}
