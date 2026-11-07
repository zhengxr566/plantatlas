export type AdminPlant = {
  slug: string;
  nameCn: string;
  nameLatin: string;
  family: string;
  division: string;
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

// 不同部位优先显示的标签分组（按 tags.md 分组名的前两个字匹配）
export const PART_TAG_GROUPS: Record<string, string[]> = {
  leaf: ["叶片", "季节", "特殊"],
  autumn: ["季节", "叶片"],
  flower: ["花果", "季节"],
  fruit: ["花果"],
  cone: ["花果", "叶片"],
  seed: ["花果"],
  bark: ["特殊", "树形"],
  branch: ["树形", "特殊"],
  bud: ["季节", "特殊"],
  habit: ["树形", "季节", "用途", "环境"],
};

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

export function plantLabel(plant?: AdminPlant) {
  return plant ? `${plant.nameCn} · ${plant.nameLatin}` : "";
}
