// 实拍图的预生成尺寸：上传时在本地生成 WebP，网站直接使用，不经过 Vercel 图片优化。
// 例如 /photos/ginkgo-biloba/leaf-01.jpg → /photos/ginkgo-biloba/leaf-01-640.webp
export const VARIANT_WIDTHS = [320, 640, 960, 1600] as const;

const PHOTO_SRC = /^\/photos\/.+\.(jpe?g|png)$/i;
const EXTENSION = /\.(jpe?g|png)$/i;

export function isPhotoSrc(src: string) {
  return PHOTO_SRC.test(src);
}

// 取不小于目标宽度的最小尺寸；超过最大尺寸时用最大的
export function pickVariantWidth(width: number) {
  return VARIANT_WIDTHS.find((w) => w >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
}

// 适用于网址（/photos/...）和文件路径
export function variantPath(path: string, width: number) {
  return path.replace(EXTENSION, `-${pickVariantWidth(width)}.webp`);
}
