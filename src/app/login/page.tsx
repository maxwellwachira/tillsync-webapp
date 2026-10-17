'use client';

import { Alert, Anchor, Box, Button, Divider, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconArrowDownLeft } from '@tabler/icons-react';
import { useState } from 'react';

import { Logo } from '@/components/Logo';
import { Money } from '@/components/Money';
import { Splash } from '@/components/Splash';
import { FriendlyError, useSession } from '@/lib/session';
import { useGate } from '@/lib/useGate';

import classes from './login.module.css';

const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const SAMPLE = [
  { name: 'John Juma', code: 'QWE7AB12CD', amount: 2500, when: 'just now', fresh: true },
  { name: 'Alex Muigai', code: 'QWE8EF34GH', amount: 1200, when: '3 min ago' },
  { name: 'Mercy Fatuma', code: 'QWE9JK56LM', amount: 5000, when: '5 min ago' },
];

/** A preview drawn from the real product's own rows, so what people see here is what they get. */
function Preview() {
  return (
    <Box style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', color: 'var(--ts-ink)', boxShadow: '0 1px 0 rgba(255,255,255,0.1)' }} maw={440} w="100%">
      {SAMPLE.map((p, i) => (
        <Group key={p.code} wrap="nowrap" gap="md" px="lg" py={14} style={{ background: p.fresh ? 'var(--ts-brand-tint)' : undefined, borderTop: i ? '1px solid var(--ts-divider)' : undefined }}>
          <Box w={40} h={40} style={{ borderRadius: '50%', background: '#E7F5EC', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <IconArrowDownLeft size={20} color="#0F6B3A" />
          </Box>
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Money amount={p.amount} size={22} />
            <Text className="mono" fz={12} fw={600}>
              {p.code}
            </Text>
            <Text fz={13} c="dimmed" truncate>
              {p.name}
            </Text>
          </Stack>
          <Stack gap={4} align="flex-end">
            <Text fz={12.5} c="dimmed">
              {p.when}
            </Text>
            {p.fresh ? (
              <Text span fz={11} fw={700} px={8} py={2} c="ok.7" style={{ background: '#E7F5EC', borderRadius: 6 }}>
                New
              </Text>
            ) : null}
          </Stack>
        </Group>
      ))}
    </Box>
  );
}

export default function LoginPage() {
  const { ok } = useGate(['signedOut', 'loading', 'error']);
  const { status, signInEmail, signUpEmail, signInGoogle, resetPassword } = useSession();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Enter a valid email address.'),
      password: (v) => (mode === 'signup' ? (v.length >= 6 ? null : 'Use at least 6 characters.') : v.length > 0 ? null : 'Enter your password.'),
    },
  });

  if (!ok || status === 'loading') return <Splash />;
  const signup = mode === 'signup';

  async function run(kind: 'email' | 'google', fn: () => Promise<unknown>) {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof FriendlyError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={classes.root}>
      <aside className={classes.brand}>
        <Logo size={40} light />
        <Stack gap="xl">
          <Stack gap="md">
            <Title order={1} c="white" fz={{ base: 34, lg: 44 }} lh={1.08} style={{ letterSpacing: '-0.035em' }} maw={520}>
              Every Till payment, the moment it lands.
            </Title>
            <Text c="rgba(255,255,255,0.8)" fz={17} lh={1.55} maw={460}>
              M-Pesa messages from your Till phone, shown to you and your team in real time. No more asking, no more waiting.
            </Text>
          </Stack>
          <Preview />
        </Stack>
        <Text fz={13} c="rgba(255,255,255,0.7)" maw={460}>
          Totals are counted from M-Pesa messages on your Till phone, not from verified settlement.
        </Text>
      </aside>

      <main className={classes.formSide}>
        <div className={classes.formInner}>
          <div className={classes.mobileLogo}>
            <Logo size={36} />
          </div>
          <Stack gap="xl">
            <Stack gap={6}>
              <Title order={2} fz={30} style={{ letterSpacing: '-0.03em' }}>
                {signup ? 'Create your account' : 'Sign in'}
              </Title>
              <Text c="dimmed">{signup ? 'Then set up your business, or join one.' : 'See the payments coming into your Till.'}</Text>
            </Stack>

            <Button variant="default" size="lg" leftSection={<GoogleG />} loading={busy === 'google'} disabled={busy === 'email'} onClick={() => void run('google', signInGoogle)} fullWidth>
              Continue with Google
            </Button>

            <Divider label="or with email" labelPosition="center" />

            <form onSubmit={form.onSubmit((v) => void run('email', () => (signup ? signUpEmail(v.email, v.password) : signInEmail(v.email, v.password))))} noValidate>
              <Stack gap="md">
                <TextInput label="Email address" placeholder="name@example.co.ke" type="email" autoComplete="email" {...form.getInputProps('email')} />
                <PasswordInput label="Password" placeholder={signup ? 'At least 6 characters' : undefined} autoComplete={signup ? 'new-password' : 'current-password'} {...form.getInputProps('password')} />
                {error ? (
                  <Alert color="err" variant="light" icon={<IconAlertCircle size={18} />} radius="md" role="alert">
                    {error}
                  </Alert>
                ) : null}
                {notice ? (
                  <Alert color="ok" variant="light" radius="md">
                    {notice}
                  </Alert>
                ) : null}
                <Button type="submit" size="lg" loading={busy === 'email'} disabled={busy === 'google'} fullWidth mt={4}>
                  {signup ? 'Create account' : 'Sign in'}
                </Button>
              </Stack>
            </form>

            {!signup ? (
              <Group justify="center">
                <Anchor
                  component="button"
                  type="button"
                  fz="sm"
                  fw={600}
                  onClick={() => {
                    const v = form.validateField('email');
                    if (v.hasError) return;
                    void run('email', async () => {
                      await resetPassword(form.values.email);
                      setNotice('If an account exists for that email, a reset link is on its way.');
                    });
                  }}
                >
                  Forgot password?
                </Anchor>
              </Group>
            ) : null}

            <Group justify="center" gap={6}>
              <Text fz="sm" c="dimmed">
                {signup ? 'Already have an account?' : 'New to TillSync?'}
              </Text>
              <Anchor
                component="button"
                type="button"
                fz="sm"
                fw={600}
                onClick={() => {
                  setMode(signup ? 'signin' : 'signup');
                  setError(null);
                  setNotice(null);
                  form.clearErrors();
                }}
              >
                {signup ? 'Sign in' : 'Create account'}
              </Anchor>
            </Group>
          </Stack>
        </div>
      </main>
    </div>
  );
}
