/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  images: {
    domains: ["localhost", "family.themewfi.xyz"],
  },
  experimental: {
    // appDir is no longer needed in Next.js 14
  },
};

module.exports = withPWA(nextConfig);
