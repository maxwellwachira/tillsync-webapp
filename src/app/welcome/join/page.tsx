'use client';

import { Anchor, Box, Button, CopyButton, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowLeft, IconCheck, IconCopy } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/session';
import { useGate } from '@/lib/useGate';
import { tokens } from '@/theme';

import { WelcomeFrame } from '../WelcomeFrame';

const STEPS = ['Send your account ID to the business owner.', 'They add you from Team, using “Add person”.', 'Come back here and press Check again.'];

export default function JoinBusiness() {
  const { ok } = useGate(['noAccess']);
  const { status, user, reload } = useSession();
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);
  if (!ok || status === 'loading') return <Splash />;
  const id = user?.uid ?? '';

  return (
    <WelcomeFrame width={520}>
      <Stack gap="xl">
        <Anchor component={Link} href="/welcome" fz="sm" fw={600} c="dimmed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </Anchor>
        <Stack gap={8}>
          <Title order={1} fz={{ base: 30, sm: 36 }} style={{ letterSpacing: '-0.035em' }}>
            Your account ID
          </Title>
          <Text c="dimmed" fz={16} lh={1.55}>
            It tells the owner which TillSync account to add. It doesn’t give anyone access to your account.
          </Text>
        </Stack>

        <Box p="lg" style={{ background: tokens.surface, borderRadius: 20, textAlign: 'center' }}>
          <Text className="mono" fz={20} fw={600} style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
            {id}
          </Text>
        </Box>
        <CopyButton value={id}>
          {({ copied, copy }) => (
            <Button size="lg" variant={copied ? 'light' : 'filled'} leftSection={copied ? <IconCheck size={18} /> : <IconCopy size={18} />} onClick={copy} fullWidth>
              {copied ? 'Copied' : 'Copy account ID'}
            </Button>
          )}
        </CopyButton>

        <Stack gap="md">
          {STEPS.map((s, i) => (
            <Group key={s} wrap="nowrap" gap="md">
              <ThemeIcon radius="xl" size={30} variant="light" color="brand" fw={700} fz={13}>
                {i + 1}
              </ThemeIcon>
              <Text>{s}</Text>
            </Group>
          ))}
        </Stack>

        <Stack gap={10}>
          <Button
            size="lg"
            variant="default"
            loading={checking}
            onClick={async () => {
              setChecking(true);
              setNotYet(false);
              await reload(); // once you have been added, the gate moves you into the app
              setChecking(false);
              setNotYet(true);
            }}
            fullWidth
          >
            Check again
          </Button>
          {notYet ? (
            <Text ta="center" fz="sm" c="dimmed" role="alert">
              Not added yet. Ask the owner to add you, then try again.
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </WelcomeFrame>
  );
}
