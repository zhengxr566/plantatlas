// 繁體中文版（台灣）：由簡體內容轉換，並套用台灣用語、單位和標點。
import * as OpenCC from "opencc-js";
import { getZhPlant, zhPlants, type ZhPlant } from "@/data/zh/plants";
import { twOverrides } from "@/data/tw/overrides";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import { plantsWithPhotos } from "@/lib/loadPhotos";

export const SITE_URL = "https://plantatlasworld.com";
export const TW_BASE = "/zh-tw";
export const twPlantPath = (slug: string) => `${TW_BASE}/plant/${slug}`;
export const TW_IMAGE_LICENSE_URL = `${SITE_URL}${TW_BASE}/image-license`;

// 簡體 → 繁體（台灣正體 + 台灣常用詞彙，例如 软件→軟體、信息→資訊）
const opencc = OpenCC.Converter({ from: "cn", to: "twp" });

// OpenCC 之後再處理的台灣用語（植物名稱以台灣常用名為準）
const TERMS: [RegExp | string, string][] = [
  // OpenCC 會把「壳」轉成「殼鬥」，植物學名稱是「殼斗」
  ["殼鬥", "殼斗"],
  ["臺灣", "台灣"],
  ["青岡櫟", "青剛櫟"],
  ["小葉青岡", "小葉青剛櫟"],
  ["青岡亞屬", "青剛櫟亞屬"],
  ["青岡屬", "青剛櫟屬"],
  ["青岡類", "青剛櫟類"],
  ["南紫薇", "九芎（南紫薇）"],
  ["爬山虎", "地錦（爬牆虎）"],
  ["東京櫻花（染井吉野）", "吉野櫻（染井吉野）"],
  ["東京櫻花", "吉野櫻"],
  ["識別", "辨識"],
  ["分佈", "分布"],
  ["傢俱", "家具"],
  ["克隆", "無性繁殖系"],
  ["單位和小區", "機關和社區"],
  ["小區和單位", "社區和機關"],
  ["小區", "社區"],
  ["橡子", "橡實"],
  // 單位：公分、公釐、公尺
  [/(\d)\s*釐米/g, "$1 公分"],
  [/(\d)\s*毫米/g, "$1 公釐"],
  [/(\d)\s*米(?![粉飯])/g, "$1 公尺"],
  // 引號用「」『』
  ["“", "「"],
  ["”", "」"],
  ["‘", "『"],
  ["’", "』"],
];

export function toTw(text: string) {
  let out = opencc(text);
  for (const [from, to] of TERMS) {
    out = typeof from === "string" ? out.split(from).join(to) : out.replace(from, to);
  }
  return out;
}

export type TwPlant = {
  slug: string;
  name: string;
  latin: string;
  aliases: string[];
  family: string;
  genus: string;
  habit: string;
  title: string;
  description: string;
  lead: string[];
  points: ZhPlant["points"];
  similar: ZhPlant["similar"];
  seasons: ZhPlant["seasons"];
  where: string;
  notes: string[];
  updated: string;
};

// 台灣版只收錄有手寫內容、且有實拍圖的植物
export function twPlantSlugs() {
  const photos = plantsWithPhotos();
  return zhPlants.filter((p) => photos.has(p.slug)).map((p) => p.slug);
}

export function hasTwPlant(slug: string) {
  return twPlantSlugs().includes(slug);
}

// 其他植物在台灣版中的名稱（用於連結和清單）
export function twName(plant: Plant) {
  return twOverrides[plant.slug]?.name ?? toTw(plant.nameCn);
}

export function getTwPlant(slug: string): TwPlant | null {
  const zh = getZhPlant(slug);
  const base = loadPlants().find((p) => p.slug === slug);
  if (!zh || !base || !hasTwPlant(slug)) return null;
  const o = twOverrides[slug] ?? {};
  const name = o.name ?? toTw(base.nameCn);
  const convertedName = toTw(base.nameCn);
  // 台灣名稱和原中文名不同時，把原名放進別名
  const aliases = [
    ...(o.aliases ?? []),
    ...(name !== convertedName ? [convertedName] : []),
    ...base.aliases.map(toTw),
  ].filter((a, i, all) => a !== name && all.indexOf(a) === i);

  // 正文只做簡繁轉換，不替換植物名（例如把「杜鵑」換成「唐杜鵑」會連「杜鵑花科」一起改錯）
  const fix = toTw;

  // 相似植物：同名條目以台灣版取代，其餘轉換
  const overrideNames = new Set((o.similar ?? []).map((s) => s.name));
  const similar = [
    ...(o.similar ?? []),
    ...zh.similar
      .map((s) => ({ ...s, name: fix(s.name), text: fix(s.text) }))
      .filter((s) => !overrideNames.has(s.name))
      // 在台灣會造成混淆的條目（簡體版的「山樱花」「东京樱花」已由台灣版條目取代）
      .filter((s) => !(slug === "prunus-jamasakura" && /山櫻花|吉野櫻/.test(s.name))),
  ];

  return {
    slug,
    name,
    latin: base.nameLatin,
    aliases,
    family: toTw(base.family),
    genus: toTw(base.genus),
    habit: toTw(base.habit ?? ""),
    title: fix(zh.title),
    description: fix(zh.description),
    lead: zh.lead.map(fix),
    points: zh.points.map((p) => ({ label: fix(p.label), text: fix(p.text) })),
    similar,
    seasons: zh.seasons.map((s) => ({ label: fix(s.label), text: fix(s.text) })),
    where: [fix(zh.where), o.whereTw].filter(Boolean).join(""),
    notes: [...zh.notes.map(fix), ...(o.notes ?? [])],
    updated: zh.updated,
  };
}
