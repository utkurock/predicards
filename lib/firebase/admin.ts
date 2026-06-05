import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-only Firebase Admin. Used by route handlers to mint custom tokens after
// wallet-signature verification and to run atomic marketplace transactions.

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private keys are stored with escaped newlines in env; restore them.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local"
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

let adminDbInstance: Firestore | null = null;
export function adminDb(): Firestore {
  if (adminDbInstance) return adminDbInstance;
  const db = getFirestore(getAdminApp());
  // Match the client: tolerate undefined fields on write (set once, before first use).
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    /* settings already applied */
  }
  adminDbInstance = db;
  return db;
}
