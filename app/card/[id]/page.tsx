"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useCommission } from "@/lib/commissionStore";
import { listCardForSale, unlistCardFromSale } from "@/lib/market";
import { CardComponent } from "@/components/Card";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { ArrowLeft, Flame, Tag, X, Coins, Landmark } from "lucide-react";
import { RarityBadge } from "@/components/RarityBadge";
import { useToast } from "@/components/Toaster";
import { fairValueEstimate, rarityLabel, vaultBuyback } from "@/lib/pricing";
import { claimableForCard, estDailyYieldPerCard, isEarningCard } from "@/lib/commission";

export default function CardDetail() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const collection = useStore((s) => s.collection);
  const markets = useStore((s) => s.markets);
  const burnCards = useStore((s) => s.burnCards);
  const sellToVault = useStore((s) => s.sellToVault);
  const claimCard = useStore((s) => s.claimCardCommission);
  const stats = useCommission((s) => s.stats);
  const toast = useToast((s) => s.push);

  const card = useMemo(() => collection.find((c) => c.id === params.id), [collection, params.id]);
  const [listPrice, setListPrice] = useState<string>("");
  const [busy, setBusy] = useState(false);

  if (!card) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center text-text-secondary">
        Card not found in your collection.
      </div>
    );
  }

  const fv = fairValueEstimate(card);
  const isLocked = card.status === "locked_in_parlay";
  const isSettled = card.status === "settled_won" || card.status === "settled_lost";

  // Commission this card earns from its market (prediction yield + secondary-sale fees).
  const cardMarket = markets.find((m) => m.id === card.marketId);
  const cardStat = stats[card.marketId] ?? { supply: 0, accPerCard: 0 };
  const earning = isEarningCard(card);
  const claimable = earning ? claimableForCard(card, cardMarket, cardStat) : 0;
  const dailyYield = estDailyYieldPerCard(cardMarket, cardStat);

  const handleClaimCard = () => {
    const got = claimCard(card.id);
    if (got > 0) toast(`Claimed ${got.toFixed(2)} USDT from this card.`, "success");
    else toast("Nothing to claim on this card yet.", "info");
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/album" className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to album
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[420px_1fr]">
        {/* Card preview */}
        <div className="space-y-4">
          <CardComponent card={card} />
          <div className="rounded-lg border border-line-subtle bg-bg-card p-3 text-xs text-text-secondary">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">Card ID</div>
            <div className="font-mono text-[11px] text-text-primary">{card.id}</div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-8">
          {/* Statement */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <RarityBadge rarity={card.rarity} />
              <span className="font-mono text-[10px] uppercase text-text-muted">{card.category}</span>
            </div>
            <h1 className="section-title">{card.statement}</h1>
          </div>

          {/* Dual sections */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Section title="As a collectible">
              <Row label="Rarity tier" value={rarityLabel[card.rarity]} />
              <Row label="Edition" value={`#${card.editionNumber} of ${card.editionTotal}`} mono />
              <Row label="Minted" value={new Date(card.mintedAt).toLocaleDateString()} />
              <Row label="Status" value={statusLabel(card.status)} />
            </Section>
            <Section title="As a prediction">
              <Row label="Implied odds (mint)" value={`${(card.impliedOddsAtMint * 100).toFixed(2)}%`} mono />
              <Row label="Current market price" value={`${card.currentMarketPrice} USDT`} mono />
              <Row label="Potential payout" value={`${card.potentialPayout} USDT`} mono accent />
              <Row label="Resolution" value={card.resolutionDate} mono />
            </Section>
          </div>

          {/* Commission this card earns */}
          <Section title="Commission">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Row label="Claimable now" value={`${claimable.toFixed(3)} USDT`} mono accent />
                <Row label="Est. yield / day" value={`${dailyYield.toFixed(3)} USDT`} mono />
                <Row
                  label="Holders sharing"
                  value={`${cardStat.supply || 1} card${(cardStat.supply || 1) === 1 ? "" : "s"}`}
                  mono
                />
              </div>
              {earning && (
                <Button onClick={handleClaimCard} disabled={claimable <= 0} variant="outline">
                  <Coins className="h-4 w-4" /> Claim
                </Button>
              )}
            </div>
            <p className="mt-2 text-[10px] italic text-text-muted">
              Earns a share of this market&apos;s Polymarket volume plus a cut of every secondary
              sale, split equally across holders.
            </p>
          </Section>

          {/* Mini market depth — illustrative only (no live order book in this prototype) */}
          <Section title="Market depth">
            <div className="flex h-24 items-end gap-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const h = 30 + Math.abs(Math.sin(i * 1.7 + card.id.length)) * 70;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-line transition-colors hover:bg-line-bright"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-text-muted">
              <span>Mint price {card.impliedOddsAtMint} USDT</span>
              <span>Fair value est. {fv.toFixed(3)} USDT</span>
            </div>
            <p className="mt-1.5 text-[10px] italic text-text-muted">Illustrative — no live order book in this prototype.</p>
          </Section>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {card.status === "in_album" && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder={`Price (current ${card.currentMarketPrice})`}
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="h-10 w-48 rounded-lg border border-line bg-bg-card px-3 text-sm font-mono outline-none focus:border-accent"
                  />
                  <Button
                    disabled={busy}
                    onClick={async () => {
                      const price = parseFloat(listPrice) || card.currentMarketPrice;
                      setBusy(true);
                      try {
                        const claimed = await listCardForSale(card, price);
                        toast(
                          claimed > 0
                            ? `Listed at ${price} USDT. Claimed ${claimed.toFixed(2)} commission first.`
                            : `Listed at ${price} USDT.`,
                          "success"
                        );
                        setListPrice("");
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Could not list.", "error");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Tag className="h-4 w-4" /> {busy ? "Listing…" : "List on market"}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const price = vaultBuyback(card.rarity);
                    if (confirm(`Sell to the vault for ${price} USDT? (15% below value)`)) {
                      const paid = sellToVault(card.id);
                      toast(`Sold to vault for ${paid.toFixed(2)} USDT.`, "success");
                      router.push("/album");
                    }
                  }}
                >
                  <Landmark className="h-4 w-4" /> Sell to vault · {vaultBuyback(card.rarity)} USDT
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm("Burn this card? This cannot be undone.")) {
                      burnCards([card.id]);
                      toast("Card burned.", "info");
                      router.push("/forge");
                    }
                  }}
                >
                  <Flame className="h-4 w-4" /> Burn
                </Button>
                <Link href="/forge">
                  <Button variant="outline">Send to forge</Button>
                </Link>
              </>
            )}
            {card.status === "listed" && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await unlistCardFromSale(card.id);
                    toast("Listing removed.", "info");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Could not remove listing.", "error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <X className="h-4 w-4" /> Remove listing
              </Button>
            )}
            {isLocked && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-text-secondary">
                This card is locked in an active parlay. Actions resume once the parlay resolves.
              </div>
            )}
            {isSettled && (
              <div className="rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-text-secondary">
                Settled {card.status === "settled_won" ? "YES — payout credited." : "NO — position closed."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 panel p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`${mono ? "font-mono tabular" : ""} ${accent ? "text-accent font-semibold" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "in_album": return "In album";
    case "listed": return "Listed";
    case "locked_in_parlay": return "Locked (parlay)";
    case "settled_won": return "Settled YES";
    case "settled_lost": return "Settled NO";
    default: return s;
  }
}
