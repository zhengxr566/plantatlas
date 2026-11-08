// 从实拍图中挑选代表图片：首页、识别页等用来展示的图片
import type { Plant } from "@/lib/loadPlants";
import { groupPhotosByPlant, type PlantPhoto } from "@/lib/loadPhotos";

// 没有指定特征时，优先用最能代表整株植物的部位
const PART_PRIORITY = ["habit", "leaf", "autumn", "flower", "fruit", "cone", "bark", "branch", "seed", "bud"];

function partRank(part: string) {
  const i = PART_PRIORITY.indexOf(part);
  return i < 0 ? PART_PRIORITY.length : i;
}

function matchCount(photo: PlantPhoto, tags: string[]) {
  return photo.tags.filter((t) => tags.includes(t)).length;
}

// 一种植物的代表图：先看标签是否符合当前主题（例如“秋天变黄”），再按部位优先级
export function pickPhoto(photos: PlantPhoto[], preferTags: string[] = []) {
  return [...photos].sort(
    (a, b) =>
      matchCount(b, preferTags) - matchCount(a, preferTags) ||
      partRank(a.part) - partRank(b.part) ||
      a.file.localeCompare(b.file)
  )[0];
}

function photoTime(photo: PlantPhoto) {
  return photo.updated || photo.date || "";
}

export type PhotoWithPlant = { photo: PlantPhoto; plant: Plant };

function withPlants(photos: PlantPhoto[], plants: Plant[]): PhotoWithPlant[] {
  const bySlug = new Map(plants.map((p) => [p.slug, p]));
  return photos.flatMap((photo) => {
    const plant = bySlug.get(photo.plant);
    return plant ? [{ photo, plant }] : [];
  });
}

// 最新实拍：按更新日期倒序；onePerPlant 时每种植物只取一张，画面更丰富
export function latestPhotos(photos: PlantPhoto[], plants: Plant[], limit: number, onePerPlant = false) {
  const sorted = [...photos].sort(
    (a, b) => photoTime(b).localeCompare(photoTime(a)) || partRank(a.part) - partRank(b.part)
  );
  const seen = new Set<string>();
  const picked = onePerPlant
    ? sorted.filter((p) => (seen.has(p.plant) ? false : (seen.add(p.plant), true)))
    : sorted;
  return withPlants(picked, plants).slice(0, limit);
}

// 某个主题（识别页的 tagRules）的实拍示例：照片标签符合主题的排在前面，每种植物最多一张
export function themePhotos(photos: PlantPhoto[], plants: Plant[], tags: string[], limit: number) {
  const slugs = new Set(plants.map((p) => p.slug));
  const byPlant = groupPhotosByPlant(photos.filter((p) => slugs.has(p.plant)));
  const picks = [...byPlant.values()]
    .map((list) => pickPhoto(list, tags))
    .sort((a, b) => matchCount(b, tags) - matchCount(a, tags) || partRank(a.part) - partRank(b.part));
  return withPlants(picks, plants).slice(0, limit);
}

// 每种植物的代表图（没有实拍图的植物不在结果中）
export function photoByPlant(photos: PlantPhoto[], preferTags: string[] = []) {
  const map = new Map<string, PlantPhoto>();
  groupPhotosByPlant(photos).forEach((list, slug) => map.set(slug, pickPhoto(list, preferTags)));
  return map;
}

// 识别入口的封面：每个入口用匹配植物中最符合主题的实拍，尽量不和前面的入口重复
export function identifyCovers<T extends { tagRules: string[] }>(
  pages: T[],
  plants: Plant[],
  photos: PlantPhoto[]
) {
  const used = new Set<string>();
  return pages.map((page) => {
    const matched = plants.filter((p) => (p.tags ?? []).some((t) => page.tagRules.includes(t)));
    const candidates = themePhotos(photos, matched, page.tagRules, matched.length);
    // 只在同样符合主题的图片之间换，避免为了不重复而选了不相关的图
    const best = candidates.length > 0 ? matchCount(candidates[0].photo, page.tagRules) : 0;
    const cover =
      candidates.find((c) => !used.has(c.photo.id) && matchCount(c.photo, page.tagRules) === best) ??
      candidates[0];
    if (cover) used.add(cover.photo.id);
    return { page, cover, count: matched.length };
  });
}
