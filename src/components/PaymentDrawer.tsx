'use client';

import { Alert, Box, CopyButton, Divider, Drawer, Group, Skeleton, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconCheck, IconCircleDashed, IconCopy, IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { useBusinessActions } from '@/lib/data';
import { formatClockSeconds, formatDay } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

import { Money } from './Money';

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="lg" py={2}>
      <Text fz={14} c="dimmed" style={{ flexShrink: 0 }}>
        {k}
      </Text>
      <Text fz={14.5} fw={600} ta="right" style={{ wordBreak: 'break-word' }}>
        {children}
      </Text>
    </Group>
  );
}

/** Everything known about one payment, and an honest line about what is and isn't verified. */
export function PaymentDrawer({ payment, hidden, now, onClose }: { payment: Payment | null; hidden: boolean; now: number; onClose: () => void }) {
  const { membership } = useSession();
  const { getOriginalSms } = useBusinessActions();
  const canSeeSms = !!membership?.permissions.seeOriginalSms;
  const [sms, setSms] = useState<{ code: string; text: string | null } | null>(null);
  const code = payment?.code;

  useEffect(() => {
    if (!code || !canSeeSms) return;
    let live = true;
    void getOriginalSms(code).then((text) => live && setSms({ code, text }));
    return () => {
      live = false;
    };
    // getOriginalSms is stable per business; the code is what changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, canSeeSms]);

  const p = payment;
  const path = p
    ? [
        { label: 'SMS received by the Till phone', time: formatClockSeconds(p.receivedAt), done: true },
        { label: 'Delivered to the server', time: formatClockSeconds(p.syncedAt), done: true },
        { label: 'Available to your team', time: formatClockSeconds(p.syncedAt), done: true },
        { label: 'Independently verified', time: 'Not available', done: false },
      ]
    : [];

  return (
    <Drawer opened={!!p} onClose={onClose} position="right" size={440} title={<Text fw={700} fz={17}>Payment details</Text>} padding="lg">
      {p ? (
        <Stack gap="lg">
          <Box p="lg" style={{ background: tokens.brandTint, borderRadius: 20 }}>
            <Text fz={12.5} fw={700} c="dimmed" style={{ letterSpacing: 0.6 }}>
              PAYMENT RECEIVED · {formatDay(p.receivedAt, now).toUpperCase()}
            </Text>
            <Box mt={8}>
              <Money amount={p.amount} size={44} hidden={hidden} />
            </Box>
            <Group gap={8} mt={10} wrap="nowrap">
              <Text className="mono" fz={19} fw={600}>
                {p.code}
              </Text>
              <CopyButton value={p.code} timeout={1800}>
                {({ copied, copy }) => (
                  <UnstyledButton onClick={copy} aria-label="Copy code" style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, color: copied ? tokens.ok : tokens.muted, background: copied ? tokens.okBg : 'transparent' }}>
                    {copied ? <IconCheck size={17} /> : <IconCopy size={17} />}
                  </UnstyledButton>
                )}
              </CopyButton>
            </Group>
          </Box>

          <Alert color="warn" variant="light" icon={<IconInfoCircle size={18} />} radius="md" title="SMS received, not independently verified">
            For a large payment, confirm it on the M-Pesa statement before releasing goods.
          </Alert>

          <Stack gap={6}>
            <Row k="Payer">{p.payerDisplay || '—'}</Row>
            <Row k="Phone (as M-Pesa shows it)">
              <span className="mono">{p.phoneMasked || '—'}</span>
            </Row>
            <Row k="Received">
              {formatDay(p.receivedAt, now)} {formatClockSeconds(p.receivedAt)}
            </Row>
          </Stack>

          <Divider />

          <Stack gap="sm">
            <Text fw={700} fz={13} c="dimmed" style={{ letterSpacing: 0.6 }}>
              DELIVERY PATH
            </Text>
            {path.map((s) => (
              <Group key={s.label} gap={12} wrap="nowrap">
                <ThemeIcon size={22} radius="xl" variant={s.done ? 'filled' : 'outline'} color={s.done ? 'ok' : 'gray'} style={s.done ? undefined : { borderStyle: 'dashed' }}>
                  {s.done ? <IconCheck size={13} /> : <IconCircleDashed size={13} />}
                </ThemeIcon>
                <Text fz={14} style={{ flex: 1 }} c={s.done ? undefined : 'dimmed'}>
                  {s.label}
                </Text>
                <Text className="mono" fz={12} c="dimmed">
                  {s.time}
                </Text>
              </Group>
            ))}
          </Stack>

          {canSeeSms ? (
            <>
              <Divider />
              <Stack gap={8}>
                <Text fw={700} fz={13} c="dimmed" style={{ letterSpacing: 0.6 }}>
                  ORIGINAL MESSAGE
                </Text>
                {sms?.code === p.code ? (
                  sms.text ? (
                    <Box p="md" style={{ background: tokens.surface, borderRadius: 14 }}>
                      <Text className="mono" fz={12.5} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65, letterSpacing: 0 }}>
                        {sms.text}
                      </Text>
                    </Box>
                  ) : (
                    <Text fz={14} c="dimmed">
                      The original message isn’t available.
                    </Text>
                  )
                ) : (
                  <Skeleton h={84} radius="md" />
                )}
              </Stack>
            </>
          ) : null}
        </Stack>
      ) : null}
    </Drawer>
  );
}
