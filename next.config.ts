import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 实拍图放在 public/photos，由 next/image 自动输出 WebP/AVIF
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
