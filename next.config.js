/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  images: {
    domains: ["localhost", "family.themewfi.xyz"],
    // Disable image optimization during build to avoid sharp dependency issues on Vercel
    unoptimized: process.env.NODE_ENV === "production",
  },
  experimental: {
    // appDir is no longer needed in Next.js 14
  },
};

module.exports = withPWA(nextConfig);
