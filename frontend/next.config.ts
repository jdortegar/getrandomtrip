import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;