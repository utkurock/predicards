"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { packs } from "@/lib/mockData/packs";
import type { Pack, Rarity } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useWallet } from "@/components/WalletProvider";
import { useToast } from "./Toaster";
import { rarityLabel } from "@/lib/pricing";
import { PackArt } from "./PackArt";
import clsx from "clsx";

export function PackPicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<Pack>(packs[1]);
  const balance = useStore((s) => s.balance);
  const hydrated = useStore((s) => s.hydrated);
  const { status, connect } = useWallet();
  const toast = useToast((s) => s.push);

  const connected = status === "connected";

  // Payment is charged on the open page when the pack is torn; here we only route.
  const open = () => {
    if (!connected) {
      void connect();
      return;
    }
    if (balance < selected.price) {
      toast(`Need ${selected.price} USDT.`, "error");
      return;
    }
    router.push(`/packs/open/${selected.id}`);
  };

  return (
    <div className="tile p-6">
      <div className="relative z-10">
        {/* Header tabs */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1">
            <button className="rounded-lg bg-bg-card px-3 py-1.5 text-sm font-semibold">
              Open
            </button>
            <button
              onClick={() => router.push("/market")}
              className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Trade
            </button>
          </div>
        </div>

        {/* Tier card */}
        <div className="rounded-2xl border border-line-subtle bg-bg-base px-5 py-4">
          <div className="flex items-center justify-between text-[11px] text-text-secondary">
            <span>Tier</span>
            <span>
              Balance{" "}
              <span className="tabular font-mono text-text-primary">
                {hydrated ? balance.toFixed(2) : "—"}
              </span>{" "}
              <span className="text-text-muted">USDT</span>
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg">
                <PackArt tier={selected.tier} />
              </div>
              <span className="bignum text-3xl capitalize">{selected.tier}</span>
            </div>
            <div className="text-right">
              <div className="bignum text-3xl">{selected.price}</div>
              <div className="font-mono text-[10px] uppercase text-text-muted">USDT</div>
            </div>
          </div>
        </div>

        {/* Tier picker pills */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {packs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              data-active={p.id === selected.id}
              className="pill justify-center capitalize"
            >
              {p.tier}
            </button>
          ))}
        </div>

        {/* Drop rates — bar + summary */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">Drop rates</span>
            <span className="text-text-secondary">
              <span className="tabular font-mono text-text-primary">{selected.cardCount}</span> cards
              <span className="mx-2 text-text-muted">·</span>
              {selected.guaranteed}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-bg-card">
            {(["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).map((r) => {
              const colors: Record<Rarity, string> = {
                common: "bg-rarity-common",
                rare: "bg-rarity-rare",
                epic: "bg-rarity-epic",
                legendary: "bg-rarity-legendary",
                mythic: "bg-rarity-mythic",
              };
              return (
                <div
                  key={r}
                  className={colors[r]}
                  style={{ width: `${selected.dropRates[r] * 100}%` }}
                  title={`${rarityLabel[r]} ${(selected.dropRates[r] * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
            {(["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).map((r) => {
              const pct = selected.dropRates[r] * 100;
              if (pct === 0) return null;
              const dotColors: Record<Rarity, string> = {
                common: "bg-rarity-common",
                rare: "bg-rarity-rare",
                epic: "bg-rarity-epic",
                legendary: "bg-rarity-legendary",
                mythic: "bg-rarity-mythic",
              };
              return (
                <span key={r} className="inline-flex items-center gap-1.5">
                  <span className={clsx("h-1.5 w-1.5 rounded-full", dotColors[r])} />
                  <span className="text-text-muted">{rarityLabel[r]}</span>
                  <span className="tabular font-mono text-text-primary">
                    {pct < 1 ? pct.toFixed(1) : pct.toFixed(0)}%
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={open}
          disabled={connected ? hydrated && balance < selected.price : status === "connecting"}
          className="btn-lime mt-6 flex h-14 w-full items-center justify-center gap-2 text-[14px] uppercase tracking-[0.04em]"
        >
          {!connected ? (
            status === "connecting" ? (
              "Connecting…"
            ) : (
              "Connect wallet to open"
            )
          ) : hydrated && balance < selected.price ? (
            "Insufficient balance"
          ) : (
            <>
              Open {selected.tier} pack
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-between text-[11px] text-text-muted">
          <span>Sign in with your Base wallet</span>
          <span className="tabular font-mono">{selected.cardCount} reveals incoming</span>
        </div>
      </div>
    </div>
  );
}
