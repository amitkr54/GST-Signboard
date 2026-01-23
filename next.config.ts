import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingExcludes: {
    '*': [
      './public/fonts/**/*',
      './node_modules/@swc/core-linux-x64-gnu/**/*',
      './node_modules/@swc/core-linux-x64-musl/**/*',
      './node_modules/canvas/**/*'
    ]
  },
};

export default nextConfig;
