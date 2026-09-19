import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
