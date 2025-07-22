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
  webpack: (config, { dev }) => {
    if (dev) {
      // Ignore specific files/directories from hot reload
      config.watchOptions = {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/dist/**",
          "**/build/**",
          // Add any other directories that shouldn't trigger rebuilds
        ],
      };
      config.infrastructureLogging = {
        level: "error",
      };
    }
    return config;
  },
};

export default nextConfig;
