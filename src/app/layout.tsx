import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import './globals.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';

import { SessionProvider } from '@/lib/session';
import { theme } from '@/theme';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TillSync', template: '%s · TillSync' },
  description: 'Every M-Pesa Till payment, the moment it lands. For you and your team.',
};

export const viewport: Viewport = { themeColor: '#1A6FB8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps} className={`${jakarta.variable} ${plexMono.variable}`}>
      <head>
        <ColorSchemeScript forceColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} forceColorScheme="light">
          <Notifications position="bottom-center" />
          <SessionProvider>{children}</SessionProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
