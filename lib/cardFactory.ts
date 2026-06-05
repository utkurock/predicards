import type { Card, Market, Rarity } from "./types";
import { baseMintPrice, cardValue, editionTotal, potentialPayout, simulateMarketPrice } from "./pricing";

export function makeCard(market: Market, rarity: Rarity, seed: number, ownerId = "user"): Card {
  const mintPrice = baseMintPrice(rarity, market.impliedProbability);
  const total = editionTotal[rarity];
  const editionNumber = 1 + Math.floor((seed % total));
  return {
    id: `c_${market.id}_${rarity}_${seed}`,
    marketId: market.id,
    statement: market.statement,
    category: market.category,
    rarity,
    editionNumber,
    editionTotal: total,
    impliedOddsAtMint: mintPrice,
    // Tradeable value drifts around the card's canonical rarity value (USDT),
    // so marketplace prices and vault buyback stay coherent with pack economics.
    currentMarketPrice: simulateMarketPrice(cardValue(rarity), seed),
    potentialPayout: potentialPayout(rarity),
    resolutionDate: market.resolutionDate,
    ownerId,
    status: "in_album",
    mintedAt: new Date(2026, 4, 1 + (seed % 20)).toISOString(),
    imageUrl: market.imageUrl,
    // Commission checkpoints: start earning Polymarket yield from this volume onward.
    // commissionBase is set when the mint is recorded against the market's live ledger.
    volumeBase: market.volume,
  };
}
