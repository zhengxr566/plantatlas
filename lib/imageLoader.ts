"use client";

// next/image 的自定义加载器：实拍图直接使用预生成的 WebP 尺寸（见 lib/imageVariants.ts），
// 不调用 Vercel 的图片优化服务，因此没有次数限制。
import { isPhotoSrc, variantPath } from "./imageVariants";

export default function imageLoader({ src, width }: { src: string; width: number }) {
  return isPhotoSrc(src) ? variantPath(src, width) : src;
}
