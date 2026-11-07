import { adminRoute } from "@/lib/admin/route";
import { addTag, readTagGroups } from "@/lib/admin/store";

export const POST = adminRoute(async (request: Request) => {
  const { tag } = await request.json();
  addTag(String(tag ?? ""));
  return { tagGroups: readTagGroups() };
});
