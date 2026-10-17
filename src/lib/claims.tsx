'use client';

import { notifications } from '@mantine/notifications';
import { Timestamp, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ClaimDialogs, type Pending } from '@/components/ClaimDialogs';
import { db } from './firebase';
import { formatAmount, startOfDay } from './format';
import { CLAIM_WINDOW_MS, shortName } from './sales';
import { useSession } from './session';
import type { Claim, Payment } from './types';

/**
 * How far back claims are loaded. It must reach as far back as the payments the person can open, or an old claimed
 * sale would look unclaimed (and the owner's Claim button would overwrite it): 30 days for anyone who can search
 * history (the Payments page offers 7 and 30 days), and a couple of days for everyone else (today's list).
 */
const HISTORY_DAYS = 31;
const RECENT_DAYS = 2;

type Person = { uid: string; displayName: string };

/** “Jane D.” already ends in a full stop; “Sam” needs one. */
const sentenceEnd = (s: string) => (s.endsWith('.') ? s : `${s}.`);

export type ClaimFlow = {
  /** Take a sale for yourself (asks first). */
  claim: (p: Payment) => void;
  /** Give your own claim back (asks first). */
  unclaim: (p: Payment) => void;
  /** Owner: take someone else's claim off (asks first). */
  remove: (p: Payment) => void;
  /** Owner: choose who made the sale. */
  assign: (p: Payment) => void;
};

type Ctx = {
  claims: ReadonlyMap<string, Claim>;
  uid: string | null;
  isOwner: boolean;
  /** Whether this person may claim this payment (the rules allow attendants only the last 24 hours). */
  canClaim: (p: Payment, now: number) => boolean;
  flow: ClaimFlow;
};

const ClaimsContext = createContext<Ctx | null>(null);

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const { membership, user } = useSession();
  const businessId = membership?.businessId;
  const uid = user?.uid ?? null;
  const isOwner = membership?.role === 'owner';
  // The Till phone is denied by the rules: only owners and attendants listen.
  const enabled = !!businessId && (membership?.role === 'owner' || membership?.role === 'attendant');

  const days = isOwner || membership?.permissions.searchHistory ? HISTORY_DAYS : RECENT_DAYS;
  const [state, setState] = useState<{ key: string; claims: Map<string, Claim> } | null>(null);
  const key = `${businessId}:${days}`;
  useEffect(() => {
    if (!businessId || !enabled) return;
    const from = Timestamp.fromMillis(startOfDay(Date.now()) - days * 86_400_000);
    return onSnapshot(
      query(collection(db, 'businesses', businessId, 'claims'), where('claimedAt', '>=', from)),
      (snap) =>
        setState({
          key,
          claims: new Map(
            snap.docs.map((d) => {
              const x = d.data();
              const t = x.claimedAt as { toMillis?: () => number } | null; // null on the local write echo
              return [d.id, { code: d.id, uid: String(x.uid ?? ''), displayName: String(x.displayName ?? ''), claimedAt: t?.toMillis ? t.toMillis() : Date.now() }] as const;
            }),
          ),
        }),
      () => {},
    );
  }, [businessId, enabled, key, days]);
  const claims = useMemo(() => (state?.key === key ? state.claims : new Map<string, Claim>()), [state, key]);

  const [pending, setPending] = useState<Pending | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const show = useCallback((next: Pending) => {
    setPending(next);
    setOpen(true);
  }, []);

  const write = useCallback(
    async (work: Promise<void>, done: string) => {
      setBusy(true);
      try {
        await work;
        notifications.show({ message: done, color: 'ok' });
      } catch (e) {
        const denied = (e as { code?: string }).code?.includes('permission-denied');
        notifications.show({ message: denied ? 'A colleague may have claimed this one first. Check the list and try again.' : 'Could not save. Check your connection and try again.', color: 'err' });
      } finally {
        setBusy(false);
        setOpen(false);
      }
    },
    [],
  );

  const ref = useCallback((code: string) => doc(db, 'businesses', businessId ?? '-', 'claims', code), [businessId]);
  const put = useCallback((code: string, who: Person) => setDoc(ref(code), { uid: who.uid, displayName: who.displayName, claimedAt: serverTimestamp() }), [ref]);

  const confirm = useCallback(() => {
    if (!pending || busy) return;
    const { kind, payment: p } = pending;
    if (kind === 'claim' && uid) void write(put(p.code, { uid, displayName: membership?.displayName ?? '' }), `Claimed. KSh ${formatAmount(p.amount)} added to your sales.`);
    else if (kind === 'unclaim') void write(deleteDoc(ref(p.code)), 'Undone. That sale is open again.');
    else if (kind === 'remove') void write(deleteDoc(ref(p.code)), 'Claim removed. That sale is unclaimed.');
  }, [pending, busy, uid, membership?.displayName, write, put, ref]);

  const pick = useCallback(
    (person: Person) => {
      if (!pending || busy) return;
      void write(put(pending.payment.code, person), person.uid === uid ? 'Claimed. That sale is yours.' : `Assigned to ${sentenceEnd(shortName(person.displayName))}`);
    },
    [pending, busy, uid, write, put],
  );

  const flow = useMemo<ClaimFlow>(
    () => ({
      claim: (payment) => show({ kind: 'claim', payment }),
      unclaim: (payment) => show({ kind: 'unclaim', payment }),
      remove: (payment) => show({ kind: 'remove', payment }),
      assign: (payment) => show({ kind: 'assign', payment }),
    }),
    [show],
  );

  const value = useMemo<Ctx>(
    () => ({ claims, uid, isOwner, canClaim: (p, now) => isOwner || now - p.receivedAt < CLAIM_WINDOW_MS, flow }),
    [claims, uid, isOwner, flow],
  );

  return (
    <ClaimsContext.Provider value={value}>
      {children}
      <ClaimDialogs pending={pending} open={open} busy={busy} currentUid={pending ? claims.get(pending.payment.code)?.uid : undefined} myUid={uid} onConfirm={confirm} onPick={pick} onClose={() => !busy && setOpen(false)} />
    </ClaimsContext.Provider>
  );
}

export function useClaims(): Ctx {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error('useClaims must be used inside <ClaimsProvider>');
  return ctx;
}
