'use client';

import { Alert, Button, Group, Modal, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

import { useBusinessActions } from '@/lib/data';
import { defaultPermissions, PERMISSION_OPTIONS } from '@/lib/permissions';
import { useSession } from '@/lib/session';

const ACCOUNT_ID = /^[A-Za-z0-9]{20,40}$/;

/** Add a person (or the Till phone) by their account ID. They create their own account first and send you the ID. */
export function AddMemberModal({ opened, onClose, initialRole = 'attendant' }: { opened: boolean; onClose: () => void; initialRole?: 'attendant' | 'till' }) {
  const { user } = useSession();
  const actions = useBusinessActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    initialValues: { role: initialRole, uid: '', name: '', perms: defaultPermissions() },
    validate: {
      uid: (v) => (!ACCOUNT_ID.test(v.trim()) ? 'Paste the account ID exactly as they sent it.' : v.trim() === user?.uid ? 'That is your own account.' : null),
      name: (v, values) => (v.trim().length < 1 ? (values.role === 'till' ? 'Give the phone a name, e.g. “Counter phone”.' : 'Enter their name.') : null),
    },
  });
  const till = form.values.role === 'till';

  const close = () => {
    form.reset();
    setError(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={close} title={<Text fw={700} fz={18}>Add person</Text>} size={480} padding="lg" trapFocus>
      <form
        noValidate
        onSubmit={form.onSubmit(async (v) => {
          setBusy(true);
          setError(null);
          try {
            await actions.addMember({ uid: v.uid.trim(), displayName: v.name.trim(), role: v.role, permissions: v.role === 'till' ? {} : v.perms });
            notifications.show({ color: 'ok', icon: <IconCheck size={16} />, title: v.role === 'till' ? 'Till phone added' : 'Added', message: 'Ask them to reopen the app or press Check again.' });
            close();
          } catch (e) {
            setError(e instanceof Error && e.message === 'already-member' ? 'This account is already on your team.' : 'Couldn’t add them. Check the account ID and your connection, then try again.');
          } finally {
            setBusy(false);
          }
        })}
      >
        <Stack gap="md">
          <SegmentedControl fullWidth value={form.values.role} onChange={(v) => form.setFieldValue('role', v as 'attendant' | 'till')} data={[{ value: 'attendant', label: 'Attendant' }, { value: 'till', label: 'Till phone' }]} />
          <Text c="dimmed" fz={14} lh={1.55}>
            {till ? 'The phone that holds your Till SIM. On it: install TillSync, create an account, then send you the account ID from the Welcome screen.' : 'They create a TillSync account, then send you the account ID from their Welcome screen.'}
          </Text>
          <TextInput label="Account ID" placeholder="Paste the ID they sent you" autoComplete="off" spellCheck={false} data-autofocus {...form.getInputProps('uid')} />
          <TextInput label={till ? 'Phone name' : 'Their name'} placeholder={till ? 'e.g. Counter phone' : 'e.g. Jane Doe'} {...form.getInputProps('name')} />
          {!till ? (
            <Stack gap="sm" mt={4}>
              <Text fw={700} fz={13} c="dimmed" style={{ letterSpacing: 0.6 }}>
                WHAT THEY CAN SEE
              </Text>
              {PERMISSION_OPTIONS.map((o) => (
                <Switch
                  key={o.key}
                  label={o.label}
                  description={o.hint}
                  checked={form.values.perms[o.key] === true}
                  onChange={(e) => form.setFieldValue('perms', { ...form.values.perms, [o.key]: e.currentTarget.checked })}
                />
              ))}
            </Stack>
          ) : null}
          {error ? (
            <Alert color="err" variant="light" icon={<IconAlertCircle size={18} />} role="alert">
              {error}
            </Alert>
          ) : null}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {till ? 'Add Till phone' : 'Add attendant'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
