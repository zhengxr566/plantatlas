import { adminRoute } from "@/lib/admin/route";
import { addPhoto, cropPhoto, deletePhoto, updatePhoto } from "@/lib/admin/store";

// 上传：multipart/form-data，file + meta(JSON)
export const POST = adminRoute(async (request: Request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("缺少图片文件");
  const meta = JSON.parse(String(form.get("meta") ?? "{}"));
  const crop = form.get("crop") ? JSON.parse(String(form.get("crop"))) : null;
  return addPhoto(Buffer.from(await file.arrayBuffer()), meta, crop);
});

export const PATCH = adminRoute(async (request: Request) => {
  const { file, crop, ...input } = await request.json();
  // 只传 crop 时：重新裁剪已有图片
  if (crop) return { row: await cropPhoto(file, crop) };
  return { row: updatePhoto(file, input) };
});

export const DELETE = adminRoute(async (request: Request) => {
  const { file } = await request.json();
  deletePhoto(file);
});
