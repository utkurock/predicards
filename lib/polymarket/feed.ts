// Live match feed — real sports fixtures pulled from Polymarket "game" events.
//
// Each soccer event on Gamma is a single fixture ("Home vs. Away") carrying live
// state (score, period, elapsed minute), a moneyline market per outcome (home win /
// draw / away win), 24h volume and a competition label. We map those into the
// MatchFeedItem shape the homepage feed renders. We are the middleman: scores,
// odds and clocks all come straight from Polymarket.

import type { MatchFeedItem, MatchFeedStatus } from "../types";
import type { GammaEvent, GammaMarket } from "./types";

const GAMMA = "https://gamma-api.polymarket.com";
const TTL_MS = 60_000; // live data — refresh ~once a minute
const FEED_TAG = "soccer"; // World Cup theme → football fixtures
const FETCH_LIMIT = 120; // events to scan before mapping/dedup

// First "N-N" group of Gamma's score string ("2-1", or "000-000|1-1|Bo5").
function parseScore(raw: string | undefined): [number, number] | null {
  if (!raw) return null;
  const m = raw.split("|")[0].match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

function firstPrice(gm: GammaMarket): number | null {
  if (!gm.outcomePrices) return null;
  try {
    const arr = JSON.parse(gm.outcomePrices);
    const p = Array.isArray(arr) ? Number(arr[0]) : NaN;
    return Number.isFinite(p) ? p : null;
  } catch {
    return null;
  }
}

// Split "Home vs. Away - Moneyline" → ["Home", "Away"]. Returns null if not a fixture.
function splitMatchup(title: string): [string, string] | null {
  const base = title.split(/\s+-\s+/)[0].trim();
  const parts = base.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  const home = parts[0].trim();
  const away = parts[1].trim();
  return home && away ? [home, away] : null;
}

// Strip a trailing parenthetical, e.g. "Draw (A vs. B)" → "Draw".
function bareTitle(s: string): string {
  return s.replace(/\s*\(.*\)\s*$/, "").trim();
}

function statusFor(e: GammaEvent): MatchFeedStatus {
  const period = (e.period || "").toUpperCase();
  if (e.ended === true || period === "FT" || period === "FINAL") return "final";
  if (e.live === true) return "live";
  return "upcoming";
}

function clockFor(e: GammaEvent, status: MatchFeedStatus): string | undefined {
  if (status === "final") return "FT";
  if (status !== "live") return undefined;
  const period = (e.period || "").toUpperCase();
  const min = e.elapsed != null && String(e.elapsed).trim() !== "" ? `${e.elapsed}'` : "";
  if (period === "HT") return "HT";
  if (period === "SUS") return "SUSP";
  return [period, min].filter(Boolean).join(" ") || "LIVE";
}

function mapEvent(e: GammaEvent): MatchFeedItem | null {
  const title = e.title || "";
  const matchup = splitMatchup(title);
  if (!matchup) return null;
  const [home, away] = matchup;

  // Pull the moneyline prices: market whose group title is the home/away team or "Draw".
  let homeP: number | null = null;
  let awayP: number | null = null;
  let drawP: number | null = null;
  for (const gm of e.markets || []) {
    const label = bareTitle(gm.groupItemTitle || "");
    if (!label) continue;
    const p = firstPrice(gm);
    if (p == null) continue;
    if (label === home) homeP = p;
    else if (label === away) awayP = p;
    else if (/^draw$/i.test(label)) drawP = p;
  }
  // Need both sides to be a real fixture; events without a moneyline (exact-score,
  // over/under, handicap variants) are skipped — the moneyline variant carries the match.
  if (homeP == null || awayP == null) return null;
  // Untraded markets default to 0.5/0.5 — no signal, drop them.
  if (homeP === 0.5 && awayP === 0.5 && (drawP == null || drawP === 0.5)) return null;

  // Normalise so home/draw/away win probs sum to 1 (raw yes-prices over-round).
  const sum = homeP + awayP + (drawP ?? 0);
  const norm = (x: number | null) =>
    x == null || sum <= 0 ? undefined : Math.round((x / sum) * 1000) / 1000;

  const status = statusFor(e);
  const score = parseScore(e.score);

  return {
    id: `pmf_${e.id}`,
    league: e.series?.[0]?.title || undefined,
    home,
    away,
    homeProb: norm(homeP),
    drawProb: drawP != null ? norm(drawP) : undefined,
    awayProb: norm(awayP),
    homeScore: score ? score[0] : undefined,
    awayScore: score ? score[1] : undefined,
    status,
    clock: clockFor(e, status),
    kickoff: e.startDate || "",
    volume24hr: typeof e.volume24hr === "number" ? e.volume24hr : undefined,
    sourceUrl: e.slug ? `https://polymarket.com/event/${e.slug}` : undefined,
    imageUrl: e.image || undefined,
  };
}

// Prefer the richest variant when the same fixture appears multiple times (a 3-way
// moneyline event and a 2-way one, a live event and its pre-match shell, …).
function score(item: MatchFeedItem): number {
  let s = 0;
  if (item.status === "live") s += 1000;
  if (item.status === "final") s += 100;
  if (item.drawProb != null) s += 50; // complete 3-way
  if (item.homeScore != null) s += 25; // has a score
  s += Math.min((item.volume24hr ?? 0) / 1e6, 10); // liquidity tiebreak
  return s;
}

const STATUS_ORDER: Record<MatchFeedStatus, number> = { live: 0, upcoming: 1, final: 2 };

let cache: { at: number; items: MatchFeedItem[] } | null = null;

export async function fetchMatchFeed(limit = 12): Promise<MatchFeedItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items.slice(0, limit);

  const url =
    `${GAMMA}/events?closed=false&active=true&limit=${FETCH_LIMIT}` +
    `&tag_slug=${FEED_TAG}&order=volume24hr&ascending=false`;

  let events: GammaEvent[] = [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return cache?.items.slice(0, limit) ?? [];
    const data = (await res.json()) as GammaEvent[];
    events = Array.isArray(data) ? data : [];
  } catch {
    return cache?.items.slice(0, limit) ?? [];
  }

  // Map → dedupe by fixture, keeping the highest-scoring variant.
  const best = new Map<string, MatchFeedItem>();
  for (const e of events) {
    const item = mapEvent(e);
    if (!item) continue;
    const key = `${item.home}|${item.away}`.toLowerCase();
    const prev = best.get(key);
    if (!prev || score(item) > score(prev)) best.set(key, item);
  }

  const items = [...best.values()].sort((a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (so !== 0) return so;
    return (b.volume24hr ?? 0) - (a.volume24hr ?? 0);
  });

  if (items.length > 0) cache = { at: Date.now(), items };
  return items.slice(0, limit);
}
