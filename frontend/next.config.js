/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Sube/ajusta si necesitás otros tamaños
    deviceSizes: [320, 420, 768, 1024, 1200, 1600],
    remotePatterns: [
      // Unsplash & variantes comunes
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },

      // Pexels / Wikimedia
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },

      // Avatares / placehold
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'randomuser.me' },

      // Muy común en portfolios
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
  },
};

module.exports = nextConfig;