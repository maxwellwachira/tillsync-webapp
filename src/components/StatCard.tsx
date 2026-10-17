import { Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { tokens } from '@/theme';

/** One working figure: a label and a value. Quiet by design: the payment card is the headline. */
export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Paper withBorder p="lg" style={{ borderColor: tokens.line }}>
      <Stack gap={6}>
        <Text fz={13.5} c="dimmed" fw={500}>
          {label}
        </Text>
        <Text fz={26} fw={700} className="tnum" lh={1.1} style={{ letterSpacing: '-0.025em' }}>
          {value}
        </Text>
        {hint ? (
          <Text fz={12.5} c="dimmed">
            {hint}
          </Text>
        ) : null}
      </Stack>
    </Paper>
  );
}
