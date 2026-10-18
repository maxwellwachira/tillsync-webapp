'use client';

import { Button, Chip, Group, Loader, Pagination, Paper, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { IconDownload, IconInbox, IconSearch, IconX } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import { Page } from '@/components/PageHeader';
import { PaymentDrawer } from '@/components/PaymentDrawer';
import { PaymentsTable } from '@/components/PaymentsTable';
import { downloadCsv, paymentsCsv } from '@/lib/csv';
import { useClaims } from '@/lib/claims';
import { usePaymentsRange, usePaymentsToday } from '@/lib/data';
import { formatAmount, startOfDay } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useHideAmounts } from '@/lib/privacy';
import { useSession } from '@/lib/session';
import { onlyToday } from '@/lib/stats';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

const PAGE_SIZE = 25;
const BANDS = [
  { value: 'all', label: 'Any amount', test: () => true },
  { value: 'u1k', label: 'Under 1,000', test: (n: number) => n < 1000 },
  { value: 'm', label: '1,000 – 4,999', test: (n: number) => n >= 1000 && n < 5000 },
  { value: 'h', label: '5,000 and over', test: (n: number) => n >= 5000 },
];

export default function Payments() {
  const { membership } = useSession();
  const { claims } = useClaims();
  const now = useNow(30_000);
  const [hidden] = useHideAmounts();
  const { payments: live, loading, error } = usePaymentsToday();
  const owner = membership?.role === 'owner';
  const canHistory = owner || !!membership?.permissions.searchHistory;

  const [period, setPeriod] = useState<'today' | '7' | '30'>('today');
  const [q, setQ] = useState('');
  const [band, setBand] = useState('all');
  const [status, setStatus] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);

  const days = period === 'today' ? 0 : Number(period);
  const dayStart = startOfDay(now);
  const { payments: earlier, loading: loadingEarlier } = usePaymentsRange(dayStart - (days - 1) * 86_400_000, dayStart, canHistory && days > 0);

  const pool = useMemo(() => {
    const today = onlyToday(live, now);
    if (days === 0) return today;
    return [...today, ...(earlier ?? [])].sort((a, b) => b.receivedAt - a.receivedAt);
  }, [live, earlier, days, now]);

  const query = q.trim().toLowerCase().replace(/,/g, '');
  const results = useMemo(() => {
    const test = BANDS.find((b) => b.value === band)!.test;
    return pool.filter((p) => test(p.amount) && (status === 'all' || (status === 'claimed') === claims.has(p.code)) && (!query || p.code.toLowerCase().includes(query) || String(p.amount).includes(query) || p.payerDisplay.toLowerCase().includes(query)));
  }, [pool, query, band, status, claims]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const total = results.reduce((s, p) => s + p.amount, 0);
  const filtering = query !== '' || band !== 'all' || status !== 'all';
  const unclaimedCount = useMemo(() => pool.filter((p) => !claims.has(p.code) && (owner || now - p.receivedAt < 24 * 3_600_000)).length, [pool, claims, owner, now]);
  const busy = loading || (days > 0 && loadingEarlier);

  return (
    <Page
      title="Payments"
      subtitle={period === 'today' ? 'Everything received today, live' : `Everything received in the last ${period} days`}
      actions={
        owner ? (
          <Button variant="default" leftSection={<IconDownload size={17} />} disabled={results.length === 0} onClick={() => downloadCsv(`tillsync-payments-${new Date(now).toISOString().slice(0, 10)}.csv`, paymentsCsv(results, claims))}>
            Export CSV
          </Button>
        ) : undefined
      }
    >
      <Stack gap="md">
        <Group gap="md" wrap="wrap" align="center">
          <TextInput
            placeholder="Search by code, amount or name"
            aria-label="Search payments"
            leftSection={<IconSearch size={18} />}
            rightSection={q ? <IconX size={16} style={{ cursor: 'pointer' }} onClick={() => setQ('')} aria-label="Clear search" /> : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.currentTarget.value);
              setPage(1);
            }}
            style={{ flex: '1 1 280px', maxWidth: 420 }}
            radius="xl"
          />
          {canHistory ? (
            <SegmentedControl
              value={period}
              onChange={(v) => {
                setPeriod(v as typeof period);
                setPage(1);
              }}
              data={[
                { value: 'today', label: 'Today' },
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
              ]}
              aria-label="Period"
            />
          ) : null}
        </Group>
        <SegmentedControl
          value={status}
          onChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
          data={[
            { value: 'all', label: 'All' },
            { value: 'claimed', label: 'Claimed' },
            { value: 'unclaimed', label: `Unclaimed${unclaimedCount ? ` · ${unclaimedCount}` : ''}` },
          ]}
          aria-label="Which payments"
          w="fit-content"
        />
        <Chip.Group multiple={false} value={band} onChange={(v) => { setBand(v); setPage(1); }}>
          <Group gap={8}>
            {BANDS.map((b) => (
              <Chip key={b.value} value={b.value} variant="light" radius="md">
                {b.label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Stack>

      <Paper withBorder style={{ borderColor: tokens.line, overflow: 'hidden' }}>
        <Group justify="space-between" px="lg" py="md" style={{ borderBottom: `1px solid ${tokens.line}` }}>
          <Text fz={14} c="dimmed">
            {busy ? 'Loading…' : status !== 'all' ? `${results.length} ${status}` : `${results.length} ${results.length === 1 ? 'payment' : 'payments'}${filtering ? ' match' : ''}`}
          </Text>
          <Text fz={14} fw={600} className="tnum">
            {busy || results.length === 0 ? '' : hidden ? 'KSh ••••' : `KSh ${formatAmount(total)}`}
          </Text>
        </Group>

        {error ? (
          <Stack align="center" py={56}>
            <Text fw={600}>Couldn’t load payments</Text>
            <Text c="dimmed" fz={14}>
              Check your connection and try again.
            </Text>
          </Stack>
        ) : busy && results.length === 0 ? (
          <Stack align="center" py={56}>
            <Loader size="sm" type="dots" />
          </Stack>
        ) : results.length === 0 ? (
          <Stack align="center" gap={6} py={56} px="lg">
            <IconInbox size={32} color={tokens.subtle} />
            <Text fw={600}>{status === 'unclaimed' && !query && band === 'all' ? 'Nothing is unclaimed' : status === 'claimed' && !query && band === 'all' ? 'Nothing has been claimed yet' : filtering ? 'Nothing matches' : period === 'today' ? 'No payments yet today' : 'No payments in this period'}</Text>
            <Text c="dimmed" fz={14} ta="center" maw={420}>
              {status === 'unclaimed' && !query && band === 'all'
                ? 'Every payment here has a name on it.'
                : status === 'claimed' && !query && band === 'all'
                  ? 'Payments appear here once someone claims them.'
                  : filtering
                ? 'Try part of the code, the amount without commas, or clear the filters. If the payment is real, it may still be on its way from the Till phone.'
                : 'When a customer pays the Till, it shows here within seconds.'}
            </Text>
            {filtering ? (
              <Button
                variant="light"
                size="sm"
                mt="xs"
                onClick={() => {
                  setQ('');
                  setBand('all');
                  setStatus('all');
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </Stack>
        ) : (
          <>
            <PaymentsTable payments={visible} now={now} hidden={hidden} withDay={days > 0} onSelect={setSelected} />
            {pages > 1 ? (
              <Group justify="center" p="md" style={{ borderTop: `1px solid ${tokens.line}` }}>
                <Pagination value={current} onChange={setPage} total={pages} size="sm" radius="xl" />
              </Group>
            ) : null}
          </>
        )}
      </Paper>

      <PaymentDrawer payment={selected} hidden={hidden} now={now} onClose={() => setSelected(null)} />
    </Page>
  );
}
