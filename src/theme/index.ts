import { createTheme, type MantineColorsTuple } from '@mantine/core';

/**
 * TillSync design tokens, shared with the mobile app: a white canvas, one blue, honest status colours,
 * Plus Jakarta Sans for text and IBM Plex Mono for M-Pesa codes.
 */
export const tokens = {
  bg: '#FFFFFF',
  surface: '#F6F8FB',
  field: '#F1F4F8',
  line: '#E6EBF1',
  divider: '#EDF0F5',
  ink: '#17201C',
  muted: '#5F6B64',
  subtle: '#7C8794',
  brand: '#1A6FB8',
  brandPressed: '#155A96',
  brandTonal: '#D8E7F8',
  brandTint: '#E6F0FB',
  onBrandTonal: '#0F4A7F',
  ok: '#17874B',
  okBg: '#E7F5EC',
  okText: '#0F6B3A',
  warn: '#C98A00',
  warnBg: '#FFF3D6',
  warnText: '#5E3E00',
  err: '#B3261E',
  errBg: '#FDECEA',
  errText: '#6B1710',
  neutralBg: '#EFF2F6',
} as const;

const brand: MantineColorsTuple = ['#EAF3FC', '#D8E7F8', '#B5D1F0', '#8DB8E6', '#5F9BD8', '#3A84CA', '#1A6FB8', '#155A96', '#104677', '#0B3358'];
const ok: MantineColorsTuple = ['#E7F5EC', '#CDEBD9', '#9DD8B6', '#6AC48F', '#3FB170', '#24A05E', '#17874B', '#0F6B3A', '#0B5530', '#073F24'];
const warn: MantineColorsTuple = ['#FFF3D6', '#FFE8B0', '#FFD878', '#FFC73F', '#F2B318', '#DE9F0A', '#C98A00', '#9F6C00', '#7A5300', '#5E3E00'];
const err: MantineColorsTuple = ['#FDECEA', '#F9D3CF', '#F2A8A1', '#EB7C72', '#E15A4E', '#D13F32', '#B3261E', '#8F1E18', '#6B1710', '#4C0F0B'];

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: { brand, ok, warn, err },
  black: tokens.ink,
  white: '#FFFFFF',
  fontFamily: 'var(--font-jakarta), system-ui, -apple-system, "Segoe UI", sans-serif',
  fontFamilyMonospace: 'var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: { fontFamily: 'var(--font-jakarta), system-ui, sans-serif', fontWeight: '700' },
  fontWeights: { medium: '500' },
  defaultRadius: 'md',
  radius: { xs: '6px', sm: '8px', md: '12px', lg: '20px', xl: '24px' },
  cursorType: 'pointer',
  components: {
    Button: { defaultProps: { radius: 'xl', size: 'md' }, styles: { root: { fontWeight: 600 } } },
    TextInput: { defaultProps: { variant: 'filled', size: 'md' } },
    PasswordInput: { defaultProps: { variant: 'filled', size: 'md' } },
    Select: { defaultProps: { variant: 'filled', size: 'md' } },
    NumberInput: { defaultProps: { variant: 'filled', size: 'md' } },
    Textarea: { defaultProps: { variant: 'filled', size: 'md' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Card: { defaultProps: { radius: 'lg' } },
    Modal: { defaultProps: { radius: 'lg', centered: true, overlayProps: { backgroundOpacity: 0.4, blur: 0 } } },
    Drawer: { defaultProps: { radius: 'lg', overlayProps: { backgroundOpacity: 0.4, blur: 0 } } },
    Badge: { defaultProps: { radius: 'sm' } },
    SegmentedControl: { defaultProps: { radius: 'xl' } },
    Tooltip: { defaultProps: { radius: 'sm' } },
  },
});
