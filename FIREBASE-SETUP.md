# Firebase + Base Wallet — Setup

Predicards now persists per-user state to **Firestore** and authenticates with a
**Web3 wallet on Base** (no passwords). The marketplace is a real shared
Firestore collection — list a card and another wallet can buy it.

## 1. Create a Firebase project

1. <https://console.firebase.google.com> → **Add project**.
2. Build → **Firestore Database** → Create database (Production mode).
3. Build → **Authentication** → Get started → enable nothing extra (we mint
   custom tokens ourselves, so no provider toggle is required).

## 2. Web app config → client env

Project settings (⚙️) → **General** → Your apps → **Web app** → config object.
Copy into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Service account → server env

Project settings → **Service accounts** → **Generate new private key** (downloads
a JSON). From it, copy into `.env.local`:

```
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> Keep `FIREBASE_PRIVATE_KEY` on one line with literal `\n` between key lines,
> wrapped in double quotes.

## 4. Chain

```
NEXT_PUBLIC_BASE_NETWORK=testnet   # Base Sepolia chainId 84532 (default) — or "mainnet" (8453)
```

The connect flow auto-switches the wallet to Base (adds the network if missing).

## 5. Deploy security rules

```
npm i -g firebase-tools   # once
firebase login
firebase deploy --only firestore:rules   # uses firestore.rules
```

(Or paste `firestore.rules` into Console → Firestore → Rules.)

## 6. Run

```
npm run dev
```

Click **Connect Wallet** (Coinbase Wallet preferred, MetaMask works) → approve the
network switch → sign the free login message. You're in.

Then open **/dev → Seed marketplace** once to populate the 150 listings.

---

## How auth works (SIWE → custom token)

1. Wallet connects, app requests a one-time **nonce** (`/api/auth/nonce`).
2. Wallet signs a plain message containing the nonce (`personal_sign`, no gas).
3. `/api/auth/verify` recovers the signer with **viem**, checks the nonce, and
   mints a **Firebase custom token** whose `uid` is the lowercased wallet address.
4. Client calls `signInWithCustomToken` → now `request.auth.uid == address`, so
   Firestore rules secure each user to their own document.

## Data model

| Path | Owner | Notes |
|------|-------|-------|
| `users/{address}` | the user | balance, collection, parlays, marketStatus, totalPnL, leagues |
| `listings/{id}` | shared | live marketplace; `sellerId` = seller address (or mock `0x…`) |
| `nonces/{address}` | server only | one-time login nonces |

Buys run server-side (`/api/market/buy`) in a Firestore transaction: it deletes
the listing, transfers the card to the buyer, debits the buyer, and credits a
real seller — atomically, so two buyers can't take the same card.

Everything else (packs, forge, parlays, leagues) mutates local Zustand state that
auto-saves to `users/{address}` ~600 ms after each change.
