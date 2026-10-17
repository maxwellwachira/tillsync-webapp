'use client';

import { Alert, Anchor, Button, Grid, Group, Paper, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconArrowRight, IconDeviceMobile, IconInbox } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { DaysChart } from '@/components/DaysChart';
import { Page } from '@/components/PageHeader';
import { PaymentCard } from '@/components/PaymentCard';
import { PaymentDrawer } from '@/components/PaymentDrawer';
import { PaymentsTable } from '@/components/PaymentsTable';
import { SalesByPerson } from '@/components/SalesByPerson';
import { StatCard } from '@/components/StatCard';
import { useClaims } from '@/lib/claims';
import { salesByPerson } from '@/lib/sales';
import { useDevices, usePaymentsRange, usePaymentsToday } from '@/lib/data';
import { formatAmount, formatClock, greeting, startOfDay } from '@/lib/format';
import { useNow, useYesterdaySoFar } from '@/lib/hooks';
import { useHideAmounts } from '@/lib/privacy';
import { useSession } from '@/lib/session';
import { dailyTotals, dayStats, onlyToday, worstHealth } from '@/lib/stats';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

const DAYS = 7;

export default function Home() {
  const { membership, user } = useSession();
  const { claims } = useClaims();
  const { payments: all, loading } = usePaymentsToday();
  const { devices } = useDevices();
  const now = useNow(30_000);
  const [hidden, toggleHidden] = useHideAmounts();
  const yesterday = useYesterdaySoFar();
  const [selected, setSelected] = useState<Payment | null>(null);

  // Today only (the list is live and can outlive midnight).
  const today = useMemo(() => onlyToday(all, now), [all, now]);
  const stats = useMemo(() => dayStats(today, now), [today, now]);
  const split = useMemo(() => salesByPerson(today, claims), [today, claims]);

  // The earlier days come once; today's come live, so the last bar moves as payments arrive.
  const dayStart = startOfDay(now);
  const { payments: earlier } = usePaymentsRange(dayStart - (DAYS - 1) * 86_400_000, dayStart, true);
  const days = useMemo(() => dailyTotals([...(earlier ?? []), ...today], now, DAYS), [earlier, today, now]);

  const health = devices ? worstHealth(devices, now) : null;
  const lastHeard = devices?.map((d) => d.lastHeartbeat).filter((t): t is number => t !== null).sort((a, b) => b - a)[0];
  const till = !devices
    ? null
    : health === null
      ? { color: tokens.subtle, label: 'No Till phone connected' }
      : health === 'connected'
        ? { color: '#7FE3AE', label: 'Till phone connected' }
        : health === 'interrupted'
          ? { color: '#FF9B90', label: 'Till phone not reporting' }
          : { color: '#FFD878', label: health === 'permission' ? 'Till phone needs SMS access' : 'Till phone waiting for its first report' };
  const first = (membership?.displayName ?? '').split(' ')[0] || 'there';

  return (
    <Page title={`${greeting(now)}, ${first}`} subtitle={new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
      {health === 'interrupted' ? (
        <Alert color="err" variant="light" radius="md" icon={<IconAlertTriangle size={20} />} title={lastHeard ? `Till phone last reported at ${formatClock(lastHeard)}` : 'Till phone is not reporting'}>
          Totals may be missing payments since. Ask the person holding the phone to confirm large payments.{' '}
          <Anchor component={Link} href="/devices" fw={600} fz="sm">
            View device
          </Anchor>
        </Alert>
      ) : devices && devices.length === 0 ? (
        <Alert color="brand" variant="light" radius="md" icon={<IconDeviceMobile size={20} />} title="Connect your Till phone">
          Payments appear here once the phone holding your Till SIM is connected.{' '}
          <Anchor component={Link} href="/devices" fw={600} fz="sm">
            How to connect it
          </Anchor>
        </Alert>
      ) : null}

      <Grid gap="lg" align="stretch">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          {loading ? <Skeleton h={252} radius={24} /> : <PaymentCard total={stats.total} count={stats.count} yesterday={yesterday} now={now} till={till} hidden={hidden} onToggleHidden={toggleHidden} />}
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <SimpleGrid cols={2} spacing="md" h="100%">
            <StatCard label="Payments" value={stats.count} hint="today" />
            <StatCard label="Average" value={stats.count ? (hidden ? 'KSh ••••' : `KSh ${formatAmount(stats.average)}`) : '—'} hint={stats.count && !hidden ? `median KSh ${formatAmount(stats.median)}` : undefined} />
            <StatCard label="Last hour" value={health === 'interrupted' ? '—' : stats.lastHour} hint={health === 'interrupted' ? 'unknown while not reporting' : 'payments'} />
            <StatCard label="Busiest hour" value={stats.busiestHour === null ? '—' : `${String(stats.busiestHour).padStart(2, '0')}:00`} hint="by number of payments" />
          </SimpleGrid>
        </Grid.Col>
      </Grid>

      <DaysChart days={days} hidden={hidden} now={now} />

      {today.length > 0 ? <SalesByPerson sales={split} myUid={user?.uid ?? null} hidden={hidden} /> : null}

      <Paper withBorder style={{ borderColor: tokens.line, overflow: 'hidden' }}>
        <Group justify="space-between" p="lg" pb="xs">
          <Text fw={700} fz={17}>
            Latest payments
          </Text>
          {today.length > 0 ? (
            <Anchor component={Link} href="/payments" fz="sm" fw={600} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View all <IconArrowRight size={15} />
            </Anchor>
          ) : null}
        </Group>
        {loading ? (
          <Stack p="lg" gap="sm">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} h={44} radius="md" />
            ))}
          </Stack>
        ) : today.length === 0 ? (
          <Stack align="center" gap={6} py={44} px="lg">
            <IconInbox size={30} color={tokens.subtle} />
            <Text fw={600}>Nothing received yet today</Text>
            <Text c="dimmed" fz={14} ta="center" maw={380}>
              When a customer pays the Till, it shows here within seconds.
            </Text>
            <Button component={Link} href="/payments" variant="light" mt="sm" size="sm">
              See earlier payments
            </Button>
          </Stack>
        ) : (
          <PaymentsTable payments={today.slice(0, 6)} now={now} hidden={hidden} onSelect={setSelected} />
        )}
      </Paper>

      <Text fz={12.5} c="dimmed" ta="center">
        Totals come from M-Pesa messages on your Till phone, not from verified settlement.
      </Text>

      <PaymentDrawer payment={selected} hidden={hidden} now={now} onClose={() => setSelected(null)} />
    </Page>
  );
}
