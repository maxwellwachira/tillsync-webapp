'use client';

import { BarChart } from '@mantine/charts';
import { Box, Group, Paper, SegmentedControl, Table, Text } from '@mantine/core';
import { useState } from 'react';

import { formatAmount, formatDay } from '@/lib/format';
import { tokens } from '@/theme';

export type Day = { day: number; total: number; count: number };

/**
 * What came in each of the last days. One series, so no legend: the title names it. Thin bars with a rounded
 * data end, quiet grid, a tooltip on hover, and a table view so nothing depends on seeing the bars.
 */
export function DaysChart({ days, hidden, now }: { days: Day[]; hidden: boolean; now: number }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const data = days.map((d) => ({
    label: new Date(d.day).toDateString() === new Date(now).toDateString() ? 'Today' : new Date(d.day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
    total: d.total,
    count: d.count,
  }));
  const best = days.reduce((a, b) => (b.total > a.total ? b : a), days[0]!);
  const week = days.reduce((s, d) => s + d.total, 0);

  return (
    <Paper withBorder p="lg" style={{ borderColor: tokens.line }}>
      <Group justify="space-between" align="flex-start" mb="md" wrap="wrap">
        <Box>
          <Text fw={700} fz={17}>
            Received per day
          </Text>
          <Text fz={13.5} c="dimmed" mt={2}>
            {hidden ? 'Amounts hidden' : week > 0 ? `KSh ${formatAmount(week)} in ${days.length} days · best day ${formatDay(best.day, now) === 'Today' ? 'is today' : formatDay(best.day, now)}` : `Nothing in the last ${days.length} days`}
          </Text>
        </Box>
        <SegmentedControl size="xs" value={view} onChange={(v) => setView(v as 'chart' | 'table')} data={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} aria-label="Chart or table" />
      </Group>

      {view === 'chart' ? (
        <BarChart
          h={236}
          data={data}
          dataKey="label"
          series={[{ name: 'total', color: 'brand.6', label: 'Received (KSh)' }]}
          withYAxis={!hidden}
          withTooltip={!hidden}
          tickLine="none"
          gridAxis="x"
          maxBarWidth={34}
          barProps={{ radius: [4, 4, 0, 0] }}
          valueFormatter={(v) => `KSh ${formatAmount(v)}`}
          yAxisProps={{ width: 52, tickFormatter: (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v)) }}
          aria-label="Bar chart of the amount received each day"
        />
      ) : (
        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Day</Table.Th>
              <Table.Th ta="right">Payments</Table.Th>
              <Table.Th ta="right">Received</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {[...days].reverse().map((d) => (
              <Table.Tr key={d.day}>
                <Table.Td>{formatDay(d.day, now)}</Table.Td>
                <Table.Td ta="right" className="tnum">
                  {d.count}
                </Table.Td>
                <Table.Td ta="right" className="tnum" fw={600}>
                  {hidden ? 'KSh ••••' : `KSh ${formatAmount(d.total)}`}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}
