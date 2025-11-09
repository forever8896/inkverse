import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Existing config options */
  eslint: {
    // Disable ESLint errors from blocking production builds.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to succeed even if there are type errors.
    ignoreBuildErrors: true,
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

export default nextConfig;
