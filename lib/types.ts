export type Category = "tournament" | "team" | "player" | "match" | "wild";
export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type PackTier = "bronze" | "silver" | "gold" | "champion";

export type MarketStatus = "open" | "live" | "resolved_yes" | "resolved_no";
export type CardStatus =
  | "in_album"
  | "listed"
  | "locked_in_parlay"
  | "locked_in_league"
  | "settled_won"
  | "settled_lost"
  | "burned";

export type Market = {
  id: string;
  statement: string;
  category: Category;
  impliedProbability: number;
  resolutionDate: string;
  status: MarketStatus;
  rarity: Rarity;
  // ─── Optional Polymarket provenance (present when sourced from the live API) ───
  imageUrl?: string;   // market art from Polymarket
  sourceUrl?: string;  // polymarket.com/market/{slug} — we're the middleman, link back
  volume?: number;     // total USD volume traded on Polymarket
  volume24hr?: number; // last-24h USD volume (drives the yield estimate)
  change24h?: number;  // 24h price change (percentage points)
};

export type Card = {
  id: string;
  marketId: string;
  statement: string;
  category: Category;
  rarity: Rarity;
  editionNumber: number;
  editionTotal: number;
  impliedOddsAtMint: number;
  currentMarketPrice: number;
  potentialPayout: number;
  resolutionDate: string;
  ownerId: string;
  status: CardStatus;
  mintedAt: string;
  imageUrl?: string; // Polymarket market art, carried through from the source market
  // ─── Commission accounting (staking-style checkpoints) ───
  commissionBase?: number; // market's accPerCard at mint/last-claim (in-app fee share)
  volumeBase?: number;     // Polymarket volume at mint/last-claim (passive yield)
};

export type Pack = {
  id: string;
  tier: PackTier;
  price: number;
  cardCount: number;
  description: string;
  guaranteed: string;
  dropRates: Record<Rarity, number>;
};

export type ParlaySet = {
  id: string;
  name: string;
  description: string;
  requiredMarketIds: string[];
  multiplier: number;
  status: "incomplete" | "ready" | "activated" | "settled_won" | "settled_lost";
};

export type MarketListing = {
  id: string;
  card: Card;
  sellerId: string;
  price: number;
  change24h: number;
  listedAt: string;
};

export type MatchResult = {
  id: string;
  matchup: string;
  result: string;
  date: string;
  note: string;
};

export type LeagueTier = "bronze" | "silver" | "champion";
export type LeagueStatus = "open" | "live" | "finished";

export type League = {
  id: string;
  date: string; // ISO date — one league per tier per day
  tier: LeagueTier;
  name: string;
  entryFee: number;
  rounds: number;
  capacity: number; // total entries including user
  minLineup: number;
  maxLineup: number;
  status: LeagueStatus;
};

export type LeagueEntry = {
  id: string;
  leagueId: string;
  ownerLabel: string; // "You" or bot handle
  isUser: boolean;
  lineupCardIds: string[]; // for user — real card ids; for bot — synthetic ids
  // For bots we cache an inferred strength so we don't recompute per match
  lineupStrength: number;
  rosterPower: number; // sum of card strengths, displayed in UI
  wins: number;
  draws: number;
  losses: number;
  points: number; // 3W/1D
  balanceDelta: number; // running per-round PnL for THIS entry within the league
};

export type LeagueMatch = {
  id: string;
  leagueId: string;
  round: number;
  homeEntryId: string;
  awayEntryId: string;
  homeScore: number;
  awayScore: number;
  result: "home_win" | "away_win" | "draw";
};

export type LeagueState = {
  leagueId: string;
  status: LeagueStatus;
  entries: LeagueEntry[];
  matches: LeagueMatch[];
  currentRound: number; // 0 = not started, 1..rounds = played up to this
  userEntryId: string | null;
  claimed: boolean; // championship payout claimed
};
