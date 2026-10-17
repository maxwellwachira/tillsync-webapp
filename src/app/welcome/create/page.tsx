'use client';

import { Alert, Anchor, Button, Chip, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';

import { Splash } from '@/components/Splash';
import { BUSINESS_TYPES, type BusinessType } from '@/lib/types';
import { FriendlyError, useSession } from '@/lib/session';
import { useGate } from '@/lib/useGate';

import { WelcomeFrame } from '../WelcomeFrame';

export default function CreateBusiness() {
  const { ok } = useGate(['noAccess']);
  const { status, user, createBusiness } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    initialValues: { name: '', type: 'Shop' as BusinessType, displayName: user?.displayName ?? '' },
    validate: {
      name: (v) => (v.trim().length >= 2 ? null : 'Enter your business name.'),
      displayName: (v) => (v.trim().length >= 2 ? null : 'Enter your name.'),
    },
  });
  if (!ok || status === 'loading') return <Splash />;

  return (
    <WelcomeFrame width={520}>
      <Stack gap="xl">
        <Anchor component={Link} href="/welcome" fz="sm" fw={600} c="dimmed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </Anchor>
        <Stack gap={8}>
          <Title order={1} fz={{ base: 30, sm: 36 }} style={{ letterSpacing: '-0.035em' }}>
            Set up your business
          </Title>
          <Text c="dimmed" fz={16}>
            You’ll be the owner. You can add your team and connect your Till next.
          </Text>
        </Stack>
        <form
          noValidate
          onSubmit={form.onSubmit(async (v) => {
            setBusy(true);
            setError(null);
            try {
              await createBusiness({ name: v.name, type: v.type, displayName: v.displayName });
            } catch (e) {
              setError(e instanceof FriendlyError ? e.message : 'Something went wrong. Try again.');
              setBusy(false);
            }
          })}
        >
          <Stack gap="lg">
            <TextInput label="Business name" placeholder="e.g. City Fuel Stop" size="lg" autoFocus {...form.getInputProps('name')} />
            <Stack gap={8}>
              <Text fw={600} fz="sm">
                What kind of business?
              </Text>
              <Chip.Group multiple={false} value={form.values.type} onChange={(v) => form.setFieldValue('type', v as BusinessType)}>
                <Group gap={8}>
                  {BUSINESS_TYPES.map((t) => (
                    <Chip key={t} value={t} radius="md" variant="light" size="md">
                      {t}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
            <TextInput label="Your name" placeholder="e.g. John Doe" size="lg" autoComplete="name" {...form.getInputProps('displayName')} />
            {error ? (
              <Alert color="err" variant="light" icon={<IconAlertCircle size={18} />} role="alert">
                {error}
              </Alert>
            ) : null}
            <Button type="submit" size="lg" loading={busy} fullWidth mt={4}>
              Create business
            </Button>
          </Stack>
        </form>
      </Stack>
    </WelcomeFrame>
  );
}
