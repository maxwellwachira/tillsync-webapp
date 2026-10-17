'use client';

import { Box, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';

import { Logo } from '@/components/Logo';
import { Splash } from '@/components/Splash';
import { useSession } from '@/lib/session';
import { useGate } from '@/lib/useGate';
import { tokens } from '@/theme';

/** A Till-phone account only reads M-Pesa messages and passes them on: it has no screens here. */
export default function TillPhoneNotice() {
  const { ok } = useGate(['ready']);
  const { membership, signOut } = useSession();
  if (!ok || !membership) return <Splash />;
  if (membership.role !== 'till') return <Splash />;
  return (
    <Box mih="100vh" style={{ display: 'grid', placeItems: 'center' }} p="lg">
      <Stack gap="xl" maw={480}>
        <Logo size={36} />
        <Paper withBorder p="xl" style={{ borderColor: tokens.line }}>
          <Stack gap="md">
            <Title order={2} fz={24} style={{ letterSpacing: '-0.03em' }}>
              This account is a Till phone
            </Title>
            <Text c="dimmed" lh={1.6}>
              A Till phone reads M-Pesa messages and passes them on to {membership.businessName}. It runs in the TillSync Android app on the phone that holds the Till SIM, and has no screens here.
            </Text>
            <Text c="dimmed" lh={1.6}>
              To see payments, sign in with an owner or attendant account.
            </Text>
            <Group mt="sm">
              <Button variant="default" onClick={() => void signOut()}>
                Sign out
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
