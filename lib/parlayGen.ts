// Parlay sets generated from the live market pool (real Polymarket markets once loaded,
// mock otherwise). Pure & deterministic — same markets always yield the same parlays —
// so the store can regenerate them on every refresh and only carry per-parlay status.

import type { Market, ParlaySet } from "./types";

// More improbable combos pay more. Bounded so payouts stay sane (matches the old 1.4–2.0).
function multiplierFor(markets: Market[]): number {
  const avgImprob =
    markets.reduce((s, m) => s + (1 - m.impliedProbability), 0) / markets.length;
  const mult = 1 + avgImprob * 1.6;
  return Math.round(Math.min(2.5, Math.max(1.3, mult)) * 100) / 100;
}

function build(
  id: string,
  name: string,
  description: string,
  markets: Market[],
  size: number
): ParlaySet | null {
  // De-dupe (a market can match more than one filter) and require a full set.
  const unique: Market[] = [];
  const seen = new Set<string>();
  for (const m of markets) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      unique.push(m);
    }
    if (unique.length === size) break;
  }
  if (unique.length < size) return null;
  return {
    id,
    name,
    description,
    requiredMarketIds: unique.map((m) => m.id),
    multiplier: multiplierFor(unique),
    status: "incomplete",
  };
}

const CONTINENT_RE = /continent|europe|africa|asia|south america|north america|oceania/i;

export function generateParlays(markets: Market[]): ParlaySet[] {
  const byProbDesc = [...markets].sort((a, b) => b.impliedProbability - a.impliedProbability);
  const tournament = byProbDesc.filter((m) => m.category === "tournament");
  const team = byProbDesc.filter((m) => m.category === "team");
  const player = byProbDesc.filter((m) => m.category === "player");
  const continental = byProbDesc.filter((m) => CONTINENT_RE.test(m.statement));
  const longshots = [...markets]
    .filter((m) => m.impliedProbability < 0.15)
    .sort((a, b) => a.impliedProbability - b.impliedProbability);

  // Title contenders skip continent markets so they don't overlap the continental set.
  const titleContenders = tournament.filter((m) => !CONTINENT_RE.test(m.statement));

  return [
    build(
      "pl_contenders",
      "Title Contenders",
      "The favorites to lift the trophy — collect all and they must all win.",
      titleContenders,
      4
    ),
    build(
      "pl_groupwinners",
      "Group Stage Favorites",
      "Back the favorites to top their groups.",
      team,
      4
    ),
    build(
      "pl_goldenboot",
      "Golden Boot Race",
      "Stack the top-goalscorer contenders into one bundle.",
      player,
      3
    ),
    build(
      "pl_continental",
      "Continental Powers",
      "Which continent goes all the way — a mixed bundle.",
      continental,
      3
    ),
    build(
      "pl_darkhorses",
      "Dark Horses",
      "Three longshots. High risk, enormous reward.",
      longshots,
      3
    ),
  ].filter((p): p is ParlaySet => p !== null);
}
