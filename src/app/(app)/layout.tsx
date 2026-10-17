'use client';

import { AppShell, Avatar, Box, Burger, Divider, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBuildingStore, IconChevronDown, IconCreditCard, IconDeviceMobile, IconEye, IconEyeOff, IconHome2, IconLogout, IconSettings, IconUsers } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Logo } from '@/components/Logo';
import { Splash } from '@/components/Splash';
import { StatusPill } from '@/components/StatusPill';
import { useDevices } from '@/lib/data';
import { initials } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useHideAmounts } from '@/lib/privacy';
import { useSession } from '@/lib/session';
import { worstHealth } from '@/lib/stats';
import { ROLE_LABEL, type Role } from '@/lib/types';
import { useGate } from '@/lib/useGate';
import { tokens } from '@/theme';

import classes from './shell.module.css';

const NAV: { href: string; label: string; icon: typeof IconHome2; roles: Role[] }[] = [
  { href: '/home', label: 'Home', icon: IconHome2, roles: ['owner'] },
  { href: '/payments', label: 'Payments', icon: IconCreditCard, roles: ['owner', 'attendant'] },
  { href: '/team', label: 'Team', icon: IconUsers, roles: ['owner'] },
  { href: '/devices', label: 'Devices', icon: IconDeviceMobile, roles: ['owner', 'attendant'] },
  { href: '/account', label: 'Account', icon: IconSettings, roles: ['owner', 'attendant'] },
];

function TillStatus() {
  const { devices } = useDevices();
  const now = useNow(15_000);
  if (!devices) return null;
  const h = worstHealth(devices, now);
  if (h === null) return <StatusPill label="No Till phone" tone="neutral" />;
  if (h === 'connected') return <StatusPill label="Till connected" tone="ok" />;
  if (h === 'interrupted') return <StatusPill label="Till not reporting" tone="err" />;
  if (h === 'permission') return <StatusPill label="Till needs SMS access" tone="warn" />;
  return <StatusPill label="Till waiting" tone="neutral" />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ok } = useGate(['ready']);
  const { membership, user, signOut } = useSession();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [hidden, toggleHidden] = useHideAmounts();
  const pathname = usePathname();
  const router = useRouter();
  const role = membership?.role;

  // Each role only sees its own screens: an attendant who opens an owner link lands on Payments.
  useEffect(() => {
    if (!role) return;
    const here = NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
    if (here && !here.roles.includes(role)) router.replace('/payments');
  }, [role, pathname, router]);

  if (!ok || !membership) return <Splash />;
  const items = NAV.filter((n) => n.roles.includes(membership.role));
  const name = membership.displayName || user?.displayName || user?.email || 'You';

  return (
    <AppShell header={{ height: 64 }} navbar={{ width: 264, breakpoint: 'md', collapsed: { mobile: !opened } }} padding={0} withBorder>
      <AppShell.Header className={classes.header}>
        <Group h="100%" px={{ base: 'md', md: 'xl' }} justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" aria-label="Open menu" />
            <Logo size={32} />
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Box visibleFrom="xs">
              <TillStatus />
            </Box>
            <UnstyledButton onClick={toggleHidden} aria-label={hidden ? 'Show amounts' : 'Hide amounts'} aria-pressed={hidden} className={classes.iconBtn} title={hidden ? 'Show amounts' : 'Hide amounts'}>
              {hidden ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </UnstyledButton>
            <Menu position="bottom-end" width={240} shadow="md" radius="md">
              <Menu.Target>
                <UnstyledButton className={classes.userBtn} aria-label="Account menu">
                  <Avatar color="brand" radius="xl" size={34}>
                    {initials(name)}
                  </Avatar>
                  <IconChevronDown size={16} color={tokens.muted} />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Box px="sm" py={8}>
                  <Text fw={600} fz="sm" truncate>
                    {name}
                  </Text>
                  <Text fz={12.5} c="dimmed" truncate>
                    {user?.email ?? ROLE_LABEL[membership.role]}
                  </Text>
                </Box>
                <Menu.Divider />
                <Menu.Item component={Link} href="/account" leftSection={<IconSettings size={16} />}>
                  Account
                </Menu.Item>
                <Menu.Item leftSection={<IconLogout size={16} />} onClick={() => void signOut()}>
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className={classes.navbar}>
        <Stack h="100%" justify="space-between" p="md" gap="lg">
          <Stack gap="xl">
            <Group gap={12} wrap="nowrap" px={8} pt={4}>
              <Box className={classes.bizIcon}>
                <IconBuildingStore size={20} />
              </Box>
              <Box style={{ minWidth: 0 }}>
                <Text fw={700} fz={15.5} lh={1.25} truncate>
                  {membership.businessName}
                </Text>
                <Text fz={12.5} c="dimmed">
                  Your business
                </Text>
              </Box>
            </Group>
            <Stack gap={4} component="nav" aria-label="Main">
              {items.map((n) => {
                const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
                return (
                  <UnstyledButton key={n.href} component={Link} href={n.href} onClick={close} className={classes.link} data-active={active || undefined} aria-current={active ? 'page' : undefined}>
                    <n.icon size={21} stroke={active ? 2.1 : 1.8} />
                    <span>{n.label}</span>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Stack>
          <Stack gap="sm">
            <Divider />
            <Group gap="sm" wrap="nowrap" px={6}>
              <Avatar color="brand" radius="xl" size={38}>
                {initials(name)}
              </Avatar>
              <Box style={{ minWidth: 0 }}>
                <Text fw={600} fz={14} truncate>
                  {name}
                </Text>
                <Text fz={12.5} c="dimmed" truncate>
                  {ROLE_LABEL[membership.role]}
                </Text>
              </Box>
            </Group>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main className={classes.main}>{children}</AppShell.Main>
    </AppShell>
  );
}
