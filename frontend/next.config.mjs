/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND_API_URL:
      process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_PEXELS_API_KEY:
      process.env.NEXT_PUBLIC_PEXELS_API_KEY || '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;

