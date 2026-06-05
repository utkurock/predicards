import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// GET /api/auth/nonce?address=0x... → issues a one-time nonce the wallet must sign.
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.toLowerCase();
  if (!address || !/^0x[0-9a-f]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const nonce = randomBytes(16).toString("hex");
    await adminDb()
      .collection("nonces")
      .doc(address)
      .set({ nonce, createdAt: Date.now() });
    return NextResponse.json({ nonce });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
