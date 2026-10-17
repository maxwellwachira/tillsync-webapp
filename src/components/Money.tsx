import { Group, Text, type TextProps } from '@mantine/core';

import { formatAmount } from '@/lib/format';

type Props = {
  amount: number;
  /** Size of the figure in px; the "KSh" label scales with it. */
  size?: number;
  weight?: number;
  color?: string;
  unitColor?: string;
  hidden?: boolean;
} & Pick<TextProps, 'className'>;

/** "KSh 2,500": a small currency label and a large figure on one baseline, tabular so columns line up. */
export function Money({ amount, size = 20, weight = 700, color, unitColor, hidden, className }: Props) {
  const unit = Math.max(11, Math.round(size * 0.42));
  const dot = Math.max(6, Math.round(size * 0.26));
  return (
    <Group gap={Math.max(3, Math.round(size * 0.16))} wrap="nowrap" align="baseline" className={className} aria-label={hidden ? 'Amount hidden' : `${amount} Kenya shillings`}>
      <Text span fz={unit} fw={600} c={unitColor ?? 'dimmed'} style={{ letterSpacing: 0 }}>
        KSh
      </Text>
      {hidden ? (
        <span aria-hidden style={{ display: 'inline-flex', gap: dot * 0.8, alignSelf: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: dot, height: dot, borderRadius: '50%', background: color ?? 'var(--mantine-color-dark-9)' }} />
          ))}
        </span>
      ) : (
        <Text span fz={size} fw={weight} c={color} className="tnum" style={{ letterSpacing: size >= 32 ? '-0.03em' : '-0.01em', lineHeight: 1.05 }}>
          {formatAmount(amount)}
        </Text>
      )}
    </Group>
  );
}
