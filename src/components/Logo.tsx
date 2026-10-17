import { Group, Text } from '@mantine/core';

const BUBBLE = 'M330 215H694A120 120 0 0 1 814 335V580A120 120 0 0 1 694 700H480L320 835V700H330A120 120 0 0 1 210 580V335A120 120 0 0 1 330 215Z';
const T_HOLE = 'M380 335H644V419H553V605H471V419H380Z';

/** The TillSync mark: a message bubble with the T of "Till" cut out of it. */
export function LogoMark({ size = 36, tile = true, color = '#fff' }: { size?: number; tile?: boolean; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" role="img" aria-label="TillSync" style={{ display: 'block', flexShrink: 0 }}>
      {tile ? <rect width="1024" height="1024" rx="224" fill="#1A6FB8" /> : null}
      <g transform={`translate(512 512) scale(${tile ? 0.74 : 1}) translate(-512 -525)`}>
        <path fill={color} fillRule="evenodd" d={`${BUBBLE}${T_HOLE}`} />
      </g>
    </svg>
  );
}

export function Logo({ size = 36, wordmark = true, light = false }: { size?: number; wordmark?: boolean; light?: boolean }) {
  return (
    <Group gap={10} wrap="nowrap">
      {light ? <LogoMark size={size} tile={false} /> : <LogoMark size={size} />}
      {wordmark ? (
        <Text fw={700} fz={size * 0.55} lh={1} c={light ? 'white' : 'dark.9'} style={{ letterSpacing: '-0.02em' }}>
          TillSync
        </Text>
      ) : null}
    </Group>
  );
}
