import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    swcPlugins: [],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
