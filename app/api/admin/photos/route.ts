import { adminRoute } from "@/lib/admin/route";
import { addPhoto, cropPhoto, deletePhoto, updatePhoto } from "@/lib/admin/store";

// 上传：multipart/form-data，file + meta(JSON)，可选 crop(JSON) 和 redact(JSON，打码区域)
export const POST = adminRoute(async (request: Request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("缺少图片文件");
  const meta = JSON.parse(String(form.get("meta") ?? "{}"));
  const crop = form.get("crop") ? JSON.parse(String(form.get("crop"))) : null;
  const redact = form.get("redact") ? JSON.parse(String(form.get("redact"))) : [];
  return addPhoto(Buffer.from(await file.arrayBuffer()), meta, crop, file.name, redact);
});

export const PATCH = adminRoute(async (request: Request) => {
  const { file, crop, redact, ...input } = await request.json();
  // 只传 crop / redact 时：重新裁剪或打码已有图片
  if (crop || redact) return { row: await cropPhoto(file, crop ?? null, redact) };
  return { row: updatePhoto(file, input) };
});

export const DELETE = adminRoute(async (request: Request) => {
  const { file } = await request.json();
  deletePhoto(file);
});
