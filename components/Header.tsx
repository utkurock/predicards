"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useWallet } from "@/components/WalletProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { shortAddress } from "@/lib/wallet";
import { Wallet, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

const nav = [
  { href: "/markets", label: "Markets" },
  { href: "/packs", label: "Packs" },
  { href: "/leagues", label: "Leagues" },
  { href: "/album", label: "Album" },
  { href: "/market", label: "Trade" },
  { href: "/forge", label: "Forge" },
];

export function Header() {
  const pathname = usePathname();
  const balance = useStore((s) => s.balance);
  const hydrated = useStore((s) => s.hydrated);
  const { status, address, connect, disconnect } = useWallet();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const connected = status === "connected";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line-subtle bg-bg-base/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-7 w-7">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent to-accent-dim" />
              <div className="absolute inset-[1px] rounded-[7px] bg-bg-base" />
              <div className="absolute inset-[3px] grid grid-cols-2 grid-rows-2 gap-[1px]">
                <div className="bg-accent" />
                <div className="bg-bg-base" />
                <div className="bg-bg-base" />
                <div className="bg-accent" />
              </div>
            </div>
            <span className="text-[15px] font-bold tracking-tight">Predicards</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-line-subtle bg-bg-hover p-1 md:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-bg-card text-text-primary shadow-soft"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {process.env.NODE_ENV !== "production" && (
            <Link
              href="/dev"
              className="hidden rounded-md font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-text-secondary md:inline-block"
            >
              Dev
            </Link>
          )}

          <ThemeToggle />

          {!mounted ? (
            <div className="h-8 w-28 rounded-full border border-line-subtle bg-bg-card" />
          ) : connected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-line-subtle bg-bg-card pl-3 pr-1 py-1">
                <span className="tabular font-mono text-[13px] font-semibold">
                  {hydrated ? balance.toFixed(2) : "—"}
                </span>
                <span className="rounded-full bg-bg-base px-2 py-0.5 font-mono text-[10px] uppercase text-text-secondary">
                  USDT
                </span>
              </div>
              <button
                onClick={disconnect}
                title={address ?? undefined}
                className="group flex items-center gap-1.5 rounded-full border border-line-subtle bg-bg-card px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-line hover:text-text-primary"
              >
                <span className="font-mono">{address ? shortAddress(address) : ""}</span>
                <LogOut className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={status === "connecting"}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Wallet className="h-3.5 w-3.5" />
              {status === "connecting" ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
