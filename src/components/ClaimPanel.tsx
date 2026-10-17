'use client';

import { Box, Button, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconUser } from '@tabler/icons-react';

import { useClaims } from '@/lib/claims';
import { formatAmount, formatClock } from '@/lib/format';
import { shortName } from '@/lib/sales';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

/**
 * The one thing to do about a sale, pinned to the bottom of the drawer. Attendants: claim it, undo their claim, or see
 * who has it. The owner can do all of that for themselves, and also assign it to anyone on the team, change it, or
 * remove it. Past 24 hours an unclaimed sale has no control for attendants (the rules allow no more).
 */
export function ClaimPanel({ payment, now }: { payment: Payment; now: number }) {
  const { claims, uid, isOwner, canClaim, flow } = useClaims();
  const claim = claims.get(payment.code);
  if (!claim && !canClaim(payment, now)) return null;

  const mine = !!claim && claim.uid === uid;
  return (
    <Box pos="sticky" bottom={0} mt="auto" pt="md" pb="md" style={{ background: '#fff', borderTop: `1px solid ${tokens.divider}` }}>
      {!claim ? (
        <Stack gap={10}>
          <Text fz={13} c="dimmed" ta="center">
            {isOwner ? 'Made this sale yourself? Claim it. Someone else served? Assign it to them.' : `Served this customer? KSh ${formatAmount(payment.amount)} will count toward your sales today.`}
          </Text>
          <Button size="md" onClick={() => flow.claim(payment)} fullWidth>
            Claim this sale
          </Button>
          {isOwner ? (
            <Button size="md" variant="default" onClick={() => flow.assign(payment)} fullWidth>
              Assign to someone
            </Button>
          ) : null}
        </Stack>
      ) : (
        <Stack gap={14}>
          <Group gap={12} wrap="nowrap">
            <ThemeIcon size={44} radius="xl" variant="light" color={mine ? 'ok' : 'gray'}>
              {mine ? <IconCheck size={22} /> : <IconUser size={21} />}
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} fz={15} truncate>
                {mine ? 'You made this sale' : `Sold by ${shortName(claim.displayName || 'a colleague')}`}
              </Text>
              <Text fz={13} c="dimmed" truncate>
                {mine ? 'Counted in your total today' : `Claimed at ${formatClock(claim.claimedAt)}`}
              </Text>
            </Box>
            {mine && !isOwner ? (
              <Button variant="default" size="sm" onClick={() => flow.unclaim(payment)}>
                Undo
              </Button>
            ) : null}
          </Group>
          {isOwner ? (
            <Group grow gap={10}>
              <Button variant="default" onClick={() => flow.assign(payment)}>
                Change person
              </Button>
              <Button variant="default" onClick={() => (mine ? flow.unclaim(payment) : flow.remove(payment))}>
                Remove claim
              </Button>
            </Group>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
