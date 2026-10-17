import { Avatar, Box, Group, Paper, Stack, Text } from '@mantine/core';
import { IconHelpCircle } from '@tabler/icons-react';

import { formatAmount, initials } from '@/lib/format';
import type { SalesSplit } from '@/lib/sales';
import { tokens } from '@/theme';

const amount = (n: number, hidden: boolean) => (hidden ? 'KSh ••••' : `KSh ${formatAmount(n)}`);

/** Today's total split by who made each sale. What nobody has claimed yet is listed last, never lost. */
export function SalesByPerson({ sales, myUid, hidden }: { sales: SalesSplit; myUid: string | null; hidden: boolean }) {
  const { people, unclaimedCount, unclaimedTotal } = sales;
  return (
    <Paper withBorder p="lg" style={{ borderColor: tokens.line }}>
      <Text fw={700} fz={17}>
        Sales by person
      </Text>
      <Text fz={13.5} c="dimmed" mt={2}>
        {people.length === 0 ? 'No sales claimed yet. Attendants claim theirs from Payments, or open any payment to assign it.' : 'Today, from the sales your team has claimed.'}
      </Text>
      <Stack gap={0} mt="sm">
        {people.map((p, i) => (
          <Row key={p.uid} name={p.uid === myUid ? 'You' : p.name} avatar={<Avatar color={p.uid === myUid ? 'brand' : 'gray'} radius="xl" size={40}>{initials(p.name)}</Avatar>} detail={`${p.count} ${p.count === 1 ? 'sale' : 'sales'}`} value={amount(p.total, hidden)} last={i === people.length - 1 && unclaimedCount === 0} />
        ))}
        {unclaimedCount > 0 ? (
          <Row
            name="Unclaimed"
            muted
            avatar={
              <Avatar color="gray" radius="xl" size={40}>
                <IconHelpCircle size={21} />
              </Avatar>
            }
            detail={`${unclaimedCount} ${unclaimedCount === 1 ? 'payment' : 'payments'}`}
            value={amount(unclaimedTotal, hidden)}
            last
          />
        ) : null}
      </Stack>
    </Paper>
  );
}

function Row({ name, avatar, detail, value, muted, last }: { name: string; avatar: React.ReactNode; detail: string; value: string; muted?: boolean; last?: boolean }) {
  return (
    <Group gap={14} wrap="nowrap" mih={64} style={{ borderBottom: last ? 'none' : `1px solid ${tokens.divider}` }}>
      {avatar}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text fw={600} fz={15} truncate c={muted ? 'dimmed' : undefined}>
          {name}
        </Text>
        <Text fz={13} c="dimmed">
          {detail}
        </Text>
      </Box>
      <Text fw={600} fz={15} className="tnum" c={muted ? 'dimmed' : undefined}>
        {value}
      </Text>
    </Group>
  );
}
