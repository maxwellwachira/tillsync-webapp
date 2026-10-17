'use client';

import { useEffect, useState } from 'react';

import { usePaymentsRange } from './data';
import { startOfDay } from './format';
import { useSession } from './session';
import { dayStats } from './stats';

const DAY = 86_400_000;

/** Re-renders every `intervalMs` so "3 min ago" and "today" stay honest. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** What came in yesterday up to this same time of day, for "vs yesterday". null whenever it can't be known (not an owner, or unreadable). */
export function useYesterdaySoFar(): { total: number; count: number } | null {
  const { membership } = useSession();
  const now = useNow(5 * 60_000);
  const minute = Math.floor((now - DAY) / 60_000) * 60_000;
  const { payments } = usePaymentsRange(startOfDay(now) - DAY, minute, membership?.role === 'owner');
  if (!payments) return null;
  const s = dayStats(payments, minute);
  return { total: s.total, count: s.count };
}
