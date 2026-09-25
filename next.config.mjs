/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.ssactivewear.com',
        pathname: '/Images/**',
      },
    ],
  },
  // One address for the portal: anyone arriving on the old Vercel address is sent to the real domain.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'sanda-portal.vercel.app' }],
        destination: 'https://portal.sandascreenprinting.com/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
