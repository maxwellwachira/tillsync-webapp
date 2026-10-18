'use client';

import { Timestamp, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { db } from './firebase';
import { startOfDay } from './format';
import { useSession } from './session';
import type { Device, Member, Payment, Role } from './types';

export const ms = (v: unknown): number | null => {
  const t = v as { toMillis?: () => number } | null | undefined;
  return t?.toMillis ? t.toMillis() : null;
};

export function toPayment(id: string, x: Record<string, unknown>): Payment {
  const received = ms(x.receivedAt) ?? Date.now();
  return {
    code: id,
    amount: Number(x.amount),
    payerDisplay: String(x.payerDisplay ?? ''),
    phoneMasked: String(x.phoneMasked ?? ''),
    receivedAt: received,
    syncedAt: ms(x.syncedAt) ?? received, // pending (null) on the local write echo
    tillId: String(x.tillId ?? ''),
  };
}

/**
 * Today's payments, live. Re-subscribes at local midnight so "today" never goes stale in a tab left open overnight.
 * A Till phone can't read payments (it only writes them), so nothing is requested for that role.
 */
export function usePaymentsToday(): { payments: Payment[]; loading: boolean; error: boolean } {
  const { membership } = useSession();
  const businessId = membership?.businessId;
  const canRead = !!membership && membership.role !== 'till';
  const [state, setState] = useState<{ key: string; payments: Payment[]; error: boolean } | null>(null);
  const [dayKey, setDayKey] = useState(() => startOfDay(Date.now()));

  useEffect(() => {
    const next = startOfDay(Date.now()) + 86_400_000 + 1_000 - Date.now();
    const t = setTimeout(() => setDayKey(startOfDay(Date.now())), next);
    return () => clearTimeout(t);
  }, [dayKey]);

  const key = `${businessId}:${dayKey}`;
  useEffect(() => {
    if (!businessId || !canRead) return;
    return onSnapshot(
      query(collection(db, 'businesses', businessId, 'payments'), where('receivedAt', '>=', Timestamp.fromMillis(dayKey)), orderBy('receivedAt', 'desc'), limit(500)),
      (snap) => setState({ key, payments: snap.docs.map((d) => toPayment(d.id, d.data())), error: false }),
      () => setState({ key, payments: [], error: true }),
    );
  }, [businessId, canRead, dayKey, key]);

  const current = state?.key === key ? state : null;
  return { payments: current?.payments ?? [], loading: canRead && !current, error: current?.error ?? false };
}

/** A past window of payments, fetched once (owners, or members allowed to search history). `null` when unavailable. */
export function usePaymentsRange(fromMs: number, toMs: number, enabled: boolean): { payments: Payment[] | null; loading: boolean; refresh: () => void } {
  const { membership } = useSession();
  const businessId = membership?.businessId;
  const [result, setResult] = useState<{ key: string; payments: Payment[] | null } | null>(null);
  const [tick, setTick] = useState(0);
  const key = `${businessId}:${fromMs}:${toMs}:${tick}`;

  useEffect(() => {
    if (!businessId || !enabled) return;
    let live = true;
    getDocs(
      query(
        collection(db, 'businesses', businessId, 'payments'),
        where('receivedAt', '>=', Timestamp.fromMillis(fromMs)),
        where('receivedAt', '<', Timestamp.fromMillis(toMs)),
        orderBy('receivedAt', 'desc'),
        limit(1000),
      ),
    )
      .then((snap) => live && setResult({ key, payments: snap.docs.map((d) => toPayment(d.id, d.data())) }))
      .catch(() => live && setResult({ key, payments: null }));
    return () => {
      live = false;
    };
  }, [businessId, enabled, fromMs, toMs, key]);

  const current = result?.key === key ? result : null;
  return { payments: current?.payments ?? null, loading: enabled && !current, refresh: () => setTick((t) => t + 1) };
}

export function useDevices(): { devices: Device[] | null; error: boolean } {
  const { membership } = useSession();
  const businessId = membership?.businessId;
  const [state, setState] = useState<{ id: string; devices: Device[]; error: boolean } | null>(null);
  useEffect(() => {
    if (!businessId) return;
    return onSnapshot(
      collection(db, 'businesses', businessId, 'devices'),
      (snap) =>
        setState({
          id: businessId,
          error: false,
          devices: snap.docs.map((d): Device => {
            const x = d.data();
            return {
              id: d.id,
              label: String(x.label ?? 'Till phone'),
              lastHeartbeat: ms(x.lastHeartbeat),
              lastSms: ms(x.lastSms),
              lastSync: ms(x.lastSync),
              pending: Number(x.pending ?? 0),
              battery: typeof x.battery === 'number' ? x.battery : null,
              charging: x.charging === true,
              smsPermission: x.permissions?.sms !== false,
              appVersion: String(x.appVersion ?? ''),
            };
          }),
        }),
      () => setState({ id: businessId, devices: [], error: true }),
    );
  }, [businessId]);
  const cur = state?.id === businessId ? state : null;
  return { devices: cur ? cur.devices : null, error: cur?.error ?? false };
}

const ROLES: Role[] = ['owner', 'attendant', 'till'];

/** The team, live. Owners only (the rules let attendants read just their own membership). */
export function useMembers(): { members: Member[] | null; error: boolean } {
  const { membership } = useSession();
  const businessId = membership?.businessId;
  const owner = membership?.role === 'owner';
  const [state, setState] = useState<{ id: string; members: Member[]; error: boolean } | null>(null);
  useEffect(() => {
    if (!businessId || !owner) return;
    return onSnapshot(
      collection(db, 'businesses', businessId, 'members'),
      (snap) =>
        setState({
          id: businessId,
          error: false,
          members: snap.docs
            .map((d): Member => {
              const x = d.data();
              return {
                uid: d.id,
                displayName: String(x.displayName ?? 'Unnamed'),
                role: ROLES.find((r) => r === x.role) ?? 'attendant',
                status: String(x.status ?? 'active'),
                permissions: Object.fromEntries(Object.entries((x.permissions ?? {}) as Record<string, unknown>).map(([k, v]) => [k, v === true])),
              };
            })
            .filter((m) => m.status !== 'removed')
            .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.displayName.localeCompare(b.displayName)),
        }),
      () => setState({ id: businessId, members: [], error: true }),
    );
  }, [businessId, owner]);
  const cur = state?.id === businessId ? state : null;
  return { members: cur ? cur.members : null, error: cur?.error ?? false };
}

/** Write-side business actions. The Firestore rules are the real gatekeeper: these only ever succeed for an owner. */
export function useBusinessActions() {
  const { membership } = useSession();
  const businessId = membership?.businessId ?? '';
  const base = useCallback((...path: string[]) => doc(db, 'businesses', businessId, ...path), [businessId]);

  return {
    async addMember(input: { uid: string; displayName: string; role: 'attendant' | 'till'; permissions: Record<string, boolean> }) {
      const ref = base('members', input.uid);
      if ((await getDoc(ref)).exists()) throw new Error('already-member');
      await setDoc(ref, { uid: input.uid, role: input.role, status: 'active', displayName: input.displayName, permissions: input.permissions, pushStatus: 'unset' });
    },
    async setPermissions(uid: string, permissions: Record<string, boolean>) {
      await updateDoc(base('members', uid), { permissions });
    },
    async setMemberActive(uid: string, active: boolean) {
      await updateDoc(base('members', uid), { status: active ? 'active' : 'removed' });
    },
    async renameBusiness(name: string) {
      await updateDoc(base(), { name: name.trim() });
    },
    /** The original M-Pesa message (it includes the account balance), for members allowed to see it. */
    async getOriginalSms(code: string): Promise<string | null> {
      try {
        const s = await getDoc(base('payments_sms', code));
        return s.exists() ? String(s.data().text ?? '') : null;
      } catch {
        return null;
      }
    },
  };
}
