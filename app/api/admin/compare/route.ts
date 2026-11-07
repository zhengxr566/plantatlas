import { adminRoute } from "@/lib/admin/route";
import { saveCompareNote } from "@/lib/admin/store";

export const PUT = adminRoute(async (request: Request) => {
  const { plantA, plantB, keyPoints, intro } = await request.json();
  saveCompareNote(plantA, plantB, keyPoints ?? [], intro ?? "");
});
