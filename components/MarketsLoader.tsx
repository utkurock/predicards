"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

// Pulls real World Cup markets from /api/markets into the store on mount, then keeps
// them fresh on an interval. Renders nothing. The store falls back to mock markets,
// so a failed fetch is invisible to the user.
const REFRESH_MS = 3 * 60 * 1000; // 3 min — matches the route's cache window

export function MarketsLoader() {
  const setMarkets = useStore((s) => s.setMarkets);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/markets", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { markets?: unknown };
        if (!cancelled && Array.isArray(data.markets) && data.markets.length > 0) {
          setMarkets(data.markets as Parameters<typeof setMarkets>[0]);
        }
      } catch {
        /* keep the mock fallback */
      }
    };

    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [setMarkets]);

  return null;
}
