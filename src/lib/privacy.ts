'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'tillsync.hideAmounts';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Hide amounts when someone is looking over your shoulder. Remembered in this browser; shared across the open tabs of the app. */
export function useHideAmounts(): [boolean, () => void] {
  const hidden = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener('storage', cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener('storage', cb);
      };
    },
    read,
    () => false,
  );
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, read() ? '0' : '1');
    } catch {
      /* private mode: the toggle just won't persist */
    }
    listeners.forEach((l) => l());
  }, []);
  return [hidden, toggle];
}
