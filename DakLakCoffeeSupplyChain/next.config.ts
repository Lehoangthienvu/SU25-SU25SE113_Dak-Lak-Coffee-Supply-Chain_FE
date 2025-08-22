import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
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
  // Cấu hình routing
  async rewrites() {
    return [
      {
        source: '/(.*)',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
