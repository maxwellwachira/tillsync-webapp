'use client';

import { Button, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

import { useClaims } from '@/lib/claims';
import { shortName } from '@/lib/sales';
import type { Payment } from '@/lib/types';

/**
 * The one-click control on a payment row. Three states, each says what a click does:
 *   nobody has it  -> “Claim”         (take the sale)
 *   you have it    -> “Yours · Undo”  (give it back)
 *   a colleague    -> “Jane D.”       (not clickable: it is theirs; the owner changes it from the details)
 * The column header says “Sold by”, so the cell only needs the name.
 * Clicks never open the row's details drawer.
 */
export function ClaimCell({ payment, now }: { payment: Payment; now: number }) {
  const { claims, uid, canClaim, flow } = useClaims();
  const claim = claims.get(payment.code);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (claim && claim.uid !== uid) {
    return (
      <Text fz={14} c="dimmed" truncate maw={150} title={`Sold by ${claim.displayName || 'a colleague'}`}>
        {shortName(claim.displayName || 'a colleague')}
      </Text>
    );
  }
  if (!claim && !canClaim(payment, now)) return null;

  const mine = !!claim;
  return (
    <span onClick={stop} onKeyDown={stop}>
      <Button
        size="compact-md"
        radius="xl"
        variant="light"
        color={mine ? 'ok' : 'brand'}
        leftSection={mine ? <IconCheck size={15} /> : undefined}
        aria-label={mine ? 'You claimed this sale. Undo' : 'Claim this sale'}
        onClick={() => (mine ? flow.unclaim(payment) : flow.claim(payment))}
      >
        {mine ? 'Yours · Undo' : 'Claim'}
      </Button>
    </span>
  );
}
