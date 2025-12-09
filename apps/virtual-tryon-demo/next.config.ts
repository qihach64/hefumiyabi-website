import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kimono-one/virtual-tryon'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
