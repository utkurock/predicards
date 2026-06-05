# Predicards

**Turn any prediction market into a collectible card.**

Predicards wraps live "YES" positions from real prediction markets into Panini-style
collectible cards. Open a pack, pull random predictions as cards, trade them on a shared
marketplace, complete album sets to unlock parlay multipliers, forge weak cards into rarer
ones, and field your collection in head-to-head leagues. Rarity isn't cosmetic — it's tied
to each prediction's implied probability, so a longshot is genuinely Legendary.

It works for **any event**, not just one. The card layer is event-agnostic: any prediction
market with an implied probability and a resolution date can be minted as a card. The
reference data source is Polymarket's public Gamma API — point it at any event tag and the
whole game (packs, rarity, marketplace, parlays) reshapes around that event's markets.

> **Status:** functional prototype. Real wallet auth and a shared Firestore marketplace are
> live; settlement/resolution is still operated through an admin dev tool rather than an
> on-chain oracle.

---

## Core idea

A **card** is three things at once:

1. **A position** — a "YES" stake on a specific prediction market (the financial instrument).
2. **A collectible** — a rarity-tiered card with a unique edition number.
3. **An asset** — tradeable on the shared marketplace.

Rarity maps to the market's implied probability at mint:

| Rarity | Implied probability | Character |
|--------|--------------------|-----------|
| Common | ~40–60% | likely outcomes, modest payout |
| Rare | ~20–30% | |
| Epic | ~8–15% | |
| Legendary | ~2–5% | longshots, huge payout |
| Mythic | <1% | ultra-rare drop |

## Mechanics

- **Packs** — four tiers (Bronze / Silver / Gold / Champion) with different prices, card
  counts, and guaranteed-drop floors. Buying a pack is mechanically entering several
  prediction markets at once, framed as a sticker-pack reveal.
- **Album & sets** — your collection laid out like a sticker book. Holding every card in a
  themed set unlocks a **parlay**: lock the cards together for a combined bet with a 1.3×–2.0×
  multiplier. All underlying markets must resolve YES to win; any NO loses the parlay.
- **Marketplace** — a real shared Firestore collection. List a card and another wallet can
  buy it. Buys run server-side in an atomic transaction so two buyers can't take the same card.
- **Forge (burn-to-upgrade)** — burn three cards of one rarity to probabilistically mint one
  of the next tier.
- **Leagues** — field a lineup of cards; card strength rewards rare longshot picks, scored
  round-by-round with deterministic variance.
- **AI Scout** — a rule-based assistant that reads your collection, market prices, and set
  progress to suggest sells, buys, and near-complete parlays.

## How it's wired

- **Data source** — `lib/polymarket/client.ts` pulls live markets from Polymarket's Gamma API
  and maps each into a `Market` (implied probability → rarity). `lib/marketsSource.ts` holds a
  runtime registry that starts on bundled mock markets (so SSR always has data) and swaps in
  live markets once `/api/markets` resolves. Swap the configured event tag to retarget the
  whole game.
- **Auth** — wallet-based, no passwords. Connect → sign a one-time nonce (`personal_sign`, no
  gas) → server recovers the signer with **viem** and mints a Firebase custom token whose `uid`
  is the lowercased wallet address. Firestore rules then scope each user to their own document.
- **State** — gameplay mutates a Zustand store that auto-saves to `users/{address}` in
  Firestore ~600 ms after each change. Balance-affecting moves (buys, fee distribution) go
  through server routes using the Admin SDK, which bypass client rules.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + **Framer Motion** for the reveal/forge animations
- **Zustand** for client state
- **Firebase** (Firestore + custom-token auth) via client + Admin SDK
- **viem** for wallet signing / SIWE-style verification on **Base**
- **Polymarket Gamma API** as the underlying market feed

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example and fill it in (see [`FIREBASE-SETUP.md`](./FIREBASE-SETUP.md) for where each
value comes from):

```bash
cp .env.local.example .env.local
```

| Variable | What |
|----------|------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config (client) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | service account (server) |
| `NEXT_PUBLIC_BASE_NETWORK` | `testnet` (Base Sepolia, default) or `mainnet` (Base) |

### 3. Deploy Firestore rules

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>, click **Connect Wallet** (Coinbase Wallet or MetaMask), approve
the network switch, and sign the free login message. Then open **/dev → Seed marketplace** once
to populate listings.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/packs`, `/packs/open/[id]` | Pack store + reveal flow |
| `/album`, `/album/sets/[setId]` | Collection + set/parlay detail |
| `/card/[id]` | Card detail (collectible + prediction views) |
| `/market`, `/market/[id]` | Shared marketplace |
| `/markets` | Live underlying prediction markets |
| `/forge` | Burn-to-upgrade |
| `/leagues`, `/leagues/[id]` | Head-to-head leagues |
| `/dev` | Admin tools — resolve markets, seed, reset (dev only) |

## Project structure

```
app/            routes + API (auth, market buy/seed, markets)
components/      Card, pack reveal, album, marketplace, agent UI
lib/
  polymarket/   Gamma API client + types (the market feed)
  firebase/     client + Admin SDK setup
  store.ts      Zustand state (auto-persisted to Firestore)
  packLogic.ts  pack randomization
  parlayGen.ts  set generation
  leagueLogic.ts league scoring
  commission.ts marketplace fee / yield model
firestore.rules  per-user + shared-marketplace security rules
```

## Roadmap

- On-chain settlement via an oracle (replacing the admin resolve tool)
- Multiple concurrent events, each with its own market feed and album
- Real on-chain card ownership / transfers
- LLM-backed Scout agent (currently rule-based)

## License

TBD.
