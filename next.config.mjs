/** @type {import('next').NextConfig} */
const nextConfig = {
  //images and type allowed
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.broadstreetads.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.travelm.de',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuration for Next.js with Tailwind CSS v4
  eslint: {
    // Only run ESLint on these directories during `next build`
    dirs: ['src'],
    // Don't fail the build for ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build for TypeScript errors during development
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
