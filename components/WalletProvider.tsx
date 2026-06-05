"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase/client";
import { loadUserState, resetUserState } from "@/lib/store";
import {
  ensureBase,
  getInjectedProvider,
  requestAccounts,
  signMessage,
} from "@/lib/wallet";
import { buildSignMessage } from "@/lib/auth/message";
import { BASE } from "@/lib/chain";

type WalletContextValue = {
  user: User | null;
  address: string | null;
  status: "loading" | "idle" | "connecting" | "connected";
  error: string | null;
  configured: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React to Firebase auth state: hydrate the store on sign-in, clear it on sign-out.
  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) void loadUserState(u.uid);
      else resetUserState();
    });
    return unsub;
  }, []);

  // If the wallet account changes, drop the session so the user re-authenticates.
  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider?.on) return;
    const onAccountsChanged = () => {
      if (auth.currentUser) void signOut(auth);
    };
    provider.on("accountsChanged", onAccountsChanged);
    return () => provider.removeListener?.("accountsChanged", onAccountsChanged);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!firebaseConfigured) {
      setError("Firebase isn't configured yet — fill in .env.local.");
      return;
    }
    const provider = getInjectedProvider();
    if (!provider) {
      setError("No EVM wallet detected. Install Coinbase Wallet or MetaMask.");
      return;
    }
    setConnecting(true);
    try {
      const address = await requestAccounts(provider);
      await ensureBase(provider);

      const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.error ?? "Could not get nonce");

      const message = buildSignMessage(address, nonceData.nonce, BASE.chainId);
      const signature = await signMessage(provider, message, address);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verification failed");

      await signInWithCustomToken(auth, verifyData.token);
      // onAuthStateChanged handles store hydration.
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      // 4001 = user rejected in wallet.
      setError((e as { code?: number })?.code === 4001 ? "Signature rejected." : msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (firebaseConfigured) await signOut(auth);
    else resetUserState();
  }, []);

  const status: WalletContextValue["status"] = !authReady
    ? "loading"
    : connecting
    ? "connecting"
    : user
    ? "connected"
    : "idle";

  return (
    <WalletContext.Provider
      value={{
        user,
        address: user?.uid ?? null,
        status,
        error,
        configured: firebaseConfigured,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
