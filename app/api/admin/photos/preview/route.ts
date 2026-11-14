import { adminDisabledResponse, decodeHeic, isAdminEnabled } from "@/lib/admin/store";

// 浏览器（Chrome / Edge）不能显示 HEIC：后台先把它转成 JPEG 用于预览和裁剪。
// 上传时仍然发送原始 HEIC 文件，由服务器再转换一次。
export async function POST(request: Request) {
  if (!isAdminEnabled()) return adminDisabledResponse();
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new Error("缺少图片文件");
    const jpeg = await decodeHeic(Buffer.from(await file.arrayBuffer()), 0.85);
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `HEIC 转换失败：${message}` }, { status: 400 });
  }
}
