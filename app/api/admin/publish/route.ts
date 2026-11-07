import { adminRoute } from "@/lib/admin/route";
import { getPublishStatus, publish } from "@/lib/admin/store";

export const GET = adminRoute(async () => getPublishStatus());

export const POST = adminRoute(async (request: Request) => {
  const { message } = await request.json();
  return publish(String(message ?? ""));
});
