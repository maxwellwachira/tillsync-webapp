import { Center, Loader, Stack } from '@mantine/core';

import { LogoMark } from './Logo';

/** Shown while the session is being restored. */
export function Splash() {
  return (
    <Center mih="100vh">
      <Stack align="center" gap="lg">
        <LogoMark size={52} />
        <Loader size="sm" color="brand" type="dots" />
      </Stack>
    </Center>
  );
}
