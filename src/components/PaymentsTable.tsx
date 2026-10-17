'use client';

import { Group, Table, Text } from '@mantine/core';
import { IconArrowDownLeft } from '@tabler/icons-react';

import { formatAgo, formatClock, formatDay } from '@/lib/format';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

import { Money } from './Money';

type Props = {
  payments: Payment[];
  now: number;
  hidden: boolean;
  onSelect: (p: Payment) => void;
  /** Show the day with the time ("Yesterday 06:12 PM"): for lists that span more than today. */
  withDay?: boolean;
};

/** One payment per row: amount first and largest, then the code (monospaced), who paid and when. */
export function PaymentsTable({ payments, now, hidden, onSelect, withDay }: Props) {
  return (
    <Table.ScrollContainer minWidth={0}>
      <Table verticalSpacing="sm" highlightOnHover={false} style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <Table.Thead>
          <Table.Tr>
            {['Amount', 'Code', 'Payer', 'Phone', 'Received'].map((h, i) => (
              <Table.Th key={h} visibleFrom={i === 1 || i === 3 ? 'sm' : undefined} ta={i === 4 ? 'right' : undefined} fz={12.5} fw={600} c="dimmed" style={{ borderBottom: `1px solid ${tokens.line}`, paddingTop: 10, paddingBottom: 10 }}>
                {h}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {payments.map((p) => (
            <Table.Tr
              key={p.code}
              onClick={() => onSelect(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(p);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${hidden ? 'Amount hidden' : `KSh ${p.amount}`}, code ${p.code}, ${p.payerDisplay}, ${formatClock(p.receivedAt)}`}
              className="row-link"
            >
              <Table.Td style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                <Group gap={12} wrap="nowrap">
                  <span style={{ width: 34, height: 34, borderRadius: '50%', background: tokens.okBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <IconArrowDownLeft size={18} color={tokens.okText} />
                  </span>
                  <Money amount={p.amount} size={19} hidden={hidden} />
                </Group>
              </Table.Td>
              <Table.Td visibleFrom="sm" style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                <Text className="mono" fz={13} fw={600}>
                  {p.code}
                </Text>
              </Table.Td>
              <Table.Td style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                <Text fz={14.5} fw={500} maw={{ base: 110, sm: 220 }} truncate>
                  {p.payerDisplay || '—'}
                </Text>
              </Table.Td>
              <Table.Td visibleFrom="sm" style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                <Text className="mono" fz={13} c="dimmed">
                  {p.phoneMasked || '—'}
                </Text>
              </Table.Td>
              <Table.Td ta="right" style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                <Text fz={14} fw={600} className="tnum">
                  {withDay ? `${formatDay(p.receivedAt, now)} · ` : ''}
                  {formatClock(p.receivedAt)}
                </Text>
                <Text fz={12.5} c="dimmed">
                  {formatAgo(p.receivedAt, now)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
