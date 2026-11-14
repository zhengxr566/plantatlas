import type { CropRect } from "./CropDialog";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片无法加载"));
    img.src = src;
  });
}

// 在画布上给区域打马赛克（和服务器的处理接近，只用于预览）
export function pixelateCanvas(ctx: CanvasRenderingContext2D, regions: CropRect[], scale: number) {
  const canvas = ctx.canvas;
  for (const r of regions) {
    const x = Math.max(0, Math.round(r.x * scale));
    const y = Math.max(0, Math.round(r.y * scale));
    const w = Math.min(canvas.width - x, Math.round(r.width * scale));
    const h = Math.min(canvas.height - y, Math.round(r.height * scale));
    if (w <= 0 || h <= 0) continue;
    const block = Math.max(3, Math.round(Math.max(w, h) / 10));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.ceil(w / block));
    small.height = Math.max(1, Math.ceil(h / block));
    small.getContext("2d")?.drawImage(canvas, x, y, w, h, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, small.width, small.height, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  }
}

// 上传队列的小预览：先打码，再裁剪（坐标都是原图像素）
export async function makePreview(src: string, crop?: CropRect | null, redact: CropRect[] = []) {
  const img = await loadImage(src);
  const full = document.createElement("canvas");
  const fullScale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  full.width = Math.round(img.naturalWidth * fullScale);
  full.height = Math.round(img.naturalHeight * fullScale);
  const ctx = full.getContext("2d")!;
  ctx.drawImage(img, 0, 0, full.width, full.height);
  pixelateCanvas(ctx, redact, fullScale);

  const area = crop ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
  const out = document.createElement("canvas");
  const outScale = Math.min(1, 480 / Math.max(area.width, area.height));
  out.width = Math.round(area.width * outScale);
  out.height = Math.round(area.height * outScale);
  out
    .getContext("2d")
    ?.drawImage(
      full,
      area.x * fullScale,
      area.y * fullScale,
      area.width * fullScale,
      area.height * fullScale,
      0,
      0,
      out.width,
      out.height
    );
  return out.toDataURL("image/jpeg", 0.85);
}
