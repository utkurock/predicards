"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

// True once real config is present — lets the UI show a friendly "not configured" state
// instead of throwing during the demo before .env.local is filled in.
export const firebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

// Fall back to non-empty placeholders when unconfigured so getAuth()/getFirestore()
// don't throw at import time (e.g. during `next build` prerender). No network calls
// happen until a real connect(), which is gated on `firebaseConfigured`.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "unconfigured-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "unconfigured.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unconfigured",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "unconfigured.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:0:web:unconfigured",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ignoreUndefinedProperties so optional card fields (imageUrl, commission checkpoints,
// volumeBase from mock markets, …) never throw on write. Guarded for HMR re-runs.
let firestore: Firestore;
try {
  firestore = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  firestore = getFirestore(app);
}
export const db = firestore;
