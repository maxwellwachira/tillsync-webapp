'use client';

import { Box, Group, Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconBuildingStore, IconChevronRight, IconUsersGroup } from '@tabler/icons-react';
import Link from 'next/link';

import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/session';
import { useGate } from '@/lib/useGate';
import { tokens } from '@/theme';

import { WelcomeFrame } from './WelcomeFrame';

function Option({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <UnstyledButton component={Link} href={href} style={{ display: 'block' }}>
      <Paper withBorder p="lg" style={{ borderColor: tokens.line, transition: 'border-color .15s, background .15s' }} className="option-card">
        <Group wrap="nowrap" gap="lg">
          <Box w={52} h={52} style={{ borderRadius: 14, background: tokens.brandTint, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {icon}
          </Box>
          <Stack gap={2} style={{ flex: 1 }}>
            <Text fw={700} fz={17}>
              {title}
            </Text>
            <Text c="dimmed" fz={14.5} lh={1.5}>
              {body}
            </Text>
          </Stack>
          <IconChevronRight size={22} color={tokens.subtle} />
        </Group>
      </Paper>
    </UnstyledButton>
  );
}

export default function Welcome() {
  const { ok } = useGate(['noAccess']);
  const { status } = useSession();
  if (!ok || status === 'loading') return <Splash />;
  return (
    <WelcomeFrame>
      <Stack gap="xl">
        <Stack gap={8}>
          <Title order={1} fz={{ base: 34, sm: 40 }} style={{ letterSpacing: '-0.035em' }}>
            Welcome
          </Title>
          <Text c="dimmed" fz={17}>
            How will you use TillSync?
          </Text>
        </Stack>
        <Stack gap="md">
          <Option href="/welcome/create" icon={<IconBuildingStore size={26} color={tokens.brand} />} title="I own a business" body="Set up your business, connect your Till and add your team." />
          <Option href="/welcome/join" icon={<IconUsersGroup size={26} color={tokens.brand} />} title="I work for a business" body="Share your account ID so the owner can add you." />
        </Stack>
      </Stack>
    </WelcomeFrame>
  );
}
