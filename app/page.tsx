"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Trophy, Layers3, Flame, Swords } from "lucide-react";
import { PackPicker } from "@/components/PackPicker";
import { StatTile } from "@/components/StatTile";
import { Sparkline, genSpark } from "@/components/Sparkline";
import { PriceTicker } from "@/components/PriceTicker";
import { Button } from "@/components/Button";
import { matchResults } from "@/lib/mockData/matchResults";
import { listings } from "@/lib/mockData/listings";

export default function LandingPage() {
  const movers = listings.slice(0, 5).map((l, i) => ({
    listing: l,
    spark: genSpark(i + 1, 24, 0.12),
    change: ((Math.sin(i * 1.7) * 100) / 100) * 12 + 3,
  }));

  return (
    <div className="relative pb-32">
      {/* HERO — large vertical breathing room, two columns with generous gap */}
      <section className="mx-auto max-w-[1180px] px-8 pt-28 pb-32">
        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-[1fr_440px] lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-[44px] font-bold leading-[1.05] tracking-[-0.025em] md:text-[60px]">
              Predict the cup,
              <br />
              <span className="text-accent">trade the glory.</span>
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-[1.6] text-text-secondary">
              Open packs of YES positions on World Cup outcomes. Rarity reflects
              implied probability. Complete sets to activate parlay multipliers.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link href="/packs">
                <Button size="lg">
                  Browse packs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/market"
                className="group inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
              >
                <span>Browse market</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <PackPicker />
          </motion.div>
        </div>
      </section>

      {/* QUICK LINKS — separate band with thin top divider */}
      <section className="border-t border-line-subtle">
        <div className="mx-auto max-w-[1180px] px-8 py-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <QuickLink href="/leagues" icon={<Swords className="h-5 w-5" />} label="Leagues" sub="Daily fantasy" />
            <QuickLink href="/album" icon={<Layers3 className="h-5 w-5" />} label="Album" sub="Your collection" />
            <QuickLink href="/market" icon={<ArrowUpRight className="h-5 w-5" />} label="Market" sub="150 listings" />
            <QuickLink href="/forge" icon={<Flame className="h-5 w-5" />} label="Forge" sub="3 → next tier" />
          </div>
        </div>
      </section>

      {/* STATS — generous top padding */}
      <section className="mx-auto max-w-[1180px] px-8 pt-24 pb-12">
        <div className="mb-10">
          <h2 className="section-title">Overview</h2>
          <p className="section-sub mt-2">Network at a glance</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile
            label="Markets live"
            value="30"
            delta="+3 today"
            deltaSign="up"
            spark={genSpark(11, 32, 0.08)}
            sparkColor="#207CFF"
          />
          <StatTile
            label="Listings"
            value="150"
            delta="+12"
            deltaSign="up"
            spark={genSpark(22, 32, 0.18)}
            sparkColor="#5B9CFF"
          />
          <StatTile
            label="Parlay sets"
            value="08"
            delta="2.0× max"
            deltaSign="neutral"
            spark={genSpark(33, 32, 0.05)}
            sparkColor="#B47CFF"
          />
          <StatTile
            label="Resolved"
            value="07"
            delta="m1–m7"
            deltaSign="neutral"
            spark={genSpark(44, 32, 0.1)}
            sparkColor="#E8B547"
          />
        </div>
      </section>

      {/* TOP MOVERS — its own breathing room */}
      <section className="mx-auto max-w-[1180px] px-8 pt-20 pb-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="section-title">Top movers</h2>
            <p className="section-sub mt-2">Most active markets this hour</p>
          </div>
          <Link
            href="/market"
            className="hidden items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary md:inline-flex"
          >
            View market
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line-subtle">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-6 border-b border-line-subtle bg-bg-elev px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.05em] text-text-muted">
            <span>Market</span>
            <span className="hidden md:block">Implied</span>
            <span className="w-24 text-right">Price</span>
            <span className="w-16 text-right">24h</span>
            <span className="w-16 text-right">Trend</span>
          </div>
          {movers.map((m) => (
            <Link
              key={m.listing.id}
              href={`/market/${m.listing.id}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-6 border-b border-line-subtle px-6 py-5 transition-colors last:border-0 hover:bg-bg-card"
            >
              <div className="flex items-center gap-3">
                <RarityChip rarity={m.listing.card.rarity} />
                <span className="line-clamp-1 text-[14px]">{m.listing.card.statement}</span>
              </div>
              <span className="hidden tabular font-mono text-[12px] text-text-secondary md:inline">
                {(m.listing.card.impliedOddsAtMint * 100).toFixed(1)}%
              </span>
              <span className="w-24 text-right tabular font-mono text-[14px] font-semibold">
                {m.listing.price.toFixed(3)} <span className="text-text-muted">USDT</span>
              </span>
              <span
                className={`w-16 text-right tabular font-mono text-[12px] ${
                  m.change >= 0 ? "text-accent" : "text-live"
                }`}
              >
                {m.change >= 0 ? "+" : ""}
                {m.change.toFixed(1)}%
              </span>
              <div className="w-16">
                <Sparkline
                  data={m.spark}
                  color={m.change >= 0 ? "#207CFF" : "#E5484D"}
                  height={26}
                  fill={false}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PILLARS — separated by big gap */}
      <section className="mx-auto max-w-[1180px] px-8 pt-24 pb-12">
        <div className="mb-10 max-w-md">
          <h2 className="section-title">Three pillars, one product</h2>
          <p className="section-sub mt-2">What makes this design economically meaningful</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Pillar n="01" title="Rarity tracks implied probability">
            Saudi-wins-quarterfinal is Legendary because the odds are tiny but the payout is huge.
          </Pillar>
          <Pillar n="02" title="Dual value: art + bet">
            Cards trade on collectibility premium plus settlement payout. Two markets, one asset.
          </Pillar>
          <Pillar n="03" title="Sets unlock parlay bonuses">
            Complete Semifinalist Quartet for 1.5×. Mythic Wildcards for 2.0×.
          </Pillar>
        </div>
      </section>

      {/* LIVE FEED */}
      <section className="mx-auto max-w-[1180px] px-8 pt-24 pb-12">
        <div className="mb-10">
          <h2 className="section-title flex items-center gap-3">
            <span className="live-dot" />
            Live match feed
          </h2>
          <p className="section-sub mt-2">Most recent results · drives card prices</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matchResults.slice(-6).reverse().map((r) => (
            <div
              key={r.id}
              className="panel p-5"
            >
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span className="font-mono">{r.id.toUpperCase()}</span>
                <span className="font-mono">{r.date}</span>
              </div>
              <div className="mt-3 text-[15px] font-semibold">{r.matchup}</div>
              <div className="mt-2 text-[13px] leading-relaxed text-text-secondary">{r.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1180px] px-8 pt-24">
        <div className="achievement">
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 p-10 md:grid-cols-[1fr_auto] md:p-12">
            <div>
              <div className="font-mono text-[11px] uppercase text-accent">
                Get started
              </div>
              <h2 className="mt-3 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[36px]">
                500 USDT. An empty album.
                <br />
                Make it yours.
              </h2>
            </div>
            <Link href="/packs">
              <Button size="xl">
                Go to pack store <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PriceTicker />
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 panel p-5 transition-all hover:border-line-bright hover:bg-bg-hover"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-base text-text-secondary transition-colors group-hover:text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">{label}</div>
        <div className="truncate text-[12px] text-text-muted">{sub}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
    </Link>
  );
}

function RarityChip({ rarity }: { rarity: string }) {
  const colors: Record<string, string> = {
    common: "bg-rarity-common",
    rare: "bg-rarity-rare",
    epic: "bg-rarity-epic",
    legendary: "bg-rarity-legendary",
    mythic: "bg-rarity-mythic",
  };
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase text-bg-base ${colors[rarity] ?? "bg-rarity-common"}`}
    >
      {rarity[0]}
    </span>
  );
}

function Pillar({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-accent">{n}</span>
        <Trophy className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <h3 className="mt-6 text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{children}</p>
    </div>
  );
}
