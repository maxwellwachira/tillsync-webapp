'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession, type SessionStatus } from './session';

/** Where each session state belongs. */
function home(status: SessionStatus, role?: string): string | null {
  if (status === 'signedOut') return '/login';
  if (status === 'noAccess') return '/welcome';
  if (status === 'ready') return role === 'till' ? '/till-phone' : '/home';
  return null; // loading / error: stay put
}

/**
 * Keeps a page in the right place for the session: signed-out people go to sign in, people without a business
 * to the welcome screen, and everyone else into the app. Pass the states this page is for.
 */
export function useGate(allowed: SessionStatus[]) {
  const { status, membership } = useSession();
  const router = useRouter();
  const ok = allowed.includes(status);
  useEffect(() => {
    if (ok) return;
    const to = home(status, membership?.role);
    if (to) router.replace(to);
  }, [ok, status, membership?.role, router]);
  return { ok, status };
}
