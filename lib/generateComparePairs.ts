import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import {
  getPartTags,
  groupPhotosByPlant,
  loadPhotos,
  type PlantPhoto,
} from "@/lib/loadPhotos";
import { plantParts } from "@/data/parts";

// 两种植物同一部位的照片至少共享多少个标签，才自动生成对比页
const MIN_SHARED_PHOTO_TAGS = 2;
// 每种植物最多自动生成多少组对比，避免大量低质量页面
const MAX_AUTO_PAIRS_PER_PLANT = 8;

export type PartOverlap = {
  part: string;
  sharedTags: string[];
};

// data/compare.csv 中手写的对比内容
export type CompareNote = {
  keyPoints: string[];
  intro: string;
  updated: string;
};

export type ComparePair = {
  slug: string;
  title: string;
  plantA: Plant;
  plantB: Plant;
  // similar：plants.csv 手动指定；manual：compare.csv 手写；photo：由图片标签自动发现
  sources: ("similar" | "manual" | "photo")[];
  score: number;
  // 两者都有照片的部位，以及该部位共享的标签
  partOverlaps: PartOverlap[];
  note?: CompareNote;
  // 有实拍图逐部位对比或手写要点时才允许被搜索引擎收录，
  // 只有模板文字的页面设为 noindex，避免被判定为批量生成的低质量内容
  indexable: boolean;
};

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[、,，|]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeName(value: unknown): string {
  return String(value || "").trim();
}

function makePairKey(slugA: string, slugB: string) {
  return [slugA, slugB].sort().join("__");
}

function loadCompareNotes() {
  const filePath = path.join(process.cwd(), "data", "compare.csv");
  if (!fs.existsSync(filePath)) return [];

  const rows = parse(fs.readFileSync(filePath, "utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rows
    .filter((row) => row.plantA && row.plantB)
    .map((row) => ({
      plantA: row.plantA,
      plantB: row.plantB,
      note: {
        keyPoints: (row.keyPoints || "")
          .split("|")
          .map((v) => v.trim())
          .filter(Boolean),
        intro: row.intro || "",
        updated: row.updated || "",
      },
    }));
}

function getPartOverlaps(
  photosA: PlantPhoto[],
  photosB: PlantPhoto[]
): PartOverlap[] {
  return plantParts
    .filter(
      (part) =>
        photosA.some((p) => p.part === part.slug) &&
        photosB.some((p) => p.part === part.slug)
    )
    .map((part) => {
      const tagsB = getPartTags(photosB, part.slug);
      return {
        part: part.slug,
        sharedTags: getPartTags(photosA, part.slug).filter((tag) =>
          tagsB.includes(tag)
        ),
      };
    });
}

function scorePair(a: Plant, b: Plant, overlaps: PartOverlap[]) {
  const sharedTagCount = overlaps.reduce(
    (sum, o) => sum + o.sharedTags.length,
    0
  );
  let score = sharedTagCount * 2 + overlaps.length;
  if (a.genusSlug && a.genusSlug === b.genusSlug) score += 3;
  else if (a.familySlug && a.familySlug === b.familySlug) score += 1;
  return score;
}

export function generateComparePairs(): ComparePair[] {
  const plants = loadPlants();
  const photosByPlant = groupPhotosByPlant(loadPhotos());

  const pairs = new Map<string, ComparePair>();

  function addPair(a: Plant, b: Plant, source: ComparePair["sources"][number]) {
    const key = makePairKey(a.slug, b.slug);
    const existing = pairs.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      return;
    }

    const overlaps = getPartOverlaps(
      photosByPlant.get(a.slug) ?? [],
      photosByPlant.get(b.slug) ?? []
    );

    pairs.set(key, {
      // 先出现的植物在前，保持已被收录的 URL 不变
      slug: `${a.slug}-vs-${b.slug}`,
      title: `${a.nameCn}和${b.nameCn}的区别`,
      plantA: a,
      plantB: b,
      sources: [source],
      score: scorePair(a, b, overlaps),
      partOverlaps: overlaps,
      indexable: overlaps.length > 0,
    });
  }

  // 1. plants.csv 中手动维护的 similar
  const plantsByName = new Map(
    plants.map((plant) => [normalizeName(plant.nameCn), plant])
  );

  plants.forEach((plant) => {
    toList(plant.similar).forEach((similarName) => {
      const target = plantsByName.get(normalizeName(similarName));
      if (!target || target.slug === plant.slug) return;
      addPair(plant, target, "similar");
    });
  });

  // 2. compare.csv 中手写的对比（已存在的对比保持原 URL，新对比为 plantA-vs-plantB）
  const plantsBySlug = new Map(plants.map((plant) => [plant.slug, plant]));
  const notes = loadCompareNotes();

  notes.forEach(({ plantA, plantB }) => {
    const a = plantsBySlug.get(plantA);
    const b = plantsBySlug.get(plantB);
    if (a && b && a.slug !== b.slug) addPair(a, b, "manual");
  });

  // 3. 图片标签自动发现：同一部位共享标签越多，越容易混淆
  const photoPlants = plants.filter((p) => photosByPlant.has(p.slug));
  const candidates: { a: Plant; b: Plant; score: number }[] = [];

  photoPlants.forEach((a, i) => {
    photoPlants.slice(i + 1).forEach((b) => {
      const overlaps = getPartOverlaps(
        photosByPlant.get(a.slug)!,
        photosByPlant.get(b.slug)!
      );
      const shared = overlaps.reduce((n, o) => n + o.sharedTags.length, 0);
      if (shared < MIN_SHARED_PHOTO_TAGS) return;
      candidates.push({ a, b, score: scorePair(a, b, overlaps) });
    });
  });

  const autoCount = new Map<string, number>();
  candidates
    .sort((x, y) => y.score - x.score)
    .forEach(({ a, b }) => {
      const [first, second] = [a, b].sort((x, y) =>
        x.slug.localeCompare(y.slug)
      );
      const isNew = !pairs.has(makePairKey(a.slug, b.slug));
      if (
        isNew &&
        ((autoCount.get(a.slug) ?? 0) >= MAX_AUTO_PAIRS_PER_PLANT ||
          (autoCount.get(b.slug) ?? 0) >= MAX_AUTO_PAIRS_PER_PLANT)
      ) {
        return;
      }
      addPair(first, second, "photo");
      if (isNew) {
        autoCount.set(a.slug, (autoCount.get(a.slug) ?? 0) + 1);
        autoCount.set(b.slug, (autoCount.get(b.slug) ?? 0) + 1);
      }
    });

  notes.forEach(({ plantA, plantB, note }) => {
    const pair = pairs.get(makePairKey(plantA, plantB));
    if (!pair) return;
    pair.note = note;
    if (note.keyPoints.length > 0 || note.intro) pair.indexable = true;
  });

  return Array.from(pairs.values()).sort(
    (x, y) => Number(y.indexable) - Number(x.indexable) || y.score - x.score
  );
}

// 按两种植物查找对比关系（不区分顺序）
export function findComparePair(
  pairs: ComparePair[],
  slugA: string,
  slugB: string
) {
  const key = makePairKey(slugA, slugB);
  return pairs.find((p) => makePairKey(p.plantA.slug, p.plantB.slug) === key);
}

export function getPairsForPlant(pairs: ComparePair[], slug: string) {
  return pairs.filter((p) => p.plantA.slug === slug || p.plantB.slug === slug);
}
