import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 部署时忽略 ESLint 错误（开发时仍会显示警告）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 部署时忽略 TypeScript 错误（生产环境优先快速部署）
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "hefumiyabi.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rakuraku-kimono.com",
      },
      {
        protocol: "https",
        hostname: "ewha-yifu.com",
      },
    ],
  },
};

export default nextConfig;
