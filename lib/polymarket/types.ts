// Raw shapes returned by Polymarket's public Gamma API (gamma-api.polymarket.com).
// Only the subset of fields we actually consume is typed here. Numeric fields often
// arrive as strings, and outcomes/prices/tokenIds are JSON-encoded strings.

export type GammaMarket = {
  id: string;
  question?: string;
  outcomes?: string; // JSON string, e.g. '["Yes","No"]'
  outcomePrices?: string; // JSON string, e.g. '["0.17","0.83"]'
  clobTokenIds?: string; // JSON string of two token ids
  endDate?: string;
  startDate?: string;
  closed?: boolean;
  active?: boolean;
  acceptingOrders?: boolean;
  image?: string;
  icon?: string;
  slug?: string;
  volume?: string;
  volumeNum?: number;
  volume24hr?: number;
  liquidity?: string;
  lastTradePrice?: number;
  oneDayPriceChange?: number;
  groupItemTitle?: string;
};

export type GammaTag = {
  id?: string;
  slug?: string;
  label?: string;
};

export type GammaSeries = {
  title?: string;
  slug?: string;
};

export type GammaEvent = {
  id: string;
  title?: string;
  slug?: string;
  closed?: boolean;
  active?: boolean;
  volume?: number;
  volume24hr?: number;
  tags?: GammaTag[];
  markets?: GammaMarket[];
  // ─── Live-game fields (present on sports "match" events) ───
  startDate?: string;
  endDate?: string;
  live?: boolean;
  ended?: boolean;
  score?: string; // "2-1" (home-away) for soccer; "g-g|s-s|Bo5" for esports
  period?: string; // "1H" | "2H" | "HT" | "FT" | "SUS" …
  elapsed?: string | number; // minutes played
  image?: string;
  series?: GammaSeries[]; // league/competition, e.g. [{ title: "La Liga 2" }]
};
