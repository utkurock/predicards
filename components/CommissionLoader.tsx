"use client";

import { useEffect } from "react";
import { startCommissionFeed } from "@/lib/commissionStore";

// Keeps the global per-market commission ledger (marketStats) subscribed for everyone —
// the public markets page and the claim flow both read from it. Renders nothing.
export function CommissionLoader() {
  useEffect(() => startCommissionFeed(), []);
  return null;
}
