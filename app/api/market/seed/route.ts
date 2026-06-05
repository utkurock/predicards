import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { buildListings } from "@/lib/mockData/listings";

export const runtime = "nodejs";

// POST /api/market/seed  (Authorization: Bearer <firebase idToken>)
// Populates the shared marketplace with the 150 mock listings so it isn't empty.
// Idempotent — overwrites the same l_* doc ids each run.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    await adminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const db = adminDb();
    const listings = buildListings();
    const batch = db.batch();
    for (const { id, ...data } of listings) {
      batch.set(db.collection("listings").doc(id), data);
    }
    await batch.commit();
    return NextResponse.json({ ok: true, count: listings.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
