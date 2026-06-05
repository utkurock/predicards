"use client";

import { BASE } from "./chain";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isCoinbaseWallet?: boolean;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
    coinbaseWalletExtension?: Eip1193Provider;
  }
}

// Prefer Coinbase Wallet (native to Base) when present, fall back to any injected EVM wallet.
export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  if (window.coinbaseWalletExtension) return window.coinbaseWalletExtension;
  if (window.ethereum) return window.ethereum;
  return null;
}

export async function requestAccounts(provider: Eip1193Provider): Promise<string> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) throw new Error("No accounts returned");
  return accounts[0].toLowerCase();
}

// Make sure the wallet is pointed at Base; add the network if the wallet doesn't know it.
export async function ensureBase(provider: Eip1193Provider): Promise<void> {
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (current?.toLowerCase() === BASE.chainIdHex.toLowerCase()) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE.chainIdHex }],
    });
  } catch (err) {
    // 4902 = chain not added to wallet yet.
    const code = (err as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE.chainIdHex,
            chainName: BASE.name,
            rpcUrls: BASE.rpcUrls,
            nativeCurrency: BASE.nativeCurrency,
            blockExplorerUrls: BASE.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function signMessage(
  provider: Eip1193Provider,
  message: string,
  address: string
): Promise<string> {
  return (await provider.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
