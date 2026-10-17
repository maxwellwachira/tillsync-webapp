'use client';

import { Avatar, Box, Button, CopyButton, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCopy, IconLogout } from '@tabler/icons-react';
import { useState } from 'react';

import { Page } from '@/components/PageHeader';
import { useBusinessActions } from '@/lib/data';
import { initials } from '@/lib/format';
import { useSession } from '@/lib/session';
import { ROLE_LABEL } from '@/lib/types';
import { tokens } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper withBorder p="xl" style={{ borderColor: tokens.line }}>
      <Stack gap="lg">
        <Text fw={700} fz={17}>
          {title}
        </Text>
        {children}
      </Stack>
    </Paper>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Group justify="space-between" align="center" wrap="nowrap" gap="lg">
      <Text c="dimmed" fz={14.5}>
        {label}
      </Text>
      <Box ta="right" style={{ minWidth: 0 }}>
        {children}
      </Box>
    </Group>
  );
}

export default function Account() {
  const { membership, user, signOut, reload } = useSession();
  const { renameBusiness } = useBusinessActions();
  const [saving, setSaving] = useState(false);
  const owner = membership?.role === 'owner';
  const form = useForm({ initialValues: { name: membership?.businessName ?? '' }, validate: { name: (v) => (v.trim().length >= 2 ? null : 'Enter your business name.') } });
  if (!membership || !user) return null;
  const name = membership.displayName || user.displayName || user.email || 'You';

  return (
    <Page title="Account" subtitle="You and your business" width={760}>
      <Paper withBorder p="xl" style={{ borderColor: tokens.line }}>
        <Group gap="lg" wrap="nowrap">
          <Avatar color="brand" radius="xl" size={64} fz={22}>
            {initials(name)}
          </Avatar>
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} fz={22} truncate style={{ letterSpacing: '-0.02em' }}>
              {name}
            </Text>
            <Text c="dimmed" fz={14.5} truncate>
              {user.email ?? 'No email on this account'}
            </Text>
            <Text fz={13.5} fw={600} c="brand.7" mt={4}>
              {ROLE_LABEL[membership.role]} · {membership.businessName}
            </Text>
          </Box>
        </Group>
      </Paper>

      <Section title="Business">
        {owner ? (
          <form
            noValidate
            onSubmit={form.onSubmit(async (v) => {
              setSaving(true);
              try {
                await renameBusiness(v.name);
                await reload();
                notifications.show({ color: 'ok', icon: <IconCheck size={16} />, title: 'Saved', message: 'Your business name was updated.' });
              } catch {
                notifications.show({ color: 'err', title: 'Couldn’t save', message: 'Check your connection and try again.' });
              } finally {
                setSaving(false);
              }
            })}
          >
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput label="Business name" style={{ flex: '1 1 260px' }} {...form.getInputProps('name')} />
              <Button type="submit" loading={saving} disabled={form.values.name.trim() === membership.businessName}>
                Save
              </Button>
            </Group>
          </form>
        ) : (
          <Field label="Business name">
            <Text fw={600}>{membership.businessName}</Text>
          </Field>
        )}
        <Field label="Type">
          <Text fw={600}>{membership.businessType}</Text>
        </Field>
      </Section>

      <Section title="Your account ID">
        <Text c="dimmed" fz={14.5} lh={1.55}>
          An owner adds you to a business with this ID. It doesn’t give anyone access to your account.
        </Text>
        <Group gap="sm" wrap="nowrap" align="center">
          <Box p="md" style={{ background: tokens.surface, borderRadius: 14, flex: 1, minWidth: 0 }}>
            <Text className="mono" fz={14} style={{ wordBreak: 'break-all', whiteSpace: 'normal', letterSpacing: 0 }}>
              {user.uid}
            </Text>
          </Box>
          <CopyButton value={user.uid}>
            {({ copied, copy }) => (
              <Button variant={copied ? 'light' : 'default'} leftSection={copied ? <IconCheck size={17} /> : <IconCopy size={17} />} onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Section>

      <Button variant="default" leftSection={<IconLogout size={18} />} onClick={() => void signOut()} w="fit-content">
        Sign out
      </Button>
    </Page>
  );
}
