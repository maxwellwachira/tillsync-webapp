'use client';

import { Anchor, Box, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Money } from '@/components/Money';
import { Page } from '@/components/PageHeader';
import { PaymentDrawer } from '@/components/PaymentDrawer';
import { PaymentsTable } from '@/components/PaymentsTable';
import { useClaims } from '@/lib/claims';
import { usePaymentsToday } from '@/lib/data';
import { formatAmount, formatClock } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useHideAmounts } from '@/lib/privacy';
import { mySales } from '@/lib/sales';
import { onlyToday } from '@/lib/stats';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

/** An attendant's day: what they made, the sales they claimed, and how many payments nobody has claimed yet. */
export default function MySales() {
  const now = useNow(30_000);
  const [hidden] = useHideAmounts();
  const { claims, uid } = useClaims();
  const { payments: live, loading } = usePaymentsToday();
  const [selected, setSelected] = useState<Payment | null>(null);

  const today = useMemo(() => onlyToday(live, now), [live, now]);
  const s = useMemo(() => mySales(today, claims, uid), [today, claims, uid]);
  const last = s.mine[0];

  return (
    <Page title="My sales" subtitle="What you made today, from the sales you claimed" width={980}>
      <Paper p="xl" radius={24} style={{ background: tokens.brandTint }}>
        <Text fz={12.5} fw={700} c="dimmed" style={{ letterSpacing: 0.6 }}>
          YOU MADE TODAY
        </Text>
        <Box mt={8}>
          <Money amount={s.total} size={52} hidden={hidden} />
        </Box>
        <Text c="dimmed" fz={15} mt={8}>
          {s.count === 0 ? 'No sales claimed yet' : `${s.count} ${s.count === 1 ? 'sale' : 'sales'} · last at ${formatClock(last!.receivedAt)}`}
        </Text>
      </Paper>

      {s.unclaimed.length > 0 ? (
        <Paper withBorder p="lg" style={{ borderColor: tokens.line, background: tokens.surface }}>
          <Group justify="space-between" wrap="wrap" gap="md">
            <Text fz={14.5} maw={560}>
              <Text span fw={700}>
                {s.unclaimed.length} {s.unclaimed.length === 1 ? 'payment is' : 'payments are'} still unclaimed.{' '}
              </Text>
              Together that is {hidden ? 'KSh ••••' : `KSh ${formatAmount(s.unclaimedTotal)}`}. Served a customer? Claim their payment so it counts for you.
            </Text>
            <Button component={Link} href="/payments" variant="light">
              See unclaimed payments
            </Button>
          </Group>
        </Paper>
      ) : null}

      <Paper withBorder style={{ borderColor: tokens.line, overflow: 'hidden' }}>
        <Group px="lg" py="md" style={{ borderBottom: `1px solid ${tokens.line}` }}>
          <Text fw={700} fz={17}>
            Your sales
          </Text>
        </Group>
        {loading ? (
          <Stack align="center" py={48}>
            <Loader size="sm" type="dots" />
          </Stack>
        ) : s.count === 0 ? (
          <Stack align="center" gap={6} py={48} px="lg">
            <IconInbox size={30} color={tokens.subtle} />
            <Text fw={600}>{s.unclaimed.length > 0 ? 'Nothing claimed yet' : 'Nothing to claim yet'}</Text>
            <Text c="dimmed" fz={14} ta="center" maw={420}>
              When you serve a customer, open{' '}
              <Anchor component={Link} href="/payments" fz={14} fw={600}>
                Payments
              </Anchor>{' '}
              and click Claim on their payment. It lands here and adds to your total.
            </Text>
          </Stack>
        ) : (
          <PaymentsTable payments={s.mine} now={now} hidden={hidden} onSelect={setSelected} />
        )}
      </Paper>

      <Text fz={12.5} c="dimmed" ta="center">
        Totals come from M-Pesa messages on the Till phone, not from verified settlement.
      </Text>

      <PaymentDrawer payment={selected} hidden={hidden} now={now} onClose={() => setSelected(null)} />
    </Page>
  );
}
