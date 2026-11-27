// 日本語版の共通ヘルパー：URL、写真の代替テキスト、hreflang
import { getJaPlant, jaPlants, type JaPlant } from "@/data/ja/plants";
import type { PlantPhoto } from "@/lib/loadPhotos";
import { pageLanguages, plantAlternates } from "@/lib/i18n";

export const SITE_URL = "https://plantatlasworld.com";

export const jaPlantPath = (slug: string) => `/ja/plant/${slug}`;

// 日本語版の画像利用ページ（画像の構造化データの license / acquireLicensePage にも使う）
export const JA_IMAGE_LICENSE_URL = `${SITE_URL}/ja/image-license`;

// 写真の部位
const PART_JA: Record<string, string> = {
  leaf: "葉",
  flower: "花",
  fruit: "果実",
  cone: "球果",
  seed: "種子",
  bark: "樹皮",
  branch: "枝",
  bud: "芽",
  habit: "樹形",
  autumn: "紅葉・黄葉",
};

export function partJa(part: string, plant?: JaPlant) {
  // 草本では「樹形」ではなく「草姿」
  if (part === "habit" && plant?.habit.includes("草")) return "草姿";
  return PART_JA[part] ?? part;
}

// photos.csv の季節・場所は中国語で入力されているので日本語に置き換える
const SEASON_JA: Record<string, string> = { 春季: "春", 夏季: "夏", 秋季: "秋", 冬季: "冬" };
const PLACE_JA: Record<string, string> = { 东京: "東京", 東京: "東京", 日本: "日本" };

export function photoMetaJa(photo: PlantPhoto) {
  const season = SEASON_JA[photo.season] ?? "";
  const place = PLACE_JA[photo.location] ?? "";
  return [season, place, photo.date].filter(Boolean).join(" · ");
}

export function photoAltJa(photo: PlantPhoto, plant: JaPlant, latin: string) {
  const season = SEASON_JA[photo.season];
  const place = PLACE_JA[photo.location];
  const where = [place, season].filter(Boolean).join("・");
  return `${plant.name}の${partJa(photo.part, plant)}（${latin}）${where ? `｜${where}で撮影` : ""}`;
}

// hreflang は lib/i18n.ts で 3 言語（簡体字・日本語・繁体字）まとめて管理する
export function zhPlantAlternates(slug: string) {
  return plantAlternates(slug, "zh-CN");
}

export function jaPlantAlternates(slug: string) {
  return plantAlternates(slug, "ja");
}

export const HOME_ALTERNATES = pageLanguages({ zh: "", ja: "/ja", tw: "/zh-tw" });

export { jaPlants, getJaPlant };
