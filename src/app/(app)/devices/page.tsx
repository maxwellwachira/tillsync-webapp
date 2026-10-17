'use client';

import { Alert, Box, Button, Group, Loader, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconBattery2, IconBatteryCharging, IconDeviceMobile, IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';

import { Page } from '@/components/PageHeader';
import { DevicePill, HEALTH } from '@/components/StatusPill';
import { useDevices } from '@/lib/data';
import { formatAgo, formatClock, formatDay } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { deviceHealth } from '@/lib/stats';
import type { Device } from '@/lib/types';
import { tokens } from '@/theme';

function when(ms: number | null, now: number) {
  if (ms === null) return { main: 'Never', sub: undefined };
  return { main: `${formatDay(ms, now)} ${formatClock(ms)}`, sub: formatAgo(ms, now) };
}

function Fact({ label, main, sub }: { label: string; main: string; sub?: string }) {
  return (
    <Box>
      <Text fz={12.5} c="dimmed" fw={500}>
        {label}
      </Text>
      <Text fz={15} fw={600} mt={2} className="tnum">
        {main}
      </Text>
      {sub ? (
        <Text fz={12.5} c="dimmed">
          {sub}
        </Text>
      ) : null}
    </Box>
  );
}

function DeviceCard({ d, now }: { d: Device; now: number }) {
  const health = HEALTH[deviceHealth(d, now)];
  const heard = when(d.lastHeartbeat, now);
  const sms = when(d.lastSms, now);
  const sync = when(d.lastSync, now);
  return (
    <Paper withBorder p="xl" style={{ borderColor: tokens.line }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <ThemeIcon size={48} radius="md" variant="light" color="brand">
              <IconDeviceMobile size={26} />
            </ThemeIcon>
            <Box>
              <Text fw={700} fz={19}>
                {d.label}
              </Text>
              {d.appVersion ? (
                <Text fz={13} c="dimmed">
                  TillSync {d.appVersion}
                </Text>
              ) : null}
            </Box>
          </Group>
          <DevicePill device={d} now={now} />
        </Group>
        <Text c="dimmed" fz={14.5} lh={1.6}>
          {health.advice}
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="lg" verticalSpacing="lg">
          <Fact label="Last heard from" main={heard.main} sub={heard.sub} />
          <Fact label="Last payment message" main={sms.main} sub={sms.sub} />
          <Fact label="Last delivered to the cloud" main={sync.main} sub={sync.sub} />
          <Fact label="Waiting to send" main={d.pending === 0 ? 'Nothing' : `${d.pending} ${d.pending === 1 ? 'message' : 'messages'}`} />
          <Box>
            <Text fz={12.5} c="dimmed" fw={500}>
              Battery
            </Text>
            <Group gap={6} mt={2} wrap="nowrap">
              {d.charging ? <IconBatteryCharging size={18} color={tokens.ok} /> : <IconBattery2 size={18} color={tokens.muted} />}
              <Text fz={15} fw={600} className="tnum">
                {d.battery === null ? 'Unknown' : `${d.battery}%`}
              </Text>
            </Group>
            <Text fz={12.5} c="dimmed">
              {d.battery === null ? undefined : d.charging ? 'charging' : 'not charging'}
            </Text>
          </Box>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export default function Devices() {
  const { membership } = useSession();
  const { devices, error } = useDevices();
  const now = useNow(15_000);
  const owner = membership?.role === 'owner';

  return (
    <Page title="Devices" subtitle="The phone that holds your Till SIM and passes payments on" width={980}>
      {error ? (
        <Alert color="err" variant="light" radius="md" title="Couldn’t load devices">
          Check your connection and try again.
        </Alert>
      ) : devices === null ? (
        <Group justify="center" py={64}>
          <Loader size="sm" type="dots" />
        </Group>
      ) : devices.length === 0 ? (
        <Paper withBorder p="xl" style={{ borderColor: tokens.line }}>
          <Stack gap="lg" maw={560}>
            <ThemeIcon size={52} radius="md" variant="light" color="brand">
              <IconDeviceMobile size={28} />
            </ThemeIcon>
            <Stack gap={6}>
              <Text fw={700} fz={20}>
                No Till phone has reported yet
              </Text>
              <Text c="dimmed" lh={1.6}>
                Payments appear once the phone holding your Till SIM is connected.
              </Text>
            </Stack>
            <Stack gap={6} component="ol" m={0} pl={20}>
              {['Install TillSync on the Till phone (Android) and create an account.', 'On its Welcome screen, copy the account ID and send it to the owner.', 'Add it to your team as a Till phone. It starts reporting straight away.'].map((s) => (
                <Text key={s} component="li" fz={14.5} lh={1.55}>
                  {s}
                </Text>
              ))}
            </Stack>
            {owner ? (
              <Button component={Link} href="/team?add=till" w="fit-content">
                Add Till phone
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : (
        <Stack gap="lg">
          {devices.map((d) => (
            <DeviceCard key={d.id} d={d} now={now} />
          ))}
          <Alert color="brand" variant="light" radius="md" icon={<IconInfoCircle size={20} />}>
            Keep the Till phone on its charger and set its battery to “Unrestricted”, so Android never pauses it. Reading M-Pesa messages is done on the phone; this page only shows its health.
          </Alert>
        </Stack>
      )}
    </Page>
  );
}
