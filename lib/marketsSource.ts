// Runtime market registry. Starts as the bundled mock markets (so SSR and the first
// paint always have data) and gets replaced with live Polymarket markets once the
// client fetches /api/markets. Non-React consumers (e.g. packLogic) read getMarkets().

import type { Market } from "./types";
import { markets as mockMarkets } from "./mockData/markets";

let registry: Market[] = mockMarkets;

export function getMarkets(): Market[] {
  return registry;
}

// Replace the registry with live data. Ignores empty payloads so a failed/empty
// fetch never wipes the working mock fallback.
export function setMarketsRegistry(next: Market[]): void {
  if (Array.isArray(next) && next.length > 0) registry = next;
}

export { mockMarkets };
