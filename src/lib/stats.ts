import { startOfDay } from './format';
import type { Device, Payment } from './types';

export type DayStats = {
  total: number;
  count: number;
  average: number;
  median: number;
  lastHour: number;
  /** Local hour (0-23) with the most payments, or null when there are none. */
  busiestHour: number | null;
  /** KSh received in each local hour of the day. */
  hourly: number[];
};

/** Figures derived from payments the app already holds. Counts of received M-Pesa messages, never "verified revenue". */
export function dayStats(items: Payment[], now: number): DayStats {
  const hourly = new Array<number>(24).fill(0);
  const count = items.length;
  if (count === 0) return { total: 0, count: 0, average: 0, median: 0, lastHour: 0, busiestHour: null, hourly };
  const amounts = items.map((p) => p.amount).sort((a, b) => a - b);
  const total = amounts.reduce((s, n) => s + n, 0);
  const mid = Math.floor(count / 2);
  const median = count % 2 ? amounts[mid]! : Math.round((amounts[mid - 1]! + amounts[mid]!) / 2);
  const perHour = new Map<number, number>();
  for (const p of items) {
    const h = new Date(p.receivedAt).getHours();
    perHour.set(h, (perHour.get(h) ?? 0) + 1);
    hourly[h]! += p.amount;
  }
  let busiestHour = 0;
  let best = 0;
  for (const [h, n] of perHour) if (n > best || (n === best && h < busiestHour)) [busiestHour, best] = [h, n];
  return {
    total,
    count,
    average: Math.round(total / count),
    median,
    lastHour: items.filter((p) => now - p.receivedAt <= 3_600_000).length,
    busiestHour,
    hourly,
  };
}

/** Whole-percent change from `prior` to `now`; null when there is nothing to compare against. */
export function pctChange(now: number, prior: number): number | null {
  if (!(prior > 0)) return null;
  return Math.round(((now - prior) / prior) * 100);
}

export function onlyToday(items: Payment[], now: number): Payment[] {
  const start = startOfDay(now);
  return items.filter((p) => p.receivedAt >= start);
}

/** Total per local day, oldest first, for the last `days` days ending today (days with nothing are zero). */
export function dailyTotals(items: Payment[], now: number, days: number): { day: number; total: number; count: number }[] {
  const start = startOfDay(now);
  const out = Array.from({ length: days }, (_, i) => ({ day: start - (days - 1 - i) * 86_400_000, total: 0, count: 0 }));
  for (const p of items) {
    const idx = out.findIndex((d) => p.receivedAt >= d.day && p.receivedAt < d.day + 86_400_000);
    if (idx >= 0) {
      out[idx]!.total += p.amount;
      out[idx]!.count += 1;
    }
  }
  return out;
}

export type DeviceHealth = 'connected' | 'interrupted' | 'permission' | 'waiting';

/** The Till phone reports every 30 s. Three minutes of silence allows for brief dozing and a flaky signal. */
export const STALE_AFTER_MS = 3 * 60_000;

/** What to believe about a Till phone right now. "Interrupted" never claims it is off, only that we have not heard from it. */
export function deviceHealth(d: Device, now: number): DeviceHealth {
  if (d.lastHeartbeat === null) return 'waiting';
  if (now - d.lastHeartbeat > STALE_AFTER_MS) return 'interrupted';
  if (!d.smsPermission) return 'permission';
  return 'connected';
}

export function worstHealth(devices: Device[], now: number): DeviceHealth | null {
  if (devices.length === 0) return null;
  const order: DeviceHealth[] = ['interrupted', 'permission', 'waiting', 'connected'];
  const states = devices.map((d) => deviceHealth(d, now));
  return order.find((s) => states.includes(s)) ?? 'connected';
}
