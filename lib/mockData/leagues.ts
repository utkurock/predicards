import type { League } from "../types";

// "Today" — using a static date so SSR/CSR agree.
// Real product would derive from server date; mock keeps it stable.
const today = "2026-05-21";

export const todaysLeagues: League[] = [
  {
    id: `lg-${today}-bronze`,
    date: today,
    tier: "bronze",
    name: "Bronze Daily",
    entryFee: 10,
    rounds: 7,
    capacity: 8,
    minLineup: 4,
    maxLineup: 6,
    status: "open",
  },
  {
    id: `lg-${today}-silver`,
    date: today,
    tier: "silver",
    name: "Silver Daily",
    entryFee: 25,
    rounds: 7,
    capacity: 8,
    minLineup: 5,
    maxLineup: 7,
    status: "open",
  },
  {
    id: `lg-${today}-champion`,
    date: today,
    tier: "champion",
    name: "Champion Cup",
    entryFee: 100,
    rounds: 7,
    capacity: 8,
    minLineup: 6,
    maxLineup: 8,
    status: "open",
  },
];
