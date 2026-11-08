import { adminRoute } from "@/lib/admin/route";
import { deletePlant, readPlantRows, savePlant } from "@/lib/admin/store";

export const GET = adminRoute(async () => readPlantRows());

// 新增植物
export const POST = adminRoute(async (request: Request) => {
  const { row } = await request.json();
  return savePlant(row, true);
});

// 修改植物（slug 不可改）
export const PUT = adminRoute(async (request: Request) => {
  const { row } = await request.json();
  return savePlant(row, false);
});

export const DELETE = adminRoute(async (request: Request) => {
  const { slug } = await request.json();
  deletePlant(String(slug));
});
