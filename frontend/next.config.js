/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'source.unsplash.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },      // avatares "humanos"
      { protocol: 'https', hostname: 'picsum.photos' },      // fallback
      { protocol: 'https', hostname: 'images.unsplash.com' } // por si ya usás Unsplash
    ],
  },
};