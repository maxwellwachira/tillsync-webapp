import type { Claim, Payment } from '../types.ts';

import type { Period } from './period.ts';

export type DayRow = { day: number; total: number; count: number };
export type HourRow = { hour: number; total: number; count: number };
export type PersonRow = { uid: string; name: string; total: number; count: number };

export type Report = {
  period: Period;
  total: number;
  count: number;
  average: number;
  /** The day with the most money, or null for an empty period. Only meaningful for week and month. */
  bestDay: DayRow | null;
  /** The local hour (0-23) with the most payments, or null when empty. Used for a single day. */
  busiestHour: number | null;
  /** One row per hour of the day (0-23), summed over the whole period. */
  hours: HourRow[];
  /** One row per calendar day in the period, oldest first, including days with nothing. */
  days: DayRow[];
  /** Biggest first. */
  people: PersonRow[];
  unclaimed: { total: number; count: number };
  /** Payments newest first, each with who made the sale (empty if unclaimed). */
  rows: { payment: Payment; soldBy: string }[];
};

const midnight = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Everything a report shows, from the payments of the period and the claims known for them. A claim only counts when
 * its payment is in the period. These are counts of M-Pesa messages, never verified settlement.
 */
export function buildReport(period: Period, all: Payment[], claims: ReadonlyMap<string, Claim>): Report {
  const payments = all.filter((p) => p.receivedAt >= period.from && p.receivedAt < period.to).sort((a, b) => b.receivedAt - a.receivedAt);

  const days: DayRow[] = [];
  for (let t = period.from; t < period.to; ) {
    days.push({ day: t, total: 0, count: 0 });
    const next = new Date(t);
    next.setDate(next.getDate() + 1);
    t = next.getTime();
  }
  const dayIndex = new Map(days.map((d, i) => [d.day, i]));

  const hours: HourRow[] = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0, count: 0 }));
  const perHour = new Map<number, number>();
  const people = new Map<string, PersonRow>();
  const unclaimed = { total: 0, count: 0 };
  let total = 0;

  const rows = payments.map((p) => {
    total += p.amount;
    const d = days[dayIndex.get(midnight(p.receivedAt)) ?? -1];
    if (d) {
      d.total += p.amount;
      d.count += 1;
    }
    const h = new Date(p.receivedAt).getHours();
    perHour.set(h, (perHour.get(h) ?? 0) + 1);
    hours[h]!.total += p.amount;
    hours[h]!.count += 1;

    const c = claims.get(p.code);
    if (!c) {
      unclaimed.total += p.amount;
      unclaimed.count += 1;
      return { payment: p, soldBy: '' };
    }
    const row = people.get(c.uid) ?? { uid: c.uid, name: c.displayName || 'Someone', total: 0, count: 0 };
    row.total += p.amount;
    row.count += 1;
    people.set(c.uid, row);
    return { payment: p, soldBy: row.name };
  });

  let busiestHour: number | null = null;
  let best = 0;
  for (const [h, n] of perHour) if (n > best || (n === best && busiestHour !== null && h < busiestHour)) [busiestHour, best] = [h, n];

  const bestDay = days.reduce<DayRow | null>((b, d) => (d.total > 0 && (!b || d.total > b.total) ? d : b), null);

  return {
    period,
    total,
    count: payments.length,
    average: payments.length ? Math.round(total / payments.length) : 0,
    bestDay,
    busiestHour,
    hours,
    days,
    people: [...people.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    unclaimed,
    rows,
  };
}
