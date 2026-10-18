'use client';

import { ActionIcon, Badge, Box, Button, Group, Loader, Menu, Paper, Popover, Progress, SegmentedControl, Stack, Text } from '@mantine/core';
import { DatePicker, type DatesRangeValue } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconDownload, IconFileTypeCsv, IconPrinter } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Money } from '@/components/Money';
import { Page } from '@/components/PageHeader';
import { useHideAmounts } from '@/lib/privacy';
import { useNow } from '@/lib/hooks';
import { formatAmount, initials } from '@/lib/format';
import { downloadReportCsv, printReport } from '@/lib/reports/exportFiles';
import { MAX_CUSTOM_DAYS, customPeriod, dayCount, isCurrent, periodAt, periodLabel, relativeName, shiftPeriod, type Period, type PeriodKind } from '@/lib/reports/period';
import { PAYMENTS_LIMIT, useReport } from '@/lib/reports/useReport';
import { useSession } from '@/lib/session';
import { tokens } from '@/theme';

const dayName = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const hourName = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const pct = (now: number, prior: number) => (prior > 0 ? Math.round(((now - prior) / prior) * 100) : null);
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export default function Reports() {
  const router = useRouter();
  const { membership, user } = useSession();
  const now = useNow(30_000);
  const [hidden] = useHideAmounts();
  const [period, setPeriod] = useState<Period>(() => periodAt('day', Date.now()));
  const [picked, setPicked] = useState<{ period: string; key: string } | null>(null);
  const [calendar, setCalendar] = useState(false);
  const [range, setRange] = useState<DatesRangeValue>([null, null]);
  const { report, before, loading, failed, truncated, reload } = useReport(period);

  const owner = membership?.role === 'owner';
  useEffect(() => {
    if (membership && !owner) router.replace('/payments');
  }, [membership, owner, router]);
  if (!owner) return null;

  const current = isCurrent(period, now);
  const isDay = report?.period.kind === 'day';
  const empty = !!report && report.count === 0;
  const money = (n: number) => (hidden ? 'KSh ••••' : `KSh ${formatAmount(n)}`);

  const bars = report
    ? isDay
      ? report.hours.map((h) => ({ key: String(h.hour), value: h.total, count: h.count, label: h.hour % 6 === 0 ? hourName(h.hour) : '', title: `${hourName(h.hour)} to ${hourName((h.hour + 1) % 24)}` }))
      : report.days.map((d, i, all) => ({
          key: String(d.day),
          value: d.total,
          count: d.count,
          label: report.period.kind === 'week' ? new Date(d.day).toLocaleDateString('en-GB', { weekday: 'short' }) : i === 0 || i === all.length - 1 || (i + 1) % 7 === 1 ? String(new Date(d.day).getDate()) : '',
          title: dayName(d.day),
        }))
    : [];
  const best = bars.reduce<(typeof bars)[number] | null>((b, x) => (x.value > 0 && (!b || x.value > b.value) ? x : b), null);
  const periodKey = `${period.from}:${period.to}`;
  const selectedKey = picked?.period === periodKey ? picked.key : (best?.key ?? null);
  const selected = bars.find((b) => b.key === selectedKey) ?? null;
  const max = Math.max(1, ...bars.map((b) => b.value));

  const change = report && before ? pct(report.total, before.total) : null;
  const delta = report && before ? report.total - before.total : 0;

  function setKind(kind: string) {
    if (kind === 'custom') return setCalendar(true);
    setPeriod(periodAt(kind as Exclude<PeriodKind, 'custom'>, current || period.kind === 'custom' ? Date.now() : period.from));
  }
  const rangeDays = range[0] && range[1] ? dayCount(customPeriod(midnight(range[0] as unknown as Date), midnight(range[1] as unknown as Date))) : 0;
  function preset(daysBack: number) {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - daysBack);
    setRange([start, end] as unknown as DatesRangeValue);
  }

  return (
    <Page
      title="Reports"
      subtitle={`${relativeName(period, now)} · ${periodLabel(period)}`}
      actions={
        <Menu position="bottom-end" width={300} disabled={!report || empty}>
          <Menu.Target>
            <Button leftSection={<IconDownload size={17} />} disabled={!report || empty || loading}>
              Export report
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPrinter size={18} />} onClick={() => report && printReport(report, membership?.businessName ?? 'TillSync')}>
              <Text fw={600} fz={14.5}>PDF report</Text>
              <Text fz={12.5} c="dimmed">A printable summary with every payment. Choose “Save as PDF” in the print window.</Text>
            </Menu.Item>
            <Menu.Item leftSection={<IconFileTypeCsv size={18} />} onClick={() => report && downloadReportCsv(report)}>
              <Text fw={600} fz={14.5}>CSV spreadsheet</Text>
              <Text fz={12.5} c="dimmed">One row per payment, with who sold it. Opens in Excel or Google Sheets.</Text>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      }
      width={980}
    >
      <Group justify="space-between" wrap="wrap" gap="md">
        <Popover opened={calendar} onChange={setCalendar} position="bottom-start" shadow="md" withArrow={false} width={340}>
          <Popover.Target>
            <SegmentedControl
              value={period.kind}
              onChange={setKind}
              data={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'custom', label: 'Custom' },
              ]}
              aria-label="Report period"
              size="md"
            />
          </Popover.Target>
          <Popover.Dropdown p="md">
            <Stack gap="sm">
              <Text fw={700}>Choose dates</Text>
              <Group gap={6}>
                <Button size="compact-sm" variant="light" onClick={() => preset(6)}>Last 7 days</Button>
                <Button size="compact-sm" variant="light" onClick={() => preset(29)}>Last 30 days</Button>
              </Group>
              <DatePicker type="range" value={range} onChange={setRange} maxDate={new Date()} firstDayOfWeek={1} allowSingleDateInRange />
              <Text fz={13} c={rangeDays > MAX_CUSTOM_DAYS ? 'err.7' : 'dimmed'}>
                {!range[0] ? 'Click the first day.' : !range[1] ? 'Click a later day to finish, or use this single day.' : rangeDays > MAX_CUSTOM_DAYS ? `That is ${rangeDays} days. Pick ${MAX_CUSTOM_DAYS} or fewer.` : `${rangeDays} ${rangeDays === 1 ? 'day' : 'days'}`}
              </Text>
              <Group grow gap="xs">
                <Button variant="default" onClick={() => setCalendar(false)}>Cancel</Button>
                <Button
                  disabled={!range[0] || rangeDays > MAX_CUSTOM_DAYS}
                  onClick={() => {
                    const a = midnight(range[0] as unknown as Date);
                    const b = midnight((range[1] ?? range[0]) as unknown as Date);
                    setPeriod(customPeriod(a, b));
                    setCalendar(false);
                  }}
                >
                  Show report
                </Button>
              </Group>
            </Stack>
          </Popover.Dropdown>
        </Popover>

        <Group gap={4}>
          <ActionIcon variant="default" size={40} onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label={`Previous ${period.kind === 'custom' ? 'range' : period.kind}`}>
            <IconChevronLeft size={20} />
          </ActionIcon>
          <ActionIcon variant="default" size={40} disabled={current} onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label={`Next ${period.kind === 'custom' ? 'range' : period.kind}`}>
            <IconChevronRight size={20} />
          </ActionIcon>
        </Group>
      </Group>

      {!report && loading ? (
        <Stack align="center" py={72}>
          <Loader size="sm" type="dots" />
        </Stack>
      ) : failed || !report ? (
        <Paper withBorder p="lg" style={{ borderColor: tokens.line }}>
          <Text fw={600}>Could not load this report</Text>
          <Text c="dimmed" fz={14} mb="sm">Check your connection and try again.</Text>
          <Button size="sm" variant="light" onClick={reload}>Try again</Button>
        </Paper>
      ) : (
        <Stack gap={28} style={{ opacity: loading ? 0.45 : 1, transition: 'opacity .15s' }}>
          <Box p="xl" style={{ background: tokens.brandTint, borderRadius: 24 }}>
            <Text fz={12.5} fw={700} c="dimmed" style={{ letterSpacing: 0.6 }}>
              RECEIVED{current ? ' SO FAR' : ''}
            </Text>
            <Box mt={8}>
              <Money amount={report.total} size={52} hidden={hidden} />
            </Box>
            {before ? (
              <Group gap={10} mt={12}>
                {change !== null && delta !== 0 ? (
                  <Badge size="lg" variant="light" color={delta > 0 ? 'ok' : 'gray'} radius="sm">
                    {delta > 0 ? '↑' : '↓'} {Math.abs(change) > 999 ? '999%+' : `${Math.abs(change)}%`}
                  </Badge>
                ) : null}
                <Text fz={14} c="dimmed">
                  {before.total === 0 ? `Nothing to compare: no payments ${before.label.replace('vs ', '')}` : delta === 0 ? `Same as ${before.label.replace('vs ', '')}` : `${before.label}: ${money(before.total)}`}
                </Text>
              </Group>
            ) : null}
            <Group gap={48} mt={22}>
              <Fact label="Payments" value={String(report.count)} />
              <Fact label="Average" value={report.count ? money(report.average) : '—'} />
              <Fact label={isDay ? 'Busiest hour' : 'Best day'} value={isDay ? (report.busiestHour === null ? '—' : hourName(report.busiestHour)) : report.bestDay ? dayName(report.bestDay.day) : '—'} />
            </Group>
          </Box>

          {empty ? (
            <Stack gap={6}>
              <Text fw={700} fz={18}>No payments {isDay ? (current ? 'yet today' : 'on this day') : period.kind === 'custom' ? 'in these dates' : `in this ${period.kind}`}</Text>
              <Text c="dimmed">Payments appear here as soon as the Till phone reports them.</Text>
              {!current && period.kind !== 'custom' ? (
                <Button variant="light" size="sm" w="fit-content" mt="xs" onClick={() => setPeriod(periodAt(period.kind, Date.now()))}>
                  Go to {period.kind === 'day' ? 'today' : `this ${period.kind}`}
                </Button>
              ) : null}
            </Stack>
          ) : (
            <>
              <Stack gap="sm">
                <Text fw={700} fz={18}>{isDay ? 'By hour' : 'By day'}</Text>
                <Group gap={bars.length > 14 ? 2 : 8} align="flex-end" wrap="nowrap" h={190} role="group" aria-label={isDay ? 'Received by hour' : 'Received by day'}>
                  {bars.map((b) => {
                    const on = b.key === selectedKey;
                    return (
                      <Box
                        key={b.key}
                        component="button"
                        type="button"
                        onClick={() => setPicked({ period: periodKey, key: b.key })}
                        aria-label={`${b.title}, ${hidden ? 'amount hidden' : `KSh ${formatAmount(b.value)}`}, ${b.count} payments`}
                        aria-pressed={on}
                        style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                      >
                        <Box style={{ height: b.value > 0 ? Math.max(4, (b.value / max) * 150) : 2, borderRadius: 3, background: on ? tokens.brand : b.value > 0 ? tokens.brandTonal : tokens.line }} />
                        <Text fz={11} c={on ? undefined : 'dimmed'} h={16} ta="center" style={{ overflow: 'visible', whiteSpace: 'nowrap' }}>
                          {b.label}
                        </Text>
                      </Box>
                    );
                  })}
                </Group>
                {selected ? (
                  <Group justify="space-between" px="md" py={12} style={{ background: tokens.surface, borderRadius: 14 }}>
                    <Text fw={600}>{selected.title}</Text>
                    <Text c="dimmed">{selected.value > 0 ? `${money(selected.value)} · ${selected.count} ${selected.count === 1 ? 'payment' : 'payments'}` : 'No payments'}</Text>
                  </Group>
                ) : null}
              </Stack>

              <Stack gap={4}>
                <Text fw={700} fz={18}>Sales by person</Text>
                {report.people.length === 0 ? <Text c="dimmed" py="xs">Nobody has claimed a sale in this period yet.</Text> : null}
                {report.people.map((p) => (
                  <Person key={p.uid} name={p.uid === user?.uid ? 'You' : p.name} avatar={initials(p.name)} me={p.uid === user?.uid} detail={`${p.count} ${p.count === 1 ? 'sale' : 'sales'} · ${Math.round((p.total / Math.max(1, report.total)) * 100)}%`} value={money(p.total)} share={p.total / Math.max(1, report.total)} />
                ))}
                {report.unclaimed.count ? (
                  <Person name="Unclaimed" avatar="?" muted detail={`${report.unclaimed.count} ${report.unclaimed.count === 1 ? 'payment' : 'payments'} · ${Math.round((report.unclaimed.total / Math.max(1, report.total)) * 100)}%`} value={money(report.unclaimed.total)} share={report.unclaimed.total / Math.max(1, report.total)} />
                ) : null}
              </Stack>
            </>
          )}

          {truncated ? (
            <Paper p="md" style={{ background: tokens.warnBg, border: 0 }}>
              <Text fz={13.5} c="warn.9">This period has more than {formatAmount(PAYMENTS_LIMIT)} payments. The report shows the latest {formatAmount(PAYMENTS_LIMIT)}. Try a shorter period for the full list.</Text>
            </Paper>
          ) : null}
          <Text fz={12.5} c="dimmed" ta="center">
            Totals come from M-Pesa messages on the Till phone, not from verified settlement.
          </Text>
        </Stack>
      )}
    </Page>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fz={13} c="dimmed">{label}</Text>
      <Text fw={700} fz={19} className="tnum">{value}</Text>
    </Box>
  );
}

function Person({ name, avatar, detail, value, share, me, muted }: { name: string; avatar: string; detail: string; value: string; share: number; me?: boolean; muted?: boolean }) {
  return (
    <Box py={12} style={{ borderTop: `1px solid ${tokens.divider}` }}>
      <Group gap={14} wrap="nowrap">
        <Box w={40} h={40} style={{ borderRadius: '50%', display: 'grid', placeItems: 'center', background: me ? tokens.brandTonal : tokens.neutralBg, color: me ? tokens.onBrandTonal : tokens.muted, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {avatar}
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} c={muted ? 'dimmed' : undefined} truncate>{name}</Text>
          <Text fz={13} c="dimmed">{detail}</Text>
        </Box>
        <Text fw={600} c={muted ? 'dimmed' : undefined} className="tnum">{value}</Text>
      </Group>
      <Progress value={Math.max(2, share * 100)} size={4} mt={8} ml={54} color={muted ? 'gray' : 'brand'} aria-hidden />
    </Box>
  );
}
