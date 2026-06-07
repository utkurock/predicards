"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { MatchFeedItem } from "@/lib/types";

function pct(p: number | undefined): string {
  return p == null ? "—" : `${Math.round(p * 100)}%`;
}

function vol(n: number | undefined): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function kickoffLabel(iso: string): string {
  // Render as a stable UTC HH:MM so SSR and client agree (no hydration drift).
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

function StatusPill({ m }: { m: MatchFeedItem }) {
  if (m.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-live">
        <span className="live-dot" />
        {m.clock || "LIVE"}
      </span>
    );
  }
  if (m.status === "final") {
    return (
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Full time
      </span>
    );
  }
  return (
    <span className="font-mono text-[11px] text-text-secondary">{kickoffLabel(m.kickoff)}</span>
  );
}

function TeamRow({
  name,
  prob,
  score,
  showScore,
  lead,
}: {
  name: string;
  prob: number | undefined;
  score: number | undefined;
  showScore: boolean;
  lead: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={clsx(
          "min-w-0 truncate text-[14px]",
          lead ? "font-semibold text-text-primary" : "text-text-secondary"
        )}
      >
        {name}
      </span>
      {showScore ? (
        <span className="tabular shrink-0 font-mono text-[18px] font-bold text-text-primary">
          {score ?? 0}
        </span>
      ) : (
        <span className="tabular shrink-0 font-mono text-[12px] text-text-muted">{pct(prob)}</span>
      )}
    </div>
  );
}

function MatchCard({ m }: { m: MatchFeedItem }) {
  const showScore = m.status !== "upcoming" && m.homeScore != null && m.awayScore != null;
  const homeLead = (m.homeProb ?? 0) >= (m.awayProb ?? 0);
  const body = (
    <div className="panel flex h-full flex-col gap-3 p-5 transition-colors hover:border-line">
      <div className="flex items-center justify-between">
        <StatusPill m={m} />
        {m.league && (
          <span className="truncate text-[11px] text-text-muted">{m.league}</span>
        )}
      </div>

      <div className="space-y-1.5">
        <TeamRow
          name={m.home}
          prob={m.homeProb}
          score={m.homeScore}
          showScore={showScore}
          lead={homeLead}
        />
        <TeamRow
          name={m.away}
          prob={m.awayProb}
          score={m.awayScore}
          showScore={showScore}
          lead={!homeLead}
        />
      </div>

      {/* Moneyline probability bar (home / draw / away) */}
      <div className="flex h-1.5 overflow-hidden rounded-full bg-bg-card">
        <div className="bg-accent" style={{ width: pct(m.homeProb) }} />
        {m.drawProb != null && (
          <div className="bg-text-muted/50" style={{ width: pct(m.drawProb) }} />
        )}
        <div className="bg-live" style={{ width: pct(m.awayProb) }} />
      </div>

      <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-text-muted">
        <span className="tabular font-mono">{vol(m.volume24hr) ? `${vol(m.volume24hr)} · 24h` : "—"}</span>
        {m.sourceUrl && <span className="font-mono">Polymarket ↗</span>}
      </div>
    </div>
  );

  return m.sourceUrl ? (
    <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
      {body}
    </a>
  ) : (
    body
  );
}

export function LiveMatchFeed() {
  const [matches, setMatches] = useState<MatchFeedItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        const data = (await res.json()) as { matches?: MatchFeedItem[] };
        if (alive && Array.isArray(data.matches)) setMatches(data.matches);
      } catch {
        if (alive) setMatches([]);
      }
    };
    void load();
    // Live scores move — refresh every 30s while the page is open.
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const liveCount = matches?.filter((m) => m.status === "live").length ?? 0;

  return (
    <section className="mx-auto max-w-[1180px] px-8 pt-24 pb-12">
      <div className="mb-10">
        <h2 className="section-title flex items-center gap-3">
          <span className="live-dot" />
          Live match feed
        </h2>
        <p className="section-sub mt-2">
          {liveCount > 0
            ? `${liveCount} live now · real odds from Polymarket`
            : "Real fixtures & odds from Polymarket · drives card prices"}
        </p>
      </div>

      {matches === null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel h-[140px] animate-pulse p-5" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="panel p-8 text-center text-[13px] text-text-secondary">
          No fixtures on the board right now. Check back closer to kickoff.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.slice(0, 6).map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </section>
  );
}
