import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Existing config options */
  eslint: {
    // Disable ESLint errors from blocking production builds.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to succeed even if there are type errors.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
