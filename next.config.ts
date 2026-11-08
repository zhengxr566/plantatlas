import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 公开的标签建议接口在运行时读取这些数据文件
  outputFileTracingIncludes: {
    "/api/suggest-tags": ["./tags.md", "./data/photos.csv"],
  },
  images: {
    // 实拍图放在 public/photos，由 next/image 自动输出 WebP/AVIF
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        // 维基百科 API 目前返回的缩略图域名
        protocol: "https",
        hostname: "thumb.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
