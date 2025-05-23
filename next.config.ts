import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  images: {
    domains: [], // Add domains for external images if needed
  },
  // Disable image optimization in development for faster builds
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default nextConfig;
