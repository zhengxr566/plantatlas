export { PART_TAG_GROUPS } from "@/data/parts";

export type AdminPlant = {
  slug: string;
  nameCn: string;
  nameLatin: string;
  family: string;
  division: string;
  className: string;
  // 植物资料中的标签，上传图片时按部位预选
  tags: string[];
};

export type AdminPart = {
  slug: string;
  nameCn: string;
  noun: string;
  lookFor: string;
};

export type TagGroup = { name: string; tags: string[] };

export type PhotoRow = {
  file: string;
  plant: string;
  part: string;
  tags: string;
  caption: string;
  season: string;
  location: string;
  date: string;
  author: string;
  license: string;
  width: string;
  height: string;
};

export type CompareNoteRow = {
  plantA: string;
  plantB: string;
  keyPoints: string;
  intro: string;
};

export type AdminPair = {
  slug: string;
  title: string;
  plantA: string;
  plantB: string;
  sources: string[];
  indexable: boolean;
  parts: string[];
};

export type AdminData = {
  plants: AdminPlant[];
  parts: AdminPart[];
  tagGroups: TagGroup[];
  photos: PhotoRow[];
  compareNotes: CompareNoteRow[];
  pairs: AdminPair[];
};

export type PhotoMeta = {
  plant: string;
  part: string;
  tags: string[];
  caption: string;
  season: string;
  location: string;
  date: string;
};

export const SEASONS = ["春季", "夏季", "秋季", "冬季"];

export async function api<T = unknown>(
  url: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    ...(json !== undefined
      ? {
          body: JSON.stringify(json),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `请求失败（${res.status}）`);
  return data as T;
}

export function splitTags(value: string) {
  return value.split("|").map((t) => t.trim()).filter(Boolean);
}

// 每个部位的照片能看出来的标签（按标签文字判断；tags.md 的“季节”“特殊识别”等分组混着不同部位的特征，不能按分组整组带入）
// 生活型、用途类的标签（落叶乔木、观叶树、秋色叶树种）描述整株植物，不预选到局部照片
const LIFE_FORM = /乔木|灌木|植物$|^观|树种$/;
const PART_TAG_RULES: Record<string, (tag: string) => boolean> = {
  leaf: (t) => !LIFE_FORM.test(t) && /叶|针松|秋天变/.test(t),
  autumn: (t) => !LIFE_FORM.test(t) && /秋/.test(t),
  flower: (t) => !LIFE_FORM.test(t) && /花/.test(t) && !/花不明显/.test(t),
  fruit: (t) => /果实|翅果|浆果|白果/.test(t),
  cone: (t) => /球果|松果/.test(t),
  seed: (t) => /种子|翅果/.test(t),
  bark: (t) => /树皮/.test(t),
  branch: (t) => /枝/.test(t),
  bud: (t) => /芽/.test(t),
  habit: (t) => /树冠|乔木|灌木|枝条下垂/.test(t),
};

// 上传图片时按部位从植物资料中预选的标签（例如银杏 + 叶片 → 扇形叶、放射状叶脉、秋天变黄）
// 分类名（杜鹃花科、蓝花楹属）不是照片上能看到的特征
const TAXON = /[纲目科属]$/;

export function partTagsFor(plant: AdminPlant | undefined, part: string) {
  const rule = PART_TAG_RULES[part];
  return plant && rule ? plant.tags.filter((t) => !TAXON.test(t) && rule(t)) : [];
}

export function plantLabel(plant?: AdminPlant) {
  return plant ? `${plant.nameCn} · ${plant.nameLatin}` : "";
}
