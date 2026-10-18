'use client';

import { Box, Button, CopyButton, FileButton, Group, Paper, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCamera, IconCheck, IconCopy, IconLogout, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import { Page } from '@/components/PageHeader';
import { useBusinessActions } from '@/lib/data';
import { UserAvatar } from '@/components/UserAvatar';
import { photoFromFile } from '@/lib/photo';
import { FriendlyError, useSession } from '@/lib/session';
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
  const { membership, user, signOut, reload, saveProfile, canChangePassword, changePassword } = useSession();
  const { renameBusiness } = useBusinessActions();
  const [saving, setSaving] = useState(false);
  const owner = membership?.role === 'owner';
  const form = useForm({ initialValues: { name: membership?.businessName ?? '' }, validate: { name: (v) => (v.trim().length >= 2 ? null : 'Enter your business name.') } });
  // `undefined` = photo unchanged, `null` = remove it, a string = the new photo waiting to be saved.
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const profile = useForm({
    initialValues: { displayName: membership?.displayName ?? '', phone: membership?.phone ?? '' },
    validate: {
      displayName: (v) => (v.trim().length >= 1 && v.trim().length <= 80 ? null : 'Enter your name (up to 80 characters).'),
      phone: (v) => (v.trim() === '' || /^[+0-9 ()-]{7,20}$/.test(v.trim()) ? null : 'Use digits only, for example 0712 345 678.'),
    },
  });
  const password = useForm({
    initialValues: { current: '', next: '', again: '' },
    validate: {
      current: (v) => (v ? null : 'Enter your current password.'),
      next: (v) => (v.length >= 6 ? null : 'Use at least 6 characters.'),
      again: (v, all) => (v === all.next ? null : 'The two passwords do not match.'),
    },
  });
  if (!membership || !user) return null;
  const name = profile.values.displayName.trim() || membership.displayName || user.displayName || user.email || 'You';
  const shownPhoto = photo === undefined ? membership.photo : photo;
  const dirty = photo !== undefined || profile.values.displayName.trim() !== membership.displayName || profile.values.phone.trim() !== membership.phone;

  return (
    <Page title="Account" subtitle="You and your business" width={760}>
      <Section title="Your profile">
        <Group gap="lg" wrap="nowrap" align="center">
          <UserAvatar name={name} photo={shownPhoto} size={84} fz={28} />
          <Stack gap={8} style={{ minWidth: 0 }}>
            <Group gap="xs">
              <FileButton
                accept="image/png,image/jpeg,image/webp,image/heic"
                onChange={async (file) => {
                  if (!file) return;
                  setPhotoError(null);
                  try {
                    setPhoto(await photoFromFile(file));
                  } catch {
                    setPhotoError('That picture could not be used. Try a JPG or PNG.');
                  }
                }}
              >
                {(props) => (
                  <Button {...props} variant="default" size="sm" leftSection={<IconCamera size={17} />}>
                    {shownPhoto ? 'Change photo' : 'Add photo'}
                  </Button>
                )}
              </FileButton>
              {shownPhoto ? (
                <Button variant="subtle" color="gray" size="sm" leftSection={<IconTrash size={16} />} onClick={() => setPhoto(null)}>
                  Remove
                </Button>
              ) : null}
            </Group>
            <Text fz={13} c={photoError ? 'err.7' : 'dimmed'}>
              {photoError ?? 'Your team sees this next to your name. It is cropped to a square.'}
            </Text>
          </Stack>
        </Group>
        <form
          noValidate
          onSubmit={profile.onSubmit(async (v) => {
            setSavingProfile(true);
            try {
              await saveProfile({ displayName: v.displayName, phone: v.phone, photo });
              setPhoto(undefined);
              notifications.show({ color: 'ok', icon: <IconCheck size={16} />, title: 'Saved', message: 'Your profile was updated.' });
            } catch (e) {
              notifications.show({ color: 'err', title: 'Couldn’t save', message: e instanceof FriendlyError ? e.message : 'Check your connection and try again.' });
            } finally {
              setSavingProfile(false);
            }
          })}
        >
          <Stack gap="md">
            <TextInput label="Full name" autoComplete="name" {...profile.getInputProps('displayName')} />
            <TextInput label="Phone number" description="Optional. Only you and the owner can see it." placeholder="0712 345 678" autoComplete="tel" inputMode="tel" {...profile.getInputProps('phone')} />
            <TextInput label="Email" value={user.email ?? 'No email on this account'} disabled description="Your sign-in email can't be changed here." />
            <Group>
              <Button type="submit" loading={savingProfile} disabled={!dirty}>
                Save changes
              </Button>
              {dirty ? (
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    profile.setValues({ displayName: membership.displayName, phone: membership.phone });
                    profile.clearErrors();
                    setPhoto(undefined);
                    setPhotoError(null);
                  }}
                >
                  Discard
                </Button>
              ) : null}
            </Group>
          </Stack>
        </form>
        <Text fz={13.5} fw={600} c="brand.7">
          {ROLE_LABEL[membership.role]} · {membership.businessName}
        </Text>
      </Section>

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

      {canChangePassword ? (
        <Section title="Password">
          <form
            noValidate
            onSubmit={password.onSubmit(async (v) => {
              setSavingPassword(true);
              try {
                await changePassword(v.current, v.next);
                password.reset();
                notifications.show({ color: 'ok', icon: <IconCheck size={16} />, title: 'Password changed', message: 'Use the new password next time you sign in.' });
              } catch (e) {
                notifications.show({ color: 'err', title: 'Couldn’t change it', message: e instanceof FriendlyError ? e.message : 'Check your connection and try again.' });
              } finally {
                setSavingPassword(false);
              }
            })}
          >
            <Stack gap="md" maw={420}>
              <PasswordInput label="Current password" autoComplete="current-password" {...password.getInputProps('current')} />
              <PasswordInput label="New password" description="At least 6 characters." autoComplete="new-password" {...password.getInputProps('next')} />
              <PasswordInput label="New password again" autoComplete="new-password" {...password.getInputProps('again')} />
              <Button type="submit" loading={savingPassword} w="fit-content">
                Change password
              </Button>
            </Stack>
          </form>
        </Section>
      ) : null}

      <Button variant="default" leftSection={<IconLogout size={18} />} onClick={() => void signOut()} w="fit-content">
        Sign out
      </Button>
    </Page>
  );
}
