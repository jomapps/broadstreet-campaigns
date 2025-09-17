/** @type {import('next').NextConfig} */
const nextConfig = {
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
