import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'bcryptjs'];
    return config;
  },
};

export default nextConfig;
