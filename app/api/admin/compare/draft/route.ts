import { adminRoute } from "@/lib/admin/route";
import { draftKeyPoints } from "@/lib/admin/compareTools";

export const GET = adminRoute(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  return draftKeyPoints(params.get("plantA") ?? "", params.get("plantB") ?? "");
});
