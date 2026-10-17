'use client';

import { Box, CopyButton, Drawer, Group, Skeleton, Text, UnstyledButton } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

import { useBusinessActions } from '@/lib/data';
import { formatAgo, formatClockSeconds, formatDay } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Payment } from '@/lib/types';
import { tokens } from '@/theme';

import { Money } from './Money';

function Row({ k, children, last }: { k: string; children: React.ReactNode; last?: boolean }) {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="lg" mih={56} style={{ borderBottom: last ? 'none' : `1px solid ${tokens.divider}` }}>
      <Text fz={14.5} c="dimmed" style={{ flexShrink: 0 }}>
        {k}
      </Text>
      <Text fz={14.5} fw={600} ta="right" className="tnum" style={{ wordBreak: 'break-word' }}>
        {children}
      </Text>
    </Group>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text fw={700} fz={12} c="dimmed" mt={32} mb={2} style={{ letterSpacing: 0.6 }}>
      {children.toUpperCase()}
    </Text>
  );
}

/** How long the message took to reach the team: “Instantly”, “3 s later”, “1 min 5 s later”. */
function delay(from: number, to: number): string {
  const s = Math.max(0, Math.round((to - from) / 1000));
  if (s <= 1) return 'Instantly';
  return s < 60 ? `${s} s later` : `${Math.floor(s / 60)} min ${s % 60} s later`;
}

/** One payment, top to bottom: when it arrived, how much, who paid, the code to copy, then the quiet details. */
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

  return (
    <Drawer opened={!!p} onClose={onClose} position="right" size={440} title={<Text fw={700} fz={17}>Payment</Text>} padding="lg">
      {p ? (
        <Box>
          <Group justify="space-between" wrap="nowrap">
            <Group gap={7} wrap="nowrap" h={30} px={13} style={{ borderRadius: 15, background: tokens.okBg }}>
              <Box w={7} h={7} style={{ borderRadius: '50%', background: tokens.ok }} />
              <Text fz={12.5} fw={700} c="ok.8">
                Received
              </Text>
            </Group>
            <Text fz={13} c="dimmed">
              {formatAgo(p.receivedAt, now)}
            </Text>
          </Group>

          <Box mt={22}>
            <Money amount={p.amount} size={46} hidden={hidden} />
          </Box>
          <Group gap={7} mt={10} wrap="nowrap" align="baseline">
            <Text fz={16} style={{ color: tokens.subtle }}>
              from
            </Text>
            <Text fz={22} fw={600} lh={1.3} style={{ minWidth: 0 }}>
              {p.payerDisplay || 'an M-Pesa customer'}
            </Text>
          </Group>

          <CopyButton value={p.code} timeout={1800}>
            {({ copied, copy }) => (
              <UnstyledButton onClick={copy} aria-label={`Copy code ${p.code}`} className="option-card" w="100%" mt={28} px={18} h={60} style={{ background: tokens.surface, borderRadius: 18 }}>
                <Group justify="space-between" wrap="nowrap" h="100%">
                  <Box>
                    <Text fz={11} fw={700} c="dimmed" style={{ letterSpacing: 0.6 }}>
                      M-PESA CODE
                    </Text>
                    <Text className="mono" fz={17} fw={600} lh={1.3}>
                      {p.code}
                    </Text>
                  </Box>
                  <Group gap={6} wrap="nowrap" c={copied ? 'ok.8' : 'brand.6'}>
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    <Text fz={14} fw={700} c="inherit">
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </Group>
                </Group>
              </UnstyledButton>
            )}
          </CopyButton>

          <SectionLabel>Details</SectionLabel>
          <Row k="Phone">
            <span className="mono">{p.phoneMasked || '—'}</span>
          </Row>
          <Row k="Received">
            {formatDay(p.receivedAt, now)}, {formatClockSeconds(p.receivedAt)}
          </Row>
          <Row k="Delivered to your team" last>
            {delay(p.receivedAt, p.syncedAt)}
          </Row>

          {canSeeSms ? (
            <>
              <SectionLabel>Original message</SectionLabel>
              {sms?.code === p.code ? (
                sms.text ? (
                  <Box p="md" style={{ background: tokens.surface, borderRadius: 18 }}>
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
            </>
          ) : null}
        </Box>
      ) : null}
    </Drawer>
  );
}
