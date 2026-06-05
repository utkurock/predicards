"use client";

import clsx from "clsx";
import type { PackTier } from "@/lib/types";

const tierStyle: Record<PackTier, { bg: string; accent: string; label: string }> = {
  bronze: {
    bg: "from-[#3a2614] via-[#1f140a] to-[#0f0a05]",
    accent: "#C58E4A",
    label: "Bronze",
  },
  silver: {
    bg: "from-[#2a2d36] via-[#15171c] to-[#0a0b0f]",
    accent: "#B6BAC8",
    label: "Silver",
  },
  gold: {
    bg: "from-[#3a2e0c] via-[#1f1806] to-[#0c0903]",
    accent: "#E8B547",
    label: "Gold",
  },
  champion: {
    bg: "from-[#2a103a] via-[#15081e] to-[#08040d]",
    accent: "#B47CFF",
    label: "Champion",
  },
};

export function PackArt({
  tier,
  className,
  size = "md",
}: {
  tier: PackTier;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = tierStyle[tier];
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br shadow-2xl",
        s.bg,
        size === "sm" ? "aspect-[3/4]" : size === "lg" ? "aspect-[3/4]" : "aspect-[3/4]",
        className
      )}
      style={{ boxShadow: `0 24px 60px -20px ${s.accent}30, inset 0 1px 0 rgba(255,255,255,0.06)` }}
    >
      {/* Foil pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `repeating-linear-gradient(135deg, ${s.accent}22 0 1px, transparent 1px 14px), repeating-linear-gradient(45deg, ${s.accent}11 0 1px, transparent 1px 22px)`,
        }}
      />
      {/* Shine */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />

      {/* Top label */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
          Predicards
        </div>
        <div
          className="rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ borderColor: s.accent + "60", color: s.accent }}
        >
          {s.label}
        </div>
      </div>

      {/* Center mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className="text-[64px] font-black leading-none tracking-tighter"
            style={{ color: s.accent }}
          >
            {s.label[0]}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
            Pack
          </div>
        </div>
      </div>

      {/* Bottom edge */}
      <div className="absolute inset-x-0 bottom-0 border-t border-white/5 p-4">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-white/40">
          <span>FIFA 26</span>
          <span>×1</span>
        </div>
      </div>

      {/* Grain */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
