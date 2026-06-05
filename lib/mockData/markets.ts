import type { Market } from "../types";

export const markets: Market[] = [
  // Tournament outcomes
  { id: "m1", statement: "Brazil wins the World Cup", category: "tournament", impliedProbability: 0.14, resolutionDate: "2026-07-19", status: "live", rarity: "epic" },
  { id: "m2", statement: "Argentina wins the World Cup", category: "tournament", impliedProbability: 0.11, resolutionDate: "2026-07-19", status: "live", rarity: "epic" },
  { id: "m3", statement: "France wins the World Cup", category: "tournament", impliedProbability: 0.13, resolutionDate: "2026-07-19", status: "live", rarity: "epic" },
  { id: "m4", statement: "Saudi Arabia reaches quarterfinal", category: "tournament", impliedProbability: 0.04, resolutionDate: "2026-07-11", status: "open", rarity: "legendary" },
  { id: "m5", statement: "An African team reaches semifinal", category: "tournament", impliedProbability: 0.12, resolutionDate: "2026-07-14", status: "open", rarity: "epic" },
  { id: "m6", statement: "All four semifinalists are non-European", category: "tournament", impliedProbability: 0.03, resolutionDate: "2026-07-14", status: "open", rarity: "legendary" },

  // Team progression
  { id: "m7", statement: "Brazil advances from group stage", category: "team", impliedProbability: 0.82, resolutionDate: "2026-06-23", status: "live", rarity: "common" },
  { id: "m8", statement: "Argentina reaches semifinal", category: "team", impliedProbability: 0.28, resolutionDate: "2026-07-14", status: "live", rarity: "rare" },
  { id: "m9", statement: "Germany is eliminated in group stage", category: "team", impliedProbability: 0.22, resolutionDate: "2026-06-23", status: "live", rarity: "rare" },
  { id: "m10", statement: "USA reaches quarterfinal", category: "team", impliedProbability: 0.24, resolutionDate: "2026-07-11", status: "open", rarity: "rare" },
  { id: "m11", statement: "Germany reaches semifinal", category: "team", impliedProbability: 0.18, resolutionDate: "2026-07-14", status: "live", rarity: "rare" },
  { id: "m12", statement: "France reaches semifinal", category: "team", impliedProbability: 0.31, resolutionDate: "2026-07-14", status: "live", rarity: "rare" },
  { id: "m13", statement: "Brazil reaches semifinal", category: "team", impliedProbability: 0.34, resolutionDate: "2026-07-14", status: "live", rarity: "rare" },
  { id: "m14", statement: "Argentina wins at least one group match", category: "team", impliedProbability: 0.92, resolutionDate: "2026-06-23", status: "live", rarity: "common" },

  // Player props
  { id: "m15", statement: "Mbappé scores at least 1 goal in group stage", category: "player", impliedProbability: 0.78, resolutionDate: "2026-06-23", status: "live", rarity: "common" },
  { id: "m16", statement: "Mbappé scores 5+ goals in the tournament", category: "player", impliedProbability: 0.18, resolutionDate: "2026-07-19", status: "live", rarity: "rare" },
  { id: "m17", statement: "Mbappé wins both Golden Ball and Golden Boot", category: "player", impliedProbability: 0.04, resolutionDate: "2026-07-19", status: "live", rarity: "legendary" },
  { id: "m18", statement: "Vinícius Jr. scores 3+ goals in the tournament", category: "player", impliedProbability: 0.26, resolutionDate: "2026-07-19", status: "live", rarity: "rare" },
  { id: "m19", statement: "Messi scores 5+ goals in the tournament", category: "player", impliedProbability: 0.11, resolutionDate: "2026-07-19", status: "live", rarity: "epic" },
  { id: "m20", statement: "Yamal records 2+ assists in tournament", category: "player", impliedProbability: 0.29, resolutionDate: "2026-07-19", status: "live", rarity: "rare" },
  { id: "m21", statement: "Bellingham receives a yellow card", category: "player", impliedProbability: 0.55, resolutionDate: "2026-07-19", status: "live", rarity: "common" },
  { id: "m22", statement: "Musiala wins Best Young Player", category: "player", impliedProbability: 0.09, resolutionDate: "2026-07-19", status: "open", rarity: "epic" },

  // Match outcomes
  { id: "m23", statement: "Brazil vs Germany: first goal before 30th minute", category: "match", impliedProbability: 0.48, resolutionDate: "2026-06-18", status: "open", rarity: "common" },
  { id: "m24", statement: "France vs Spain: Mbappé scores 2+ goals", category: "match", impliedProbability: 0.21, resolutionDate: "2026-06-20", status: "open", rarity: "rare" },
  { id: "m25", statement: "Both teams score: England vs Netherlands", category: "match", impliedProbability: 0.61, resolutionDate: "2026-06-19", status: "open", rarity: "common" },

  // Wild scenarios
  { id: "m26", statement: "A goalkeeper scores in the tournament", category: "wild", impliedProbability: 0.05, resolutionDate: "2026-07-19", status: "open", rarity: "legendary" },
  { id: "m27", statement: "A hat-trick is scored in the Final", category: "wild", impliedProbability: 0.03, resolutionDate: "2026-07-19", status: "open", rarity: "legendary" },
  { id: "m28", statement: "The Final ends 0-0 in 90 minutes", category: "wild", impliedProbability: 0.06, resolutionDate: "2026-07-19", status: "open", rarity: "legendary" },
  { id: "m29", statement: "A team reaches the Final without conceding", category: "wild", impliedProbability: 0.008, resolutionDate: "2026-07-19", status: "open", rarity: "mythic" },
  { id: "m30", statement: "Highest-scoring WC match record is broken", category: "wild", impliedProbability: 0.007, resolutionDate: "2026-07-19", status: "open", rarity: "mythic" },
];
