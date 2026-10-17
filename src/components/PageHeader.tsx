import { Box, Container, Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

/** The frame every app page sits in: a title, a line of context, actions on the right, then content. */
export function Page({ title, subtitle, actions, children, width = 1180 }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; width?: number }) {
  return (
    <Container size={width} px={{ base: 'md', sm: 'xl' }} py={{ base: 'lg', sm: 32 }} pb={64}>
      <Stack gap={28}>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Title order={1} fz={{ base: 26, sm: 32 }} style={{ letterSpacing: '-0.035em' }}>
              {title}
            </Title>
            {subtitle ? (
              <Text c="dimmed" fz={15}>
                {subtitle}
              </Text>
            ) : null}
          </Stack>
          {actions ? <Box>{actions}</Box> : null}
        </Group>
        {children}
      </Stack>
    </Container>
  );
}
