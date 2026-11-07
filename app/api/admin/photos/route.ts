import { adminRoute } from "@/lib/admin/route";
import { addPhoto, deletePhoto, updatePhoto } from "@/lib/admin/store";

// 上传：multipart/form-data，file + meta(JSON)
export const POST = adminRoute(async (request: Request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("缺少图片文件");
  const meta = JSON.parse(String(form.get("meta") ?? "{}"));
  return addPhoto(Buffer.from(await file.arrayBuffer()), meta);
});

export const PATCH = adminRoute(async (request: Request) => {
  const { file, ...input } = await request.json();
  return { row: updatePhoto(file, input) };
});

export const DELETE = adminRoute(async (request: Request) => {
  const { file } = await request.json();
  deletePhoto(file);
});
