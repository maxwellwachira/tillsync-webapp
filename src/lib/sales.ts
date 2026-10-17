import type { Claim, Payment } from './types';

export type PersonSales = { uid: string; name: string; total: number; count: number };

export type SalesSplit = {
  /** Biggest first. */
  people: PersonSales[];
  unclaimedTotal: number;
  unclaimedCount: number;
};

/** Payments split by who made the sale (the owner's view). What nobody has claimed is kept apart, never lost. */
export function salesByPerson(payments: Payment[], claims: ReadonlyMap<string, Claim>): SalesSplit {
  const by = new Map<string, PersonSales>();
  let unclaimedTotal = 0;
  let unclaimedCount = 0;
  for (const p of payments) {
    const c = claims.get(p.code);
    if (!c) {
      unclaimedTotal += p.amount;
      unclaimedCount += 1;
      continue;
    }
    const row = by.get(c.uid) ?? { uid: c.uid, name: c.displayName || 'Someone', total: 0, count: 0 };
    row.total += p.amount;
    row.count += 1;
    by.set(c.uid, row);
  }
  return { people: [...by.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)), unclaimedTotal, unclaimedCount };
}

export type MySales = { mine: Payment[]; total: number; count: number; unclaimed: Payment[]; unclaimedTotal: number };

/** One person's day: their claimed payments, newest first, and what is still unclaimed. */
export function mySales(payments: Payment[], claims: ReadonlyMap<string, Claim>, uid: string | null): MySales {
  const mine: Payment[] = [];
  const unclaimed: Payment[] = [];
  for (const p of payments) {
    const c = claims.get(p.code);
    if (!c) unclaimed.push(p);
    else if (uid && c.uid === uid) mine.push(p);
  }
  mine.sort((a, b) => b.receivedAt - a.receivedAt);
  return {
    mine,
    total: mine.reduce((n, p) => n + p.amount, 0),
    count: mine.length,
    unclaimed,
    unclaimedTotal: unclaimed.reduce((n, p) => n + p.amount, 0),
  };
}

/** “Sam Taylor” -> “Sam T.” */
export function shortName(name: string): string {
  const [first, last] = name.trim().split(/\s+/);
  return last ? `${first} ${last[0]}.` : (first ?? '');
}

/** The rules let attendants claim only payments from the last 24 hours; the owner can claim or assign any. */
export const CLAIM_WINDOW_MS = 24 * 3_600_000;
