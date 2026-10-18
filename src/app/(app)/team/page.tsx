'use client';

import { Alert, Badge, Button, Group, Loader, Paper, Stack, Table, Text } from '@mantine/core';
import { IconChevronRight, IconInfoCircle, IconUserPlus } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AddMemberModal } from '@/components/AddMemberModal';
import { MemberDrawer } from '@/components/MemberDrawer';
import { Page } from '@/components/PageHeader';
import { UserAvatar } from '@/components/UserAvatar';
import { useMembers } from '@/lib/data';
import { PERMISSION_OPTIONS } from '@/lib/permissions';
import { useSession } from '@/lib/session';
import { ROLE_LABEL, type Member } from '@/lib/types';
import { tokens } from '@/theme';

function access(m: Member): string {
  if (m.role === 'owner') return 'Full access';
  if (m.role === 'till') return 'Reads M-Pesa messages';
  const extra = PERMISSION_OPTIONS.filter((o) => m.permissions[o.key]).map((o) => o.label);
  return extra.length ? `Basics + ${extra.join(', ').toLowerCase()}` : 'Basics only';
}

function TeamContent() {
  const { user } = useSession();
  const { members, error } = useMembers();
  const params = useSearchParams();
  const [adding, setAdding] = useState(params.get('add') != null);
  const [selected, setSelected] = useState<string | null>(null);
  const member = members?.find((m) => m.uid === selected) ?? null;

  return (
    <Page
      title="Team"
      subtitle="The people who can see your payments"
      actions={
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => setAdding(true)}>
          Add person
        </Button>
      }
    >
      <Paper withBorder style={{ borderColor: tokens.line, overflow: 'hidden' }}>
        {error ? (
          <Stack align="center" py={56}>
            <Text fw={600}>Couldn’t load your team</Text>
            <Text c="dimmed" fz={14}>
              Check your connection and try again.
            </Text>
          </Stack>
        ) : members === null ? (
          <Stack align="center" py={56}>
            <Loader size="sm" type="dots" />
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={560}>
            <Table verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  {['Name', 'Role', 'Can see', ''].map((h) => (
                    <Table.Th key={h} fz={12.5} fw={600} c="dimmed" style={{ borderBottom: `1px solid ${tokens.line}` }}>
                      {h}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.map((m) => {
                  const me = m.uid === user?.uid;
                  const manageable = m.role !== 'owner';
                  return (
                    <Table.Tr
                      key={m.uid}
                      className={manageable ? 'row-link' : undefined}
                      onClick={manageable ? () => setSelected(m.uid) : undefined}
                      onKeyDown={manageable ? (e) => (e.key === 'Enter' ? setSelected(m.uid) : undefined) : undefined}
                      tabIndex={manageable ? 0 : undefined}
                      role={manageable ? 'button' : undefined}
                      aria-label={manageable ? `Manage ${m.displayName}` : undefined}
                    >
                      <Table.Td style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                        <Group gap="md" wrap="nowrap">
                          <UserAvatar name={m.displayName} photo={m.photo} size={38} />
                          <Text fw={600} fz={15}>
                            {m.displayName}
                            {me ? <Text span c="dimmed" fw={500}> (you)</Text> : null}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                        <Badge variant="light" color={m.role === 'owner' ? 'brand' : m.role === 'till' ? 'gray' : 'ok'} radius="sm">
                          {ROLE_LABEL[m.role]}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                        <Text fz={14} c="dimmed">
                          {access(m)}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right" style={{ borderBottom: `1px solid ${tokens.divider}` }}>
                        {manageable ? <IconChevronRight size={18} color={tokens.subtle} /> : null}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {members && members.length <= 1 ? (
        <Alert color="brand" variant="light" radius="md" icon={<IconInfoCircle size={20} />} title="It’s just you so far">
          Add attendants to show them payments, or add your Till phone. They create an account, then send you the account ID from their Welcome screen.
        </Alert>
      ) : null}

      <AddMemberModal opened={adding} onClose={() => setAdding(false)} initialRole={params.get('add') === 'till' ? 'till' : 'attendant'} />
      <MemberDrawer member={member} onClose={() => setSelected(null)} />
    </Page>
  );
}

export default function Team() {
  return (
    <Suspense fallback={null}>
      <TeamContent />
    </Suspense>
  );
}
