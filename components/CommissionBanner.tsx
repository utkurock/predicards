"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useCommission } from "@/lib/commissionStore";
import { useWallet } from "@/components/WalletProvider";
import { useToast } from "@/components/Toaster";
import { Button } from "@/components/Button";
import { claimableForCard, isEarningCard } from "@/lib/commission";
import { Coins } from "lucide-react";

// Shared "you're earning commission" banner with a live claimable total + Claim button.
// Used on the public markets page and the album.
export function CommissionBanner() {
  const collection = useStore((s) => s.collection);
  const markets = useStore((s) => s.markets);
  const claim = useStore((s) => s.claimCommission);
  const stats = useCommission((s) => s.stats);
  const { status } = useWallet();
  const toast = useToast((s) => s.push);

  const earningCount = collection.filter(isEarningCard).length;

  const claimable = useMemo(() => {
    if (status !== "connected") return 0;
    let total = 0;
    for (const c of collection) {
      if (!isEarningCard(c)) continue;
      const market = markets.find((m) => m.id === c.marketId);
      total += claimableForCard(c, market, stats[c.marketId] ?? { supply: 0, accPerCard: 0 });
    }
    return total;
  }, [collection, markets, stats, status]);

  const handleClaim = () => {
    const got = claim();
    if (got > 0) toast(`Claimed ${got.toFixed(2)} USDT in commission.`, "success");
    else toast("Nothing to claim yet — earn as your markets trade.", "info");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
          <Coins className="h-5 w-5 text-accent" />
        </div>
        <div>
          <div className="text-sm font-semibold">
            {status === "connected"
              ? `You're earning commission on ${earningCount} card${earningCount === 1 ? "" : "s"}`
              : "Hold cards, earn commission"}
          </div>
          <div className="text-xs text-text-secondary">
            {status === "connected" ? (
              <>
                Claimable now:{" "}
                <span className="tabular font-mono text-accent">{claimable.toFixed(2)} USDT</span>
              </>
            ) : (
              "Connect your wallet and open a pack to start earning from trading volume."
            )}
          </div>
        </div>
      </div>
      {status === "connected" ? (
        <Button onClick={handleClaim} disabled={claimable <= 0}>
          Claim commission
        </Button>
      ) : (
        <Link href="/packs">
          <Button>Open a pack</Button>
        </Link>
      )}
    </div>
  );
}
