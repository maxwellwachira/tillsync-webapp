'use client';

import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { Logo } from '@/components/Logo';
import { useSession } from '@/lib/session';

/** Calm, centred frame for the first-run screens: logo, a way out, and the step. */
export function WelcomeFrame({ children, width = 560 }: { children: ReactNode; width?: number }) {
  const { signOut, user } = useSession();
  return (
    <Box mih="100vh" bg="white">
      <Container size={width + 48} py={28}>
        <Group justify="space-between" mb={{ base: 40, sm: 64 }}>
          <Logo size={34} />
          <Group gap="sm">
            {user?.email ? (
              <Text fz="sm" c="dimmed" visibleFrom="sm">
                {user.email}
              </Text>
            ) : null}
            <Anchor component="button" type="button" fz="sm" fw={600} c="dimmed" onClick={() => void signOut()}>
              Sign out
            </Anchor>
          </Group>
        </Group>
        {children}
      </Container>
    </Box>
  );
}
