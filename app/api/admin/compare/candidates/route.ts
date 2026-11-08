import { adminRoute } from "@/lib/admin/route";
import { addSimilar, getCompareCandidates } from "@/lib/admin/compareTools";

export const GET = adminRoute(async () => ({ candidates: getCompareCandidates() }));

// 采纳候选：把 plantB 加入 plantA 的相似植物
export const POST = adminRoute(async (request: Request) => {
  const { plantA, plantB } = await request.json();
  return addSimilar(String(plantA), String(plantB));
});
