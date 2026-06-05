// Base (Coinbase's EVM L2) network config. Wallet auth signs a message — no gas —
// but we still enforce the wallet is on Base so the whole app speaks one chain.

export type ChainConfig = {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls: string[];
};

const MAINNET: ChainConfig = {
  chainId: 8453,
  chainIdHex: "0x2105",
  name: "Base",
  rpcUrls: ["https://mainnet.base.org"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://basescan.org"],
};

const TESTNET: ChainConfig = {
  chainId: 84532,
  chainIdHex: "0x14a34",
  name: "Base Sepolia",
  rpcUrls: ["https://sepolia.base.org"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

// Default to testnet for development; set NEXT_PUBLIC_BASE_NETWORK=mainnet to go live.
export const BASE: ChainConfig =
  process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet" ? MAINNET : TESTNET;
