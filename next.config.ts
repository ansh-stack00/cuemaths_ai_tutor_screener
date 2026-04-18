import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // needed for audio uploads on Day 2
    },
  },
};

export default nextConfig;
