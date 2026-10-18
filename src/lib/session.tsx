'use client';

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  reauthenticateWithCredential,
  signOut as fbSignOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { collection, collectionGroup, deleteField, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, db } from './firebase';
import type { BusinessType, Membership, Role } from './types';

export type SessionStatus = 'loading' | 'signedOut' | 'noAccess' | 'ready' | 'error';

export type SessionUser = { uid: string; email: string | null; displayName: string | null; photoURL: string | null };

/** A message safe to show a person, never a backend internal. */
export class FriendlyError extends Error {}

function friendly(e: unknown): FriendlyError {
  const code = String((e as { code?: string })?.code ?? '');
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return new FriendlyError('That email or password is not right.');
  if (/email-already-in-use/.test(code)) return new FriendlyError('An account with this email already exists. Sign in instead.');
  if (/weak-password/.test(code)) return new FriendlyError('Choose a password with at least 6 characters.');
  if (/too-many-requests/.test(code)) return new FriendlyError('Too many attempts. Wait a few minutes and try again.');
  if (/network|unavailable|deadline/.test(code)) return new FriendlyError('No connection. Check your internet and try again.');
  if (/popup-blocked/.test(code)) return new FriendlyError('Your browser blocked the Google window. Allow pop-ups for this site and try again.');
  if (/permission-denied/.test(code)) return new FriendlyError('This account is not allowed to do that.');
  console.warn('[tillsync] unmapped error', code, (e as Error)?.message);
  return new FriendlyError(`Something went wrong. Try again.${code ? ` (${code})` : ''}`);
}

type Ctx = {
  status: SessionStatus;
  user: SessionUser | null;
  membership: Membership | null;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<'ok' | 'cancelled'>;
  resetPassword: (email: string) => Promise<void>;
  createBusiness: (input: { name: string; type: BusinessType; displayName: string }) => Promise<void>;
  /** Saves the signed-in person's own name, phone number and profile photo (a JPEG data URL, or null to remove it). */
  saveProfile: (input: { displayName: string; phone: string; photo: string | null | undefined }) => Promise<void>;
  /** Whether this account signs in with a password (and so can change it). Google accounts cannot. */
  canChangePassword: boolean;
  changePassword: (current: string, next: string) => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

const ALL = { seeOriginalSms: true, searchHistory: true, receiveAlerts: true };

/** Which business, role and permissions this account has: from its own profile, or because an owner added it by account id. */
async function loadMembership(uid: string): Promise<Membership | null> {
  const profile = await getDoc(doc(db, 'users', uid));
  let businessId = profile.data()?.defaultBusinessId as string | undefined;
  if (!businessId) {
    const found = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid), limit(5)));
    businessId = found.docs.find((d) => d.data().status === 'active')?.ref.parent.parent?.id;
  }
  if (!businessId) return null;
  const [biz, member] = await Promise.all([getDoc(doc(db, 'businesses', businessId)), getDoc(doc(db, 'businesses', businessId, 'members', uid))]);
  const m = member.data();
  if (!member.exists() || !m || m.status !== 'active') return null;
  const role: Role = m.role === 'owner' ? 'owner' : m.role === 'till' ? 'till' : 'attendant';
  const p = (m.permissions ?? {}) as Record<string, unknown>;
  return {
    businessId,
    businessName: (biz.data()?.name as string | undefined) ?? 'Your business',
    businessType: (biz.data()?.type as string | undefined) ?? 'Other',
    role,
    displayName: (m.displayName as string | undefined) ?? '',
    phone: (m.phone as string | undefined) ?? '',
    photo: typeof m.photo === 'string' && m.photo.startsWith('data:image/jpeg;base64,') ? m.photo : null,
    permissions: role === 'owner' ? ALL : { seeOriginalSms: p.seeOriginalSms === true, searchHistory: p.searchHistory === true, receiveAlerts: p.alerts !== false },
    tillOnOwnerPhone: biz.data()?.settings?.tillOnOwnerPhone === true,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);

  const resolve = useCallback(async (u: User | null) => {
    if (!u) {
      setUser(null);
      setMembership(null);
      setStatus('signedOut');
      return;
    }
    setUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL });
    try {
      const m = await loadMembership(u.uid);
      setMembership(m);
      setStatus(m ? 'ready' : 'noAccess');
    } catch (e) {
      console.warn('[tillsync] could not load membership', e);
      setMembership(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (u) => void resolve(u)), [resolve]);

  const reload = useCallback(async () => {
    await resolve(auth.currentUser);
  }, [resolve]);

  const value = useMemo<Ctx>(
    () => ({
      status,
      user,
      membership,
      reload,
      signOut: async () => {
        await fbSignOut(auth);
      },
      signInEmail: async (email, password) => {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (e) {
          throw friendly(e);
        }
      },
      signUpEmail: async (email, password) => {
        try {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        } catch (e) {
          throw friendly(e);
        }
      },
      signInGoogle: async () => {
        try {
          await signInWithPopup(auth, new GoogleAuthProvider());
          return 'ok';
        } catch (e) {
          const code = String((e as { code?: string })?.code ?? '');
          if (/popup-closed-by-user|cancelled-popup-request/.test(code)) return 'cancelled';
          throw friendly(e);
        }
      },
      resetPassword: async (email) => {
        try {
          await sendPasswordResetEmail(auth, email.trim());
        } catch (e) {
          throw friendly(e);
        }
      },
      canChangePassword: !!auth.currentUser?.providerData.some((p) => p.providerId === 'password'),
      saveProfile: async ({ displayName, phone, photo }) => {
        const me = auth.currentUser;
        const m = membership;
        if (!me || !m) throw new FriendlyError('Please sign in again.');
        const update: Record<string, unknown> = { displayName: displayName.trim(), phone: phone.trim() };
        if (photo === null) update.photo = deleteField();
        else if (photo) update.photo = photo;
        try {
          await updateDoc(doc(db, 'businesses', m.businessId, 'members', me.uid), update);
          await updateProfile(me, { displayName: displayName.trim() }).catch(() => undefined);
        } catch (e) {
          const code = String((e as { code?: string })?.code ?? '');
          if (/permission-denied/.test(code)) throw new FriendlyError('Those details were not accepted. Check the name, phone number and photo.');
          throw friendly(e);
        }
        await resolve(me);
      },
      changePassword: async (current, next) => {
        const me = auth.currentUser;
        if (!me?.email) throw new FriendlyError('This account has no password.');
        try {
          await reauthenticateWithCredential(me, EmailAuthProvider.credential(me.email, current));
          await updatePassword(me, next);
        } catch (e) {
          const code = String((e as { code?: string })?.code ?? '');
          if (/wrong-password|invalid-credential|invalid-login/.test(code)) throw new FriendlyError('Your current password is not right.');
          if (/weak-password/.test(code)) throw new FriendlyError('Use at least 6 characters for the new password.');
          if (/too-many-requests/.test(code)) throw new FriendlyError('Too many tries. Wait a few minutes and try again.');
          throw friendly(e);
        }
      },
      createBusiness: async ({ name, type, displayName }) => {
        const me = auth.currentUser;
        if (!me) throw new FriendlyError('Please sign in again.');
        // One atomic batch: the security rules require exactly this shape (business, owner membership, profile).
        const biz = doc(collection(db, 'businesses'));
        const batch = writeBatch(db);
        batch.set(biz, { name: name.trim(), type, settings: {}, ownerUid: me.uid, createdAt: serverTimestamp() });
        batch.set(doc(db, 'businesses', biz.id, 'members', me.uid), { uid: me.uid, role: 'owner', status: 'active', displayName: displayName.trim(), permissions: {}, pushStatus: 'unset' });
        batch.set(doc(db, 'users', me.uid), { defaultBusinessId: biz.id });
        try {
          await batch.commit();
        } catch (e) {
          const code = String((e as { code?: string })?.code ?? '');
          if (/permission-denied/.test(code)) throw new FriendlyError('This account already has a business, or is not allowed to create one.');
          throw friendly(e);
        }
        await resolve(me);
      },
    }),
    [status, user, membership, reload, resolve],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Ctx {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
