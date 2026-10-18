'use client';

import { Timestamp, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { db } from '../firebase';
import { ms, toPayment } from '../data';
import { useSession } from '../session';
import type { Claim, Payment } from '../types';

import { comparison, type Period } from './period';
import { buildReport, type Report } from './report';

/** The query stops at this many payments for a period. A report that reaches it says so. */
export const PAYMENTS_LIMIT = 1000;

type State = { key: string; period: Period; payments: Payment[] | null; claims: Claim[]; before: { total: number; label: string } | null };

async function payments(businessId: string, from: number, to: number): Promise<Payment[] | null> {
  try {
    const snap = await getDocs(
      query(collection(db, 'businesses', businessId, 'payments'), where('receivedAt', '>=', Timestamp.fromMillis(from)), where('receivedAt', '<', Timestamp.fromMillis(to)), orderBy('receivedAt', 'desc'), limit(PAYMENTS_LIMIT)),
    );
    return snap.docs.map((d) => toPayment(d.id, d.data()));
  } catch {
    return null;
  }
}

async function claimsSince(businessId: string, from: number): Promise<Claim[]> {
  try {
    const snap = await getDocs(query(collection(db, 'businesses', businessId, 'claims'), where('claimedAt', '>=', Timestamp.fromMillis(from)), limit(3000)));
    return snap.docs.map((d) => {
      const x = d.data();
      return { code: d.id, uid: String(x.uid ?? ''), displayName: String(x.displayName ?? ''), claimedAt: ms(x.claimedAt) ?? Date.now() };
    });
  } catch {
    return [];
  }
}

/**
 * Loads one period's payments, the claims for them and the total of the period before, and builds the report. While the
 * next period loads, the last report stays (`loading` is true) so the page never flashes empty.
 */
export function useReport(period: Period): { report: Report | null; before: State['before']; loading: boolean; failed: boolean; truncated: boolean; reload: () => void } {
  const { membership } = useSession();
  const businessId = membership?.businessId;
  const [state, setState] = useState<State | null>(null);
  const [tick, setTick] = useState(0);
  const key = `${businessId}:${period.from}:${period.to}:${tick}`;

  useEffect(() => {
    if (!businessId) return;
    let live = true;
    const cmp = comparison(period, Date.now());
    void Promise.all([payments(businessId, period.from, period.to), claimsSince(businessId, period.from), payments(businessId, cmp.from, cmp.to)]).then(([list, claims, prior]) => {
      if (live) setState({ key, period, payments: list, claims, before: prior ? { total: prior.reduce((n, p) => n + p.amount, 0), label: cmp.label } : null });
    });
    return () => {
      live = false;
    };
  }, [businessId, period, key]);

  const shown = state && state.payments ? state : null;
  const report = useMemo(() => (shown ? buildReport(shown.period, shown.payments!, new Map(shown.claims.map((c) => [c.code, c]))) : null), [shown]);
  return {
    report,
    before: shown?.before ?? null,
    loading: state?.key !== key,
    failed: state?.key === key && state.payments === null,
    truncated: (shown?.payments?.length ?? 0) >= PAYMENTS_LIMIT,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
