// 三種語言（簡體中文、日文、繁體中文）之間的 hreflang
// 只把會被收錄的頁面放進 hreflang（noindex 的頁面放進去，Google 會判定為錯誤）
import { getJaPlant } from "@/data/ja/plants";
import { plantsWithPhotos } from "@/lib/loadPhotos";
import { hasTwPlant } from "@/lib/tw";

export const SITE_URL = "https://plantatlasworld.com";
export type Lang = "zh-CN" | "ja" | "zh-TW";

export function plantUrls(slug: string) {
  return {
    "zh-CN": `${SITE_URL}/plant/${slug}`,
    ja: `${SITE_URL}/ja/plant/${slug}`,
    "zh-TW": `${SITE_URL}/zh-tw/plant/${slug}`,
  } as const;
}

// 某種植物在各語言中可被收錄的版本
function indexableLangs(slug: string): Lang[] {
  const langs: Lang[] = [];
  if (plantsWithPhotos().has(slug)) langs.push("zh-CN");
  if (getJaPlant(slug)) langs.push("ja");
  if (hasTwPlant(slug)) langs.push("zh-TW");
  return langs;
}

export function plantLanguages(slug: string): Record<string, string> | undefined {
  const urls = plantUrls(slug);
  const langs = indexableLangs(slug);
  if (langs.length < 2) return undefined;
  const map: Record<string, string> = {};
  langs.forEach((l) => (map[l] = urls[l]));
  map["x-default"] = urls[langs[0]];
  return map;
}

// 植物頁的 canonical + hreflang
export function plantAlternates(slug: string, current: Lang) {
  const canonical = plantUrls(slug)[current];
  const languages = indexableLangs(slug).includes(current) ? plantLanguages(slug) : undefined;
  return languages ? { canonical, languages } : { canonical };
}

// 首頁、關於、隱私、圖片授權等三種語言都有的頁面
export function pageLanguages(path: { zh: string; ja: string; tw: string }) {
  return {
    "zh-CN": `${SITE_URL}${path.zh}`,
    ja: `${SITE_URL}${path.ja}`,
    "zh-TW": `${SITE_URL}${path.tw}`,
    "x-default": `${SITE_URL}${path.zh}`,
  };
}
