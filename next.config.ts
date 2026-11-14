import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 中文版和日语版各有一个根布局（app/(zh)、app/(ja)），找不到页面时用 app/global-not-found.tsx
  experimental: {
    globalNotFound: true,
  },
  // 公开的标签建议接口在运行时读取这些数据文件
  outputFileTracingIncludes: {
    "/api/suggest-tags": ["./tags.md", "./data/photos.csv"],
  },
  images: {
    // 实拍图在上传时已生成 320/640/960/1600 宽的 WebP，由自定义加载器直接引用，
    // 不使用 Vercel 的图片优化（免费版每月只有 5000 次）
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    // 与 VARIANT_WIDTHS 对应，避免 srcset 里出现多余的宽度
    deviceSizes: [640, 960, 1600],
    imageSizes: [320],
  },
};

export default nextConfig;
