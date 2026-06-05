import type {
  Card,
  League,
  LeagueEntry,
  LeagueMatch,
  LeagueTier,
} from "./types";
import { rarityWeight } from "./pricing";

// Deterministic PRNG — same seed always produces the same number.
function rand01(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Per-card strength: rare-and-longshot is more valuable in league play.
// `1.3 − impliedOdds` rewards underdog picks, weighted by rarity.
export function cardStrength(c: Pick<Card, "rarity" | "impliedOddsAtMint">): number {
  const base = rarityWeight[c.rarity];
  const longshot = Math.max(0.1, 1.3 - c.impliedOddsAtMint);
  return Number((base * longshot).toFixed(3));
}

export function lineupStrength(cards: Card[]): number {
  return Number(cards.reduce((s, c) => s + cardStrength(c), 0).toFixed(3));
}

// Round-by-round match score: lineup strength + bounded variance scaled to lineup size.
function matchScore(
  strength: number,
  lineupSize: number,
  seed: number
): number {
  const variance = (rand01(seed) - 0.5) * 2; // [-1, 1]
  const noise = variance * 0.35 * Math.sqrt(lineupSize);
  return Number((strength + noise).toFixed(3));
}

const BOT_NAMES = [
  "ChainSurfer", "VarOracle", "GoalLine", "PenaltyKing",
  "TopBin", "OffsideTrap", "DerbyDan", "MidfieldMaestro",
  "FrostbiteFC", "PixelPasser", "TheKopite", "NinetiethMinute",
  "ParlayPanda", "SettlementSam", "FoilFinder", "CleanSheetCo",
];

// Synthetic bot lineup strength baseline per tier.
// Bots' rosterPower drives match score; we vary it around tier midpoint.
function botBaselineStrength(tier: LeagueTier): number {
  if (tier === "bronze") return 12; // ~ 4-6 commons/rares
  if (tier === "silver") return 24;
  return 48; // champion: must include legendaries to compete
}

function botLineupSize(tier: LeagueTier, seed: number): number {
  // Bronze: 4-6, Silver: 5-7, Champion: 6-8
  const base = tier === "bronze" ? 4 : tier === "silver" ? 5 : 6;
  return base + Math.floor(rand01(seed) * 3);
}

export function generateBots(league: League, userEntryId: string): LeagueEntry[] {
  const out: LeagueEntry[] = [];
  const baseline = botBaselineStrength(league.tier);
  for (let i = 0; i < league.capacity - 1; i++) {
    const seed = hashString(league.id + ":bot:" + i);
    const handle = BOT_NAMES[(seed + i) % BOT_NAMES.length];
    const sizeSeed = seed * 13;
    const size = botLineupSize(league.tier, sizeSeed);
    // Bot strength: baseline ± up to 35%, scaled slightly by lineup size
    const skew = (rand01(seed * 7) - 0.5) * 0.7;
    const power = Number((baseline * (1 + skew) * (size / 5)).toFixed(2));
    out.push({
      id: `${league.id}:bot:${i}`,
      leagueId: league.id,
      ownerLabel: `${handle}.eth`,
      isUser: false,
      lineupCardIds: Array.from({ length: size }, (_, k) => `bot-card-${i}-${k}`),
      lineupStrength: power,
      rosterPower: power,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      balanceDelta: 0,
    });
  }
  // Push user entry placeholder reference — actual lineup attached by caller.
  // userEntryId is consumed when caller appends the user entry.
  void userEntryId;
  return out;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Round-robin pairings: classic circle method. With odd entries we add a bye.
// We pad to even and skip matches involving the bye index.
export function buildSchedule(entries: LeagueEntry[], rounds: number): LeagueMatch[] {
  const ids = entries.map((e) => e.id);
  const hasBye = ids.length % 2 === 1;
  if (hasBye) ids.push("__bye__");
  const n = ids.length;
  const fixed = ids[0];
  const rotating = ids.slice(1);
  const matches: LeagueMatch[] = [];
  const totalRounds = Math.min(rounds, n - 1);
  for (let r = 0; r < totalRounds; r++) {
    const round = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      const a = round[i];
      const b = round[n - 1 - i];
      if (a === "__bye__" || b === "__bye__") continue;
      const leagueId = entries[0].leagueId;
      matches.push({
        id: `${leagueId}:r${r + 1}:m${i}`,
        leagueId,
        round: r + 1,
        homeEntryId: a,
        awayEntryId: b,
        homeScore: 0,
        awayScore: 0,
        result: "draw",
      });
    }
    rotating.unshift(rotating.pop()!);
  }
  return matches;
}

// Play one round: mutate match scores + entry standings + balance deltas.
// `entryFee` drives win/loss bonuses.
export function playRound(
  entries: LeagueEntry[],
  matches: LeagueMatch[],
  round: number,
  entryFee: number,
  league: League
): { entries: LeagueEntry[]; matches: LeagueMatch[] } {
  const winBonus = Number((entryFee * 0.3).toFixed(2));
  const lossDebit = Number((entryFee * 0.1).toFixed(2));
  const byId = new Map(entries.map((e) => [e.id, { ...e }]));

  const updatedMatches = matches.map((m) => {
    if (m.round !== round) return m;
    const home = byId.get(m.homeEntryId)!;
    const away = byId.get(m.awayEntryId)!;
    const sizeHome = home.lineupCardIds.length;
    const sizeAway = away.lineupCardIds.length;
    const hs = matchScore(home.lineupStrength, sizeHome, hashString(m.id + ":h"));
    const as = matchScore(away.lineupStrength, sizeAway, hashString(m.id + ":a"));
    let result: LeagueMatch["result"];
    if (Math.abs(hs - as) < 0.4) result = "draw";
    else result = hs > as ? "home_win" : "away_win";

    if (result === "home_win") {
      home.wins++; home.points += 3; home.balanceDelta += winBonus;
      away.losses++; away.balanceDelta -= lossDebit;
    } else if (result === "away_win") {
      away.wins++; away.points += 3; away.balanceDelta += winBonus;
      home.losses++; home.balanceDelta -= lossDebit;
    } else {
      home.draws++; home.points += 1;
      away.draws++; away.points += 1;
    }
    byId.set(home.id, home);
    byId.set(away.id, away);

    return { ...m, homeScore: hs, awayScore: as, result };
  });

  void league;
  return { entries: Array.from(byId.values()), matches: updatedMatches };
}

// Sort by points desc, then goal-diff-ish (balanceDelta), then strength.
export function standings(entries: LeagueEntry[]): LeagueEntry[] {
  return [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.balanceDelta !== a.balanceDelta) return b.balanceDelta - a.balanceDelta;
    return b.lineupStrength - a.lineupStrength;
  });
}

// Championship distribution after all rounds played.
// Returns the USDT prize for the user given their final rank.
export function championshipPrize(
  rank: number, // 1-based
  entryFee: number,
  capacity: number
): number {
  const pot = entryFee * capacity;
  if (rank === 1) return Number((pot * 0.5).toFixed(2));
  if (rank === 2) return Number((pot * 0.25).toFixed(2));
  if (rank === 3) return Number((pot * 0.125).toFixed(2));
  if (rank === 4) return Number(entryFee.toFixed(2)); // entry back
  return 0; // 5-8 lose entry
}

export const tierLabel: Record<LeagueTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  champion: "Champion",
};

export function tierColor(tier: LeagueTier): string {
  if (tier === "bronze") return "#E8B547";
  if (tier === "silver") return "#9CA3AF";
  return "#B47CFF";
}
