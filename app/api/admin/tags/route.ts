import { adminRoute } from "@/lib/admin/route";
import {
  addTag,
  deleteTag,
  getTagUsage,
  readTagGroups,
  renameTag,
} from "@/lib/admin/store";

export const GET = adminRoute(async () => ({
  tagGroups: readTagGroups(),
  usage: getTagUsage(),
}));

// 新增标签（可指定 tags.md 中的分组）
export const POST = adminRoute(async (request: Request) => {
  const { tag, group } = await request.json();
  addTag(String(tag ?? ""), group ? String(group) : undefined);
  return { tagGroups: readTagGroups() };
});

// 重命名 / 合并
export const PATCH = adminRoute(async (request: Request) => {
  const { from, to } = await request.json();
  const changed = renameTag(String(from), String(to ?? ""));
  return { changed, tagGroups: readTagGroups() };
});

export const DELETE = adminRoute(async (request: Request) => {
  const { tag } = await request.json();
  const changed = deleteTag(String(tag));
  return { changed, tagGroups: readTagGroups() };
});
