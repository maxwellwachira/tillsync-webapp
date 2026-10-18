'use client';

import { Box, Button, Drawer, Group, Modal, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

import { useBusinessActions } from '@/lib/data';
import { PERMISSION_OPTIONS } from '@/lib/permissions';
import { ROLE_LABEL, type Member } from '@/lib/types';

import { UserAvatar } from './UserAvatar';

/** Change what one person can see, or end their access. Both take effect immediately. */
export function MemberDrawer({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const actions = useBusinessActions();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const m = member;

  async function setPerm(key: string, on: boolean) {
    if (!m) return;
    try {
      await actions.setPermissions(m.uid, { ...m.permissions, [key]: on });
    } catch {
      notifications.show({ color: 'err', title: 'Couldn’t save that change', message: 'Check your connection and try again.' });
    }
  }

  async function remove() {
    if (!m) return;
    setBusy(true);
    try {
      await actions.setMemberActive(m.uid, false);
      notifications.show({ color: 'ok', icon: <IconCheck size={16} />, title: `${m.displayName} removed`, message: 'Their access ended straight away.' });
      setConfirm(false);
      onClose();
    } catch {
      notifications.show({ color: 'err', title: 'Couldn’t remove them', message: 'Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Drawer opened={!!m} onClose={onClose} position="right" size={420} padding="lg" title={<Text fw={700} fz={17}>Team member</Text>}>
        {m ? (
          <Stack gap="xl">
            <Group gap="md" wrap="nowrap">
              <UserAvatar name={m.displayName} photo={m.photo} size={52} />
              <Box style={{ minWidth: 0 }}>
                <Text fw={700} fz={18} truncate>
                  {m.displayName}
                </Text>
                <Text c="dimmed" fz={14}>
                  {ROLE_LABEL[m.role]}
                </Text>
              </Box>
            </Group>

            {m.role === 'attendant' ? (
              <Stack gap="md">
                <Text fw={700} fz={13} c="dimmed" style={{ letterSpacing: 0.6 }}>
                  WHAT THEY CAN SEE
                </Text>
                <Text fz={14} c="dimmed" lh={1.5}>
                  Everyone on your team sees the amount, code, time, who paid and the masked number M-Pesa shows.
                </Text>
                {PERMISSION_OPTIONS.map((o) => (
                  <Switch key={o.key} label={o.label} description={o.hint} checked={m.permissions[o.key] === true} onChange={(e) => void setPerm(o.key, e.currentTarget.checked)} />
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" fz={14.5} lh={1.55}>
                This phone reads M-Pesa messages and passes them on. It can’t see payments.
              </Text>
            )}

            <Button variant="default" color="err" c="err.7" onClick={() => setConfirm(true)} fullWidth>
              Remove access
            </Button>
          </Stack>
        ) : null}
      </Drawer>

      <Modal opened={confirm} onClose={() => setConfirm(false)} title={<Text fw={700} fz={18}>Remove {m?.displayName}?</Text>} size={440} padding="lg">
        <Stack gap="lg">
          <Text c="dimmed" fz={15} lh={1.55}>
            They lose access straight away and stop receiving payment alerts. You can add them again later with their account ID.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button color="err" loading={busy} onClick={() => void remove()}>
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
