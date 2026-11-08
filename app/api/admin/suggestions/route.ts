import { adminRoute } from "@/lib/admin/route";
import { readPhotoRows, updatePhoto } from "@/lib/admin/store";
import {
  deleteSuggestion,
  isSuggestionEnabled,
  listSuggestions,
} from "@/lib/suggestions";

export const GET = adminRoute(async () => {
  if (!isSuggestionEnabled()) return { enabled: false, suggestions: [] };
  return { enabled: true, suggestions: await listSuggestions() };
});

// action: accept（把勾选的增删应用到 photos.csv）或 reject
export const POST = adminRoute(async (request: Request) => {
  const { id, action, add = [], remove = [] } = await request.json();
  const suggestion = (await listSuggestions()).find((s) => s.id === id);
  if (!suggestion) throw new Error("建议不存在或已处理");

  if (action === "accept") {
    const row = readPhotoRows().find((r) => r.file === suggestion.file);
    if (!row) throw new Error("图片已不存在，请拒绝这条建议");
    const current = row.tags.split("|").filter(Boolean);
    const tags = [
      ...current.filter((t) => !(remove as string[]).includes(t)),
      ...(add as string[]).filter((t) => !current.includes(t)),
    ];
    updatePhoto(row.file, {
      plant: row.plant,
      part: row.part,
      tags,
      caption: row.caption,
      season: row.season,
      location: row.location,
      date: row.date,
    });
  }

  await deleteSuggestion(id);
});
