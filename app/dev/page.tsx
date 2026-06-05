"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useCommission, saveCommissionRates } from "@/lib/commissionStore";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/Button";
import { HydrationGate } from "@/components/HydrationGate";
import { useToast } from "@/components/Toaster";
import { notFound } from "next/navigation";
import { RotateCcw, Sparkles, CheckCircle2, XCircle, Store } from "lucide-react";

export default function DevPage() {
  // Dev tools (resolve markets, reset, seed, commission rates) are for local
  // development only — never reachable on the public production deployment.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <HydrationGate>
      <Inner />
    </HydrationGate>
  );
}

function Inner() {
  const balance = useStore((s) => s.balance);
  const collection = useStore((s) => s.collection);
  const parlays = useStore((s) => s.parlays);
  const marketStatus = useStore((s) => s.marketStatus);
  const markets = useStore((s) => s.markets);
  const resolve = useStore((s) => s.resolveMarket);
  const reset = useStore((s) => s.resetAll);
  const seedDemo = useStore((s) => s.seedDemo);
  const toast = useToast((s) => s.push);
  const [seedingMarket, setSeedingMarket] = useState(false);

  const seedMarket = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast("Connect your wallet first.", "error");
      return;
    }
    setSeedingMarket(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/market/seed", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) toast(`Seeded ${data.count} listings to marketplace.`, "success");
      else toast(data.error ?? "Seed failed.", "error");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Seed failed.", "error");
    } finally {
      setSeedingMarket(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title">Dev tools</h1>
        <p className="section-sub mt-1.5">Resolve markets / Seed demo / Reset state</p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Seed demo collection"
          desc="Pre-populates the album one card short of Semifinalist Quartet — demo-ready."
          onClick={() => {
            seedDemo();
            toast("Demo collection seeded.", "success");
          }}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <ActionCard
          title={seedingMarket ? "Seeding…" : "Seed marketplace"}
          desc="Writes 150 mock listings to the shared Firestore marketplace for everyone."
          onClick={seedMarket}
          icon={<Store className="h-4 w-4" />}
        />
        <ActionCard
          title="Reset all state"
          desc="Wipes your collection, balance, parlays — back to defaults."
          danger
          onClick={() => {
            if (confirm("Reset everything?")) {
              reset();
              toast("State reset.", "info");
            }
          }}
          icon={<RotateCcw className="h-4 w-4" />}
        />
        <div className="panel p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Current state</div>
          <div className="mt-3 space-y-1.5 text-xs">
            <Row label="Balance" value={`${balance.toFixed(2)} USDT`} />
            <Row label="Cards" value={`${collection.length}`} />
            <Row label="Active parlays" value={`${parlays.filter(p => p.status === "activated").length}`} />
            <Row label="Won parlays" value={`${parlays.filter(p => p.status === "settled_won").length}`} />
          </div>
        </div>
      </div>

      {/* Commission rates */}
      <RatesPanel />

      {/* Markets */}
      <div className="panel">
        <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3">
          <div>
            <div className="text-sm font-semibold">Markets</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              Resolve to trigger settlement
            </div>
          </div>
        </div>
        <div className="divide-y divide-line-subtle">
          {markets.map((m) => {
            const status = marketStatus[m.id] || m.status;
            const isResolved = status === "resolved_yes" || status === "resolved_no";
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted">{m.id}</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">{m.category}</span>
                    {status === "resolved_yes" && (
                      <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent">YES</span>
                    )}
                    {status === "resolved_no" && (
                      <span className="rounded border border-live/30 bg-live/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-live">NO</span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-sm">{m.statement}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden tabular font-mono text-xs text-text-muted md:inline">
                    {(m.impliedProbability * 100).toFixed(1)}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isResolved}
                    onClick={() => {
                      resolve(m.id, "yes");
                      toast(`Resolved ${m.id} YES.`, "success");
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> YES
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isResolved}
                    onClick={() => {
                      resolve(m.id, "no");
                      toast(`Resolved ${m.id} NO.`, "info");
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" /> NO
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title, desc, onClick, icon, danger,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
        danger
          ? "border-line-subtle bg-bg-card hover:border-live/40 hover:bg-live/5"
          : "border-line-subtle bg-bg-card hover:border-line hover:bg-bg-hover"
      }`}
    >
      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${danger ? "bg-live/10 text-live" : "bg-accent/10 text-accent"}`}>
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-text-secondary">{desc}</div>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="tabular font-mono text-text-primary">{value}</span>
    </div>
  );
}

// Live-editable commission rates, persisted to config/commission (read by client + buy route).
function RatesPanel() {
  const rates = useCommission((s) => s.rates);
  const toast = useToast((s) => s.push);
  // Friendly units: fee as %, poly yield as USDT earned per $1M of volume.
  const [feePct, setFeePct] = useState((rates.inAppFeeRate * 100).toString());
  const [perM, setPerM] = useState((rates.polyYieldBps * 1_000_000).toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const inAppFeeRate = (parseFloat(feePct) || 0) / 100;
    const polyYieldBps = (parseFloat(perM) || 0) / 1_000_000;
    if (inAppFeeRate < 0 || inAppFeeRate > 0.5) {
      toast("Fee must be between 0 and 50%.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveCommissionRates({ inAppFeeRate, polyYieldBps });
      toast("Commission rates updated.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save rates.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 panel p-5">
      <div className="text-sm font-semibold">Commission rates</div>
      <div className="text-[10px] uppercase tracking-wider text-text-muted">
        Live — applies to claims + the buy route
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-[11px] text-text-secondary">Secondary-sale fee (%)</span>
          <input
            type="number"
            step="0.5"
            value={feePct}
            onChange={(e) => setFeePct(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line-subtle bg-bg-base px-3 py-2 text-sm outline-none focus:border-line"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-text-secondary">Yield per $1M volume (USDT)</span>
          <input
            type="number"
            step="0.5"
            value={perM}
            onChange={(e) => setPerM(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line-subtle bg-bg-base px-3 py-2 text-sm outline-none focus:border-line"
          />
        </label>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save rates"}
        </Button>
      </div>
    </div>
  );
}
