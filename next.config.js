/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tinymce/tinymce-react'],
  async redirects() {
    return [
      {
        source: '/en/packages',
        destination: '/en/experiences/by-type/group',
        permanent: true,
      },
      {
        source: '/en/packages/:path*',
        destination: '/en/experiences/:path*',
        permanent: true,
      },
      {
        source: '/packages',
        destination: '/experiences/by-type/group',
        permanent: true,
      },
      {
        source: '/packages/:path*',
        destination: '/experiences/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200, 1600],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

module.exports = nextConfig;
