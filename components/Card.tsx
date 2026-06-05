"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Card as CardType, Rarity } from "@/lib/types";
import { RarityBadge } from "./RarityBadge";
import clsx from "clsx";

const rarityRing: Record<Rarity, string> = {
  common: "ring-rarity-common/10",
  rare: "ring-rarity-rare/20",
  epic: "ring-rarity-epic/25",
  legendary: "ring-rarity-legendary/35",
  mythic: "ring-rarity-mythic/40",
};

const rarityGlow: Record<Rarity, string> = {
  common: "",
  rare: "shadow-[0_0_24px_-14px_rgba(91,156,255,0.4)]",
  epic: "shadow-[0_0_30px_-14px_rgba(180,124,255,0.5)]",
  legendary: "shadow-[0_0_34px_-12px_rgba(232,181,71,0.55)]",
  mythic: "shadow-[0_0_38px_-12px_rgba(255,92,156,0.55)]",
};

const categoryClass: Record<string, string> = {
  tournament: "cat-tournament",
  team: "cat-team",
  player: "cat-player",
  match: "cat-match",
  wild: "cat-wild",
};

type Props = {
  card: CardType;
  href?: string;
  compact?: boolean;
  showPrice?: boolean;
  priceLabel?: string;
  priceValue?: number;
  className?: string;
};

export function CardComponent({
  card,
  href,
  compact = false,
  showPrice = false,
  priceLabel = "Price",
  priceValue,
  className,
}: Props) {
  const inner = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "group relative aspect-[3/4] overflow-hidden rounded-lg border border-line-subtle bg-bg-card ring-1 transition-colors hover:border-line",
        rarityRing[card.rarity],
        rarityGlow[card.rarity],
        className
      )}
    >
      {/* Art backdrop — category gradient sits behind the Polymarket image as fallback */}
      <div className={clsx("absolute inset-0", categoryClass[card.category])}>
        <div className="grain absolute inset-0" />
      </div>
      {card.imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          {/* Darken top & bottom so the rarity badge / edition / statement stay legible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80" />
        </>
      )}

      {/* Holographic overlay for legendary/mythic */}
      {card.rarity === "legendary" && (
        <div className="shimmer-gold absolute inset-0 opacity-35" />
      )}
      {card.rarity === "mythic" && (
        <div className="shimmer-mythic absolute inset-0 opacity-45" />
      )}

      {/* Vertical edge tick marks - editorial detail */}
      <div className="absolute left-2.5 top-12 bottom-12 hidden w-px bg-white/5 sm:block" />
      <div className="absolute right-2.5 top-12 bottom-12 hidden w-px bg-white/5 sm:block" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/70" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <RarityBadge rarity={card.rarity} size={compact ? "xs" : "sm"} />
        <div className="text-right">
          <div className="tabular font-mono text-[10px] text-text-primary">#{String(card.editionNumber).padStart(4, "0")}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted">
            / {card.editionTotal}
          </div>
        </div>
      </div>

      {/* Center category mark */}
      {!compact && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
          <div className="font-display text-[140px] font-black uppercase leading-none tracking-[-0.05em] text-white">
            {card.category[0]}
          </div>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-3">
        <div
          className={clsx(
            "font-semibold leading-snug tracking-tight text-text-primary",
            compact ? "text-[11px] line-clamp-3" : "text-[13px] line-clamp-3"
          )}
        >
          {card.statement}
        </div>
        <div className="flex items-center justify-between border-t border-white/8 pt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted">
            {card.category}
          </span>
          {showPrice ? (
            <span className="tabular font-mono text-[10px] text-text-primary">
              <span className="text-text-muted">{priceLabel} </span>
              {(priceValue ?? card.currentMarketPrice).toFixed(3)}
            </span>
          ) : (
            <span className="tabular font-mono text-[10px] text-text-secondary">
              {(card.impliedOddsAtMint * 100).toFixed(1)}% odds
            </span>
          )}
        </div>
      </div>

      {/* Status pill */}
      {card.status === "locked_in_parlay" && (
        <div className="absolute right-2 top-11 rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-accent">
          Locked
        </div>
      )}
      {card.status === "listed" && (
        <div className="absolute right-2 top-11 rounded-sm border border-rarity-rare/40 bg-rarity-rare/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-rarity-rare">
          Listed
        </div>
      )}
      {card.status === "settled_won" && (
        <div className="absolute right-2 top-11 rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-accent">
          Won
        </div>
      )}
      {card.status === "settled_lost" && (
        <div className="absolute right-2 top-11 rounded-sm border border-live/40 bg-live/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-live">
          Lost
        </div>
      )}
    </motion.div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
