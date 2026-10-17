import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Mantine ships many small modules: import only what is used.
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@mantine/charts', '@mantine/dates', '@tabler/icons-react'],
  },
};

export default nextConfig;
