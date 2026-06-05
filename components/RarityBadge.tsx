import type { Rarity } from "@/lib/types";
import { rarityLabel } from "@/lib/pricing";

const styles: Record<Rarity, string> = {
  common: "border-rarity-common/40 text-rarity-common bg-rarity-common/5",
  rare: "border-rarity-rare/50 text-rarity-rare bg-rarity-rare/10",
  epic: "border-rarity-epic/50 text-rarity-epic bg-rarity-epic/10",
  legendary: "border-rarity-legendary/60 text-rarity-legendary bg-rarity-legendary/10",
  mythic: "border-rarity-mythic/60 text-rarity-mythic bg-rarity-mythic/10",
};

export function RarityBadge({ rarity, size = "sm" }: { rarity: Rarity; size?: "xs" | "sm" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono font-medium uppercase ${
        size === "xs" ? "text-[9px] tracking-[0.15em]" : "text-[10px] tracking-[0.16em]"
      } ${styles[rarity]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {rarityLabel[rarity]}
    </span>
  );
}
