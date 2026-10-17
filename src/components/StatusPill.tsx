import { Box, Group, Text } from '@mantine/core';

import { deviceHealth, type DeviceHealth } from '@/lib/stats';
import type { Device } from '@/lib/types';
import { tokens } from '@/theme';

export type Tone = 'ok' | 'warn' | 'err' | 'neutral';

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  ok: { bg: tokens.okBg, fg: tokens.okText, dot: tokens.ok },
  warn: { bg: tokens.warnBg, fg: tokens.warnText, dot: tokens.warn },
  err: { bg: tokens.errBg, fg: tokens.err, dot: tokens.err },
  neutral: { bg: tokens.neutralBg, fg: tokens.muted, dot: tokens.subtle },
};

/** Status is never colour alone: always a word, plus a dot. */
export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const t = TONES[tone];
  return (
    <Group gap={6} wrap="nowrap" px={10} h={26} style={{ background: t.bg, borderRadius: 8, width: 'fit-content' }}>
      <Box w={7} h={7} style={{ borderRadius: '50%', background: t.dot }} />
      <Text span fz={12} fw={600} c={t.fg} style={{ letterSpacing: 0.1 }}>
        {label}
      </Text>
    </Group>
  );
}

export const HEALTH: Record<DeviceHealth, { tone: Tone; label: string; advice: string }> = {
  connected: { tone: 'ok', label: 'Connected', advice: 'This phone is reporting and ready to pass on payments.' },
  interrupted: {
    tone: 'err',
    label: 'Not reporting',
    advice: 'We have not heard from this phone for a few minutes. Check it has signal, is charged and still has TillSync running. Payments received meanwhile appear once it reconnects.',
  },
  permission: { tone: 'warn', label: 'SMS access needed', advice: 'Open TillSync on the Till phone and allow SMS access, otherwise payments cannot be passed on.' },
  waiting: { tone: 'neutral', label: 'Waiting for first report', advice: 'This phone is set up but has not reported yet.' },
};

export function DevicePill({ device, now }: { device: Device; now: number }) {
  const h = HEALTH[deviceHealth(device, now)];
  return <StatusPill label={h.label} tone={h.tone} />;
}
