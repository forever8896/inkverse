import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Dev: Local MinIO
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/monsters-dev/**',
      },
      {
        // Prod: Cloudflare R2
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Monaco editor configuration for proper asset handling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
      };
    }

    // Handle Monaco editor workers
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default withWorkflow(nextConfig);
