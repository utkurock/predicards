import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { buildSignMessage } from "@/lib/auth/message";
import { BASE } from "@/lib/chain";

export const runtime = "nodejs";

const NONCE_TTL_MS = 5 * 60 * 1000;

// POST /api/auth/verify { address, signature }
// Verifies the wallet signature against the stored nonce, then mints a Firebase
// custom token whose uid IS the lowercased wallet address.
export async function POST(req: NextRequest) {
  let body: { address?: string; signature?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const address = body.address?.toLowerCase();
  const signature = body.signature;
  if (!address || !/^0x[0-9a-f]{40}$/.test(address) || !signature) {
    return NextResponse.json({ error: "Missing address or signature" }, { status: 400 });
  }

  try {
    const db = adminDb();
    const nonceRef = db.collection("nonces").doc(address);
    const snap = await nonceRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "No pending nonce — request one first" }, { status: 400 });
    }
    const { nonce, createdAt } = snap.data() as { nonce: string; createdAt: number };
    if (Date.now() - createdAt > NONCE_TTL_MS) {
      await nonceRef.delete();
      return NextResponse.json({ error: "Nonce expired — try again" }, { status: 400 });
    }

    const message = buildSignMessage(address, nonce, BASE.chainId);
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    // Burn the nonce so the signature can't be replayed.
    await nonceRef.delete();

    // Ensure a user profile exists with the starting balance.
    const userRef = db.collection("users").doc(address);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        address,
        balance: 500,
        totalPnL: 0,
        collection: [],
        parlays: [],
        marketStatus: {},
        leagues: {},
        createdAt: Date.now(),
      });
    }

    const token = await adminAuth().createCustomToken(address, { address });
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
