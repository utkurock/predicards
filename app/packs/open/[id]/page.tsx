"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { packs } from "@/lib/mockData/packs";
import { openPack } from "@/lib/packLogic";
import { recordMint } from "@/lib/commissionStore";
import { useStore } from "@/lib/store";
import { CardComponent } from "@/components/Card";
import { PackArt } from "@/components/PackArt";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { useToast } from "@/components/Toaster";
import { rarityWeight, rarityLabel } from "@/lib/pricing";
import type { Card as CardType } from "@/lib/types";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";

export default function PackOpenPage() {
  return (
    <HydrationGate requireWallet>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const addCards = useStore((s) => s.addCards);
  const spend = useStore((s) => s.spend);
  const balance = useStore((s) => s.balance);
  const toast = useToast((s) => s.push);
  const pack = useMemo(() => packs.find((p) => p.id === params.id), [params.id]);

  const [stage, setStage] = useState<"intro" | "tear" | "reveal" | "summary">("intro");
  const [cards, setCards] = useState<CardType[]>([]);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [opened, setOpened] = useState(false);
  const hasLegendary = cards.some((c) => c.rarity === "legendary" || c.rarity === "mythic");

  // Payment and card grant are coupled here: you pay exactly once, when you tear
  // the pack open, and the cards are added to your album the same instant. This
  // closes the "free pack via direct URL", "reroll by refresh", and "pay then lose
  // cards by leaving" holes.
  const tearOpen = () => {
    if (opened || !pack) return;
    if (!spend(pack.price)) {
      toast(`Need ${pack.price} USDT to open this pack.`, "error");
      router.replace("/packs");
      return;
    }
    const pulled = recordMint(openPack(pack));
    setCards(pulled);
    addCards(pulled);
    setOpened(true);
    setStage("tear");
  };

  // Auto-advance reveal one card at a time
  useEffect(() => {
    if (stage !== "reveal") return;
    if (revealedIndex >= cards.length - 1) {
      const t = setTimeout(() => setStage("summary"), 700);
      return () => clearTimeout(t);
    }
    const next = revealedIndex + 1;
    const isHigh = cards[next] && rarityWeight[cards[next].rarity] >= 4;
    const t = setTimeout(() => setRevealedIndex(next), isHigh ? 900 : 500);
    return () => clearTimeout(t);
  }, [stage, revealedIndex, cards]);

  if (!pack) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center text-text-secondary">
        Pack not found.
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Backdrop flash on legendary reveal */}
      <AnimatePresence>
        {stage === "reveal" && revealedIndex >= 0 && cards[revealedIndex] && rarityWeight[cards[revealedIndex].rarity] >= 4 && (
          <motion.div
            key={`flash-${revealedIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="pointer-events-none absolute inset-0 z-0 bg-gradient-radial from-rarity-legendary/20 via-rarity-legendary/5 to-transparent"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">
              Opening
            </div>
            <div className="text-lg font-semibold capitalize">{pack.tier} pack</div>
          </div>
          <div className="text-xs text-text-muted">
            {pack.cardCount} cards · {pack.guaranteed}
          </div>
        </div>

        {/* Stage: intro - pack centered with tear button */}
        <AnimatePresence mode="wait">
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center gap-8 py-12"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-72"
              >
                <PackArt tier={pack.tier} />
              </motion.div>
              {balance < pack.price ? (
                <div className="flex flex-col items-center gap-3">
                  <Button size="lg" disabled>
                    Insufficient balance
                  </Button>
                  <Link href="/packs" className="text-xs text-text-secondary hover:text-text-primary">
                    ← Back to pack store
                  </Link>
                </div>
              ) : (
                <Button size="lg" onClick={tearOpen}>
                  Tear open · {pack.price} USDT <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <p className="max-w-md text-center text-xs text-text-muted">
                You&rsquo;re charged {pack.price} USDT when you tear the pack. Cards land in your
                album instantly. Higher rarities animate slower so you can savor the moment.
              </p>
            </motion.div>
          )}

          {stage === "tear" && (
            <motion.div
              key="tear"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-8 py-12"
              onAnimationComplete={() => {
                setTimeout(() => {
                  setStage("reveal");
                }, 600);
              }}
            >
              <div className="relative w-72">
                <motion.div
                  initial={{ rotate: 0, scale: 1 }}
                  animate={{ rotate: -6, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                >
                  <PackArt tier={pack.tier} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white via-white/60 to-transparent mix-blend-overlay"
                />
              </div>
              <div className="text-xs uppercase tracking-wider text-text-secondary">
                Foil tearing…
              </div>
            </motion.div>
          )}

          {stage === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="text-center text-xs uppercase tracking-wider text-text-muted">
                Revealing {revealedIndex + 1} / {cards.length}
              </div>
              <div
                className={`mx-auto grid max-w-5xl gap-4 ${
                  cards.length <= 5 ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                }`}
              >
                {cards.map((card, i) => (
                  <FlipCard key={card.id} card={card} revealed={i <= revealedIndex} />
                ))}
              </div>
            </motion.div>
          )}

          {stage === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Layers3 className="h-5 w-5 text-accent" />
                <h2 className="section-title">Pack opened</h2>
                <p className="text-sm text-text-secondary">
                  {cards.length} cards added to your album.
                </p>
                {hasLegendary && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-rarity-legendary/40 bg-rarity-legendary/10 px-3 py-1 text-xs text-rarity-legendary">
                    Legendary pull
                  </div>
                )}
              </div>

              <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {cards.map((card) => (
                  <CardComponent key={card.id} card={card} compact />
                ))}
              </div>

              <div className="mx-auto max-w-md space-y-2 panel p-4 text-sm">
                <div className="text-xs uppercase tracking-wider text-text-muted">Summary</div>
                {(["mythic", "legendary", "epic", "rare", "common"] as const).map((r) => {
                  const n = cards.filter((c) => c.rarity === r).length;
                  if (n === 0) return null;
                  return (
                    <div key={r} className="flex items-center justify-between">
                      <span className="text-text-secondary">{rarityLabel[r]}</span>
                      <span className="tabular font-mono">×{n}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => router.push("/album")} size="lg">
                  View album <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/packs">
                  <Button variant="outline" size="lg">
                    Open another
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FlipCard({ card, revealed }: { card: CardType; revealed: boolean }) {
  return (
    <div className="[perspective:1200px]">
      <motion.div
        initial={false}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[3/4] w-full [transform-style:preserve-3d]"
      >
        {/* Back */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-gradient-to-br from-bg-elev to-bg-card">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "repeating-linear-gradient(135deg, rgba(0,210,106,0.15) 0 1px, transparent 1px 12px)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">
                  Predicards
                </div>
                <div className="mt-1 text-[42px] font-black text-accent">P</div>
              </div>
            </div>
          </div>
        </div>

        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardComponent card={card} compact />
        </div>
      </motion.div>
    </div>
  );
}
