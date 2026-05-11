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
};

export default nextConfig;
