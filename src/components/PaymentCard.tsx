'use client';

import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import { IconArrowDownRight, IconArrowUpRight, IconEye, IconEyeOff } from '@tabler/icons-react';
import Link from 'next/link';

import { formatAmount, formatClock } from '@/lib/format';
import { pctChange } from '@/lib/stats';

import { Money } from './Money';

const SOFT = 'rgba(255,255,255,0.74)';
const CHIP = 'rgba(255,255,255,0.16)';

type Props = {
  total: number;
  count: number;
  yesterday: { total: number; count: number } | null;
  now: number;
  till: { color: string; label: string } | null;
  hidden: boolean;
  onToggleHidden: () => void;
};

/**
 * The day's total as a payment-card panel, for contrast with the white page: flat brand blue, no decoration.
 * The eye hides the amount when someone is looking over your shoulder.
 */
export function PaymentCard({ total, count, yesterday, now, till, hidden, onToggleHidden }: Props) {
  const change = yesterday ? pctChange(total, yesterday.total) : null;
  const up = change !== null && change > 0;
  const flat = change === 0;
  const date = new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const spoken = hidden
    ? `Received today, amount hidden, ${count} ${count === 1 ? 'payment' : 'payments'}`
    : `Received today KSh ${formatAmount(total)} from ${count} ${count === 1 ? 'payment' : 'payments'}${change === null ? '' : flat ? ', same as yesterday at this time' : `, ${up ? 'up' : 'down'} ${Math.abs(change)} percent on yesterday at this time`}`;

  return (
    <Box style={{ background: 'var(--ts-brand-pressed)', borderRadius: 24, padding: '24px 28px', minHeight: 252, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text fw={600} fz={15} c={SOFT}>
          Received today
        </Text>
        <UnstyledButton
          onClick={onToggleHidden}
          aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
          aria-pressed={hidden}
          style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', color: SOFT, marginRight: -8 }}
        >
          {hidden ? <IconEyeOff size={22} /> : <IconEye size={22} />}
        </UnstyledButton>
      </Group>

      <Box role="group" aria-label={spoken} my="md">
        <Money amount={total} size={58} color="#fff" unitColor={SOFT} hidden={hidden} />
        <Group gap={10} mt={14} wrap="wrap" mih={26}>
          {change !== null ? (
            <Group gap={2} px={9} h={26} wrap="nowrap" style={{ background: CHIP, borderRadius: 8 }}>
              {flat ? null : up ? <IconArrowUpRight size={15} /> : <IconArrowDownRight size={15} />}
              <Text span fz={13} fw={700}>
                {flat ? 'Same' : Math.abs(change) > 999 ? '999%+' : `${Math.abs(change)}%`}
              </Text>
            </Group>
          ) : null}
          <Text fz={13.5} c={SOFT}>
            {change !== null
              ? 'vs yesterday, same time'
              : yesterday && yesterday.total === 0
                ? 'Nothing came in yesterday by this time'
                : count === 0
                  ? 'Nothing received yet today'
                  : `${count} ${count === 1 ? 'payment' : 'payments'} so far`}
          </Text>
        </Group>
      </Box>

      <Group justify="space-between" wrap="nowrap" gap="md">
        {till ? (
          <UnstyledButton component={Link} href="/devices" aria-label={`${till.label}. Open devices`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Box w={9} h={9} style={{ borderRadius: '50%', background: till.color }} />
            <Text fz={14} fw={500}>
              {till.label}
            </Text>
          </UnstyledButton>
        ) : (
          <span />
        )}
        <Text fz={13.5} c={SOFT} ta="right">
          {date} · updated {formatClock(now)}
        </Text>
      </Group>
    </Box>
  );
}
