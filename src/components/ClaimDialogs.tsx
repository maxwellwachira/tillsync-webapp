'use client';

import { Avatar, Box, Button, Group, Modal, ScrollArea, Skeleton, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconCircleCheckFilled } from '@tabler/icons-react';

import { useMembers } from '@/lib/data';
import { initials } from '@/lib/format';
import { ROLE_LABEL, type Payment } from '@/lib/types';
import { tokens } from '@/theme';

import { Money } from './Money';

export type Pending = { kind: 'claim' | 'unclaim' | 'remove' | 'assign'; payment: Payment };

type Props = {
  pending: Pending | null;
  open: boolean;
  busy: boolean;
  currentUid: string | undefined;
  myUid: string | null;
  onConfirm: () => void;
  onPick: (person: { uid: string; displayName: string }) => void;
  onClose: () => void;
};

const COPY = {
  claim: { title: 'Claim this sale?', body: 'It will count toward your sales today. You can undo it any time today.', yes: 'Yes, claim it', no: 'Cancel' },
  unclaim: { title: 'Undo your claim?', body: 'It goes back to unclaimed, and anyone on the team can claim it.', yes: 'Yes, undo it', no: 'Keep it' },
  remove: { title: 'Remove this claim?', body: 'It goes back to unclaimed. You can assign it to someone again.', yes: 'Yes, remove it', no: 'Keep it' },
} as const;

/** The one-question dialogs behind Claim, Undo, Remove and Assign. Rendered once, by the claims provider. */
export function ClaimDialogs({ pending, open, busy, currentUid, myUid, onConfirm, onPick, onClose }: Props) {
  const p = pending?.payment;
  const assigning = pending?.kind === 'assign';
  const c = pending && pending.kind !== 'assign' ? COPY[pending.kind] : null;

  return (
    <>
      <Modal opened={open && !!c} onClose={onClose} title={<Text fw={700} fz={19}>{c?.title}</Text>} size={440} centered padding="xl">
        {c && p ? (
          <Stack gap="lg">
            <Text c="dimmed" fz={15}>
              {c.body}
            </Text>
            <Group justify="space-between" wrap="nowrap" p="md" style={{ background: tokens.surface, borderRadius: 16 }}>
              <Money amount={p.amount} size={26} />
              <Box ta="right" style={{ minWidth: 0 }}>
                <Text fw={600} fz={14.5} truncate>
                  {p.payerDisplay || 'M-Pesa customer'}
                </Text>
                <Text className="mono" fz={12} c="dimmed">
                  {p.code}
                </Text>
              </Box>
            </Group>
            <Stack gap={8}>
              <Button size="md" loading={busy} onClick={onConfirm} fullWidth>
                {c.yes}
              </Button>
              <Button size="md" variant="default" disabled={busy} onClick={onClose} fullWidth>
                {c.no}
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Modal>

      {open && assigning && p ? <AssignModal payment={p} currentUid={currentUid} myUid={myUid} busy={busy} onPick={onPick} onClose={onClose} /> : null}
    </>
  );
}

/** Owner only: pick who made this sale. You come first, then everyone else on the team (never a Till phone). */
function AssignModal({ payment, currentUid, myUid, busy, onPick, onClose }: { payment: Payment; currentUid: string | undefined; myUid: string | null; busy: boolean; onPick: Props['onPick']; onClose: () => void }) {
  const { members, error } = useMembers();
  const people = (members ?? [])
    .filter((m) => m.role !== 'till' && m.status === 'active')
    .sort((a, b) => Number(b.uid === myUid) - Number(a.uid === myUid) || a.displayName.localeCompare(b.displayName));

  return (
    <Modal opened onClose={onClose} title={<Text fw={700} fz={19}>Who made this sale?</Text>} size={440} centered padding="xl">
      <Stack gap="md">
        <Text c="dimmed" fz={15}>
          KSh {payment.amount.toLocaleString('en-KE')} from {payment.payerDisplay || 'an M-Pesa customer'}. It will count toward their sales today.
        </Text>
        {members === null && !error ? (
          <Stack gap={8}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} h={56} radius="md" />
            ))}
          </Stack>
        ) : error || people.length === 0 ? (
          <Text c="dimmed" fz={14.5}>
            Could not load your team. Check your connection and try again.
          </Text>
        ) : (
          <ScrollArea.Autosize mah={360} type="auto">
            <Stack gap={0}>
              {people.map((m, i) => {
                const mine = m.uid === myUid;
                return (
                  <UnstyledButton
                    key={m.uid}
                    onClick={() => onPick({ uid: m.uid, displayName: m.displayName })}
                    disabled={busy}
                    className="row-link"
                    aria-label={`${mine ? 'Me, ' : ''}${m.displayName}${m.uid === currentUid ? ', current' : ''}`}
                    py={12}
                    px={8}
                    style={{ borderBottom: i === people.length - 1 ? 'none' : `1px solid ${tokens.divider}`, borderRadius: 8 }}
                  >
                    <Group gap={14} wrap="nowrap">
                      <Avatar color={mine ? 'brand' : 'gray'} radius="xl" size={42}>
                        {initials(m.displayName)}
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} fz={15} truncate>
                          {mine ? 'Me' : m.displayName}
                        </Text>
                        <Text fz={13} c="dimmed" truncate>
                          {mine ? `${m.displayName} · ${ROLE_LABEL[m.role]}` : ROLE_LABEL[m.role]}
                        </Text>
                      </Box>
                      {m.uid === currentUid ? <IconCircleCheckFilled size={22} color={tokens.ok} aria-hidden /> : null}
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </ScrollArea.Autosize>
        )}
        <Button variant="default" size="md" onClick={onClose} disabled={busy} fullWidth>
          Cancel
        </Button>
      </Stack>
    </Modal>
  );
}
