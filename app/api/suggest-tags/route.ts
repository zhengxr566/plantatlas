import { loadPhotos } from "@/lib/loadPhotos";
import {
  addSuggestion,
  clientIp,
  isSuggestionEnabled,
  SuggestionError,
} from "@/lib/suggestions";
import { getKnownTags, readTagGroups } from "@/lib/tags";

// 公开的标签建议接口：GET 返回可选标签词表，POST 提交建议（审核后才会生效）

export async function GET() {
  if (!isSuggestionEnabled()) return Response.json({ enabled: false, tagGroups: [] });
  return Response.json({ enabled: true, tagGroups: readTagGroups() });
}

function toTagList(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((v) => String(v).trim()).filter(Boolean)))
    : [];
}

export async function POST(request: Request) {
  if (!isSuggestionEnabled()) {
    return Response.json({ error: "标签建议功能暂未开放" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  // 防机器人：隐藏字段被填写，或打开后 2 秒内就提交，假装成功但不保存
  if (body.website || Number(body.elapsed) < 2000) {
    return Response.json({ ok: true });
  }

  const photo = loadPhotos().find((p) => p.file === body.file);
  if (!photo) return Response.json({ error: "图片不存在" }, { status: 404 });

  // 只接受 tags.md 中已有的标签；新增的必须是图片还没有的，删除的必须是图片已有的
  const known = getKnownTags();
  const add = toTagList(body.add).filter((t) => known.has(t) && !photo.tags.includes(t));
  const remove = toTagList(body.remove).filter((t) => photo.tags.includes(t));

  try {
    await addSuggestion(
      { file: photo.file, add, remove, note: String(body.note ?? "") },
      clientIp(request)
    );
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof SuggestionError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "提交失败，请稍后再试" }, { status: 500 });
  }
}
