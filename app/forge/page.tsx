"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { CardComponent } from "@/components/Card";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { Flame, ArrowRight, RotateCw, ChevronDown } from "lucide-react";
import { useToast } from "@/components/Toaster";
import { rarityLabel, rarityWeight } from "@/lib/pricing";
import { forgeCard } from "@/lib/packLogic";
import { recordMint } from "@/lib/commissionStore";
import type { Card, Rarity } from "@/lib/types";

export default function ForgePage() {
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const collection = useStore((s) => s.collection);
  const burnCards = useStore((s) => s.burnCards);
  const addCards = useStore((s) => s.addCards);
  const toast = useToast((s) => s.push);

  const [selected, setSelected] = useState<string[]>([]);
  const [stage, setStage] = useState<"idle" | "forging" | "result">("idle");
  const [result, setResult] = useState<Card | null>(null);

  const selectedCards = selected.map((id) => collection.find((c) => c.id === id)).filter(Boolean) as Card[];
  const sameRarity =
    selectedCards.length === 3 && selectedCards.every((c) => c.rarity === selectedCards[0].rarity);
  const sourceRarity: Rarity | null = sameRarity ? selectedCards[0].rarity : null;

  const groupedByRarity = useMemo(() => {
    const g: Record<Rarity, Card[]> = { common: [], rare: [], epic: [], legendary: [], mythic: [] };
    for (const c of collection) {
      if (c.status === "in_album") g[c.rarity].push(c);
    }
    return g;
  }, [collection]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleForge = () => {
    if (!sourceRarity) return;
    setStage("forging");
    setTimeout(() => {
      const [newCard] = recordMint([forgeCard(sourceRarity)]);
      burnCards(selected);
      addCards([newCard]);
      setResult(newCard);
      setStage("result");
      toast(`Forged a ${rarityLabel[newCard.rarity]}.`, "success");
    }, 2200);
  };

  const reset = () => {
    setSelected([]);
    setStage("idle");
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title">Forge</h1>
        <p className="section-sub mt-1.5">Burn 3 same-rarity cards / Mint 1 of the next tier</p>
      </div>

      {/* Forge interface */}
      <div className="mb-12 panel p-6">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          {/* Slots */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((slot) => {
              const card = selectedCards[slot];
              return (
                <div
                  key={slot}
                  className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-dashed ${
                    card ? "border-line bg-transparent" : "border-line-subtle bg-bg-base/40"
                  }`}
                >
                  {card ? (
                    <button onClick={() => toggle(card.id)} className="absolute inset-0">
                      <CardComponent card={card} compact />
                    </button>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-muted">
                      Slot {slot + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center: arrow + forge button */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Forge</div>
              <div className="mt-1 text-sm">
                {sourceRarity ? `${rarityLabel[sourceRarity]} → ?` : "Pick 3 cards"}
              </div>
            </div>
            <AnimatePresence mode="wait">
              {stage === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button
                    onClick={handleForge}
                    disabled={!sameRarity}
                    size="lg"
                  >
                    <Flame className="h-4 w-4" /> Forge
                  </Button>
                </motion.div>
              )}
              {stage === "forging" && (
                <motion.div
                  key="forging"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="relative h-16 w-16 rounded-full border-2 border-accent/40"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-radial from-accent/40 via-accent/10 to-transparent" />
                    <Flame className="absolute inset-0 m-auto h-6 w-6 text-accent" />
                  </motion.div>
                  <div className="text-xs uppercase tracking-wider text-text-secondary">Forging…</div>
                </motion.div>
              )}
              {stage === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <ArrowRight className="h-5 w-5 text-accent" />
                  <Button onClick={reset} variant="outline" size="sm">
                    <RotateCw className="h-3.5 w-3.5" /> Forge again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result */}
          <div className="aspect-[3/4]">
            {result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <CardComponent card={result} />
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-line-subtle bg-bg-base/40 text-xs text-text-muted">
                Result appears here
              </div>
            )}
          </div>
        </div>

        {/* Probabilities */}
        {sourceRarity && (
          <div className="mt-6 grid grid-cols-1 gap-2 rounded-lg border border-line-subtle bg-bg-base p-3 text-xs sm:grid-cols-3">
            {sourceRarity === "common" && (
              <>
                <Prob label="→ Rare" pct={70} />
                <Prob label="→ Epic" pct={25} />
                <Prob label="→ Legendary" pct={5} />
              </>
            )}
            {sourceRarity === "rare" && (
              <>
                <Prob label="→ Epic" pct={65} />
                <Prob label="→ Legendary" pct={30} />
                <Prob label="→ Mythic" pct={5} />
              </>
            )}
            {sourceRarity === "epic" && (
              <>
                <Prob label="→ Legendary" pct={80} />
                <Prob label="→ Mythic" pct={20} />
              </>
            )}
            {(sourceRarity === "legendary" || sourceRarity === "mythic") && (
              <Prob label={`${rarityLabel[sourceRarity]} cannot be forged higher`} pct={0} />
            )}
          </div>
        )}
      </div>

      {/* Card picker grouped by rarity */}
      <div className="space-y-6">
        {(["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).map((r) => {
          const list = groupedByRarity[r];
          if (list.length === 0) return null;
          return (
            <section key={r}>
              <h3 className="mb-3 text-sm font-semibold text-text-secondary">
                {rarityLabel[r]}
                <span className="ml-2 text-xs font-normal text-text-muted">({list.length} available)</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {list.map((card) => {
                  const isSelected = selected.includes(card.id);
                  const disabled = !isSelected && selectedCards.length >= 3;
                  const wrongRarity = selectedCards.length > 0 && selectedCards[0].rarity !== card.rarity && !isSelected;
                  return (
                    <button
                      key={card.id}
                      onClick={() => !disabled && !wrongRarity && toggle(card.id)}
                      disabled={disabled || wrongRarity}
                      className={`relative text-left transition-opacity ${
                        wrongRarity || (disabled && !isSelected) ? "opacity-30" : ""
                      }`}
                    >
                      <CardComponent card={card} compact />
                      {isSelected && (
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Prob({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="tabular font-mono text-text-primary">{pct}%</span>
    </div>
  );
}
