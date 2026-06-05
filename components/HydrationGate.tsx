"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useWallet } from "@/components/WalletProvider";
import { Wallet } from "lucide-react";

export function HydrationGate({
  children,
  fallback,
  requireWallet = false,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  // When true, the page is gated behind a connected wallet (e.g. paying to open a
  // pack). Browsing pages leave this false so anyone can explore without signing in.
  requireWallet?: boolean;
}) {
  const hydrated = useStore((s) => s.hydrated);
  const { status, connect, error, configured } = useWallet();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const loading = (
    <div className="flex h-[60vh] items-center justify-center text-sm text-text-muted">Loading…</div>
  );

  if (!mounted || status === "loading") return fallback ?? loading;

  // Wallet-required flows still prompt to connect when signed out.
  if (requireWallet && status !== "connected") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center panel">
          <Wallet className="h-5 w-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold">Connect your wallet</h2>
        <p className="text-sm text-text-secondary">
          Sign in with your Base wallet to open packs, trade cards, and build your album. Your
          collection is saved to your address.
        </p>
        {!configured && (
          <p className="rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-xs text-live">
            Firebase isn&rsquo;t configured yet. Add your keys to <code>.env.local</code>.
          </p>
        )}
        <button
          onClick={connect}
          disabled={status === "connecting"}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Wallet className="h-4 w-4" />
          {status === "connecting" ? "Connecting…" : "Connect Wallet"}
        </button>
        {error && <p className="text-xs text-live">{error}</p>}
      </div>
    );
  }

  // A connected wallet still loading its saved state → wait to avoid a flash of
  // default (logged-out) values. Signed-out browsers render immediately with the
  // local defaults (500 USDT demo balance, empty album).
  if (status === "connected" && !hydrated) return fallback ?? loading;

  return <>{children}</>;
}
