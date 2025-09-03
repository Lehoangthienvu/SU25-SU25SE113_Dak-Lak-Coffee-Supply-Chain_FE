import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
    // Tối ưu hóa filesystem
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['cdn.lordicon.com'],
  },
  // Đảm bảo tương thích với Vercel
  trailingSlash: false,
  // Tắt ESLint trong quá trình build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Tối ưu hóa webpack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Tăng cache cho development
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
};

export default nextConfig;
