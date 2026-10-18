import { Avatar, type AvatarProps } from '@mantine/core';

import { initials } from '@/lib/format';

/** A person's photo, or their initials when they have none. */
export function UserAvatar({ name, photo, ...props }: { name: string; photo?: string | null } & Omit<AvatarProps, 'src' | 'children'>) {
  return (
    <Avatar src={photo ?? undefined} alt={photo ? name : ''} color="brand" radius={999} {...props}>
      {initials(name)}
    </Avatar>
  );
}
