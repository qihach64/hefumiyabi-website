import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

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
      // AWS S3 + CloudFront (新图片系统)
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.s3.ap-northeast-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      // 占位图服务
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      // Supabase (AI 试穿结果，迁移前保留)
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      // 第三方图片服务
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
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },
    ],
  },
};

// ANALYZE=true pnpm build 启用 bundle 分析
const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default analyzer(nextConfig);
