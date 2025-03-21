/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allows production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allows production builds to successfully complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  // env variables that should be available to the client
  env: {
    // Add any public environment variables here if needed
  },
};

module.exports = nextConfig;
