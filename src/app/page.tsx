'use client';

import { Splash } from '@/components/Splash';
import { useGate } from '@/lib/useGate';

/** The front door only decides where you belong. */
export default function Index() {
  useGate([]);
  return <Splash />;
}
