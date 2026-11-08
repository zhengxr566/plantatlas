// 对比页自动化工具（后台用）：发现候选对比、起草核心区别、把候选加入相似植物
import { getPart, plantParts } from "@/data/parts";
import { generateComparePairs } from "@/lib/generateComparePairs";
import { getPartTags, groupPhotosByPlant, loadPhotos } from "@/lib/loadPhotos";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import { readPlantRows, savePlant } from "@/lib/admin/store";

// 候选的最低分数（同属直接入选；其余靠相同标签的稀有度累加）
const MIN_CANDIDATE_SCORE = 4;
const MAX_CANDIDATES = 60;

// 分类名称（纲/目/科/属等）不算识别特征
function isTaxonomyTag(tag: string, plant: Plant) {
  return (
    [plant.division, plant.className, plant.order, plant.family, plant.genus].includes(tag) ||
    /[纲目科属]$/.test(tag)
  );
}

function featureTags(plant: Plant) {
  return (plant.tags ?? []).filter((t) => !isTaxonomyTag(t, plant));
}

const pairKey = (a: string, b: string) => [a, b].sort().join("__");

export type CompareCandidate = {
  plantA: string;
  plantB: string;
  nameA: string;
  nameB: string;
  score: number;
  reasons: string[];
};

export function getCompareCandidates(): CompareCandidate[] {
  const plants = loadPlants();
  const photosByPlant = groupPhotosByPlant(loadPhotos());
  const existing = new Set(generateComparePairs().map((p) => pairKey(p.plantA.slug, p.plantB.slug)));

  // 标签越少见，权重越高（idf）
  const df = new Map<string, number>();
  plants.forEach((p) => featureTags(p).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const weight = (t: string) => Math.log(plants.length / (df.get(t) ?? 1));

  const candidates: CompareCandidate[] = [];

  plants.forEach((a, i) => {
    plants.slice(i + 1).forEach((b) => {
      if (existing.has(pairKey(a.slug, b.slug))) return;

      const reasons: string[] = [];
      let score = 0;

      if (a.genusSlug === b.genusSlug) {
        score += MIN_CANDIDATE_SCORE + 2;
        reasons.push(`同属（${a.genus}）`);
      } else if (a.familySlug === b.familySlug) {
        score += 1;
        reasons.push(`同科（${a.family}）`);
      }

      const tagsB = featureTags(b);
      const shared = featureTags(a)
        .filter((t) => tagsB.includes(t))
        .sort((x, y) => weight(y) - weight(x));
      const tagScore = shared.reduce((sum, t) => sum + weight(t), 0);
      score += tagScore;
      if (shared.length > 0 && tagScore >= 2) {
        reasons.push(`共同特征：${shared.slice(0, 5).join("、")}`);
      }

      // 同一部位的照片已有共同标签：补一个标签就可能自动配对
      const photosA = photosByPlant.get(a.slug) ?? [];
      const photosB = photosByPlant.get(b.slug) ?? [];
      plantParts.forEach((part) => {
        const tagsPartB = getPartTags(photosB, part.slug);
        const common = getPartTags(photosA, part.slug).filter((t) => tagsPartB.includes(t));
        if (common.length > 0) {
          score += common.length * 2;
          reasons.push(`${part.nameCn}照片相似：${common.join("、")}`);
        }
      });

      if (score >= MIN_CANDIDATE_SCORE) {
        candidates.push({
          plantA: a.slug,
          plantB: b.slug,
          nameA: a.nameCn,
          nameB: b.nameCn,
          score: Math.round(score * 10) / 10,
          reasons,
        });
      }
    });
  });

  return candidates.sort((x, y) => y.score - x.score).slice(0, MAX_CANDIDATES);
}

// 把 B 加入 A 的“相似植物”列，对比页随即生成
export function addSimilar(slugA: string, slugB: string) {
  const { rows } = readPlantRows();
  const a = rows.find((r) => r.slug === slugA);
  const b = rows.find((r) => r.slug === slugB);
  if (!a || !b) throw new Error("植物不存在");
  const similar = (a.similar || "").split("|").filter(Boolean);
  if (!similar.includes(b.nameCn)) similar.push(b.nameCn);
  return savePlant({ ...a, similar: similar.join("|") }, false);
}

// ---------- 核心区别草稿 ----------

const FIELD_POINTS: { key: keyof Plant; label: string }[] = [
  { key: "leaf", label: "看叶片" },
  { key: "flower", label: "看花" },
  { key: "fruit", label: "看果实" },
  { key: "bark", label: "看树皮" },
];

function shorten(text: string, max = 30) {
  const first = text.split(/[。；;]/)[0].trim();
  return first.length > max ? `${first.slice(0, max)}…` : first;
}

// 根据图片标签差异和图鉴描述起草核心区别，供站长修改后保存
export function draftKeyPoints(slugA: string, slugB: string) {
  const plants = loadPlants();
  const a = plants.find((p) => p.slug === slugA);
  const b = plants.find((p) => p.slug === slugB);
  if (!a || !b) throw new Error("植物不存在");

  const photosByPlant = groupPhotosByPlant(loadPhotos());
  const photosA = photosByPlant.get(a.slug) ?? [];
  const photosB = photosByPlant.get(b.slug) ?? [];
  const points: string[] = [];
  const covered = new Set<string>();

  // 1. 两者都有照片的部位：用各自独有的标签
  plantParts.forEach((part) => {
    const tagsA = getPartTags(photosA, part.slug);
    const tagsB = getPartTags(photosB, part.slug);
    if (tagsA.length === 0 || tagsB.length === 0) return;
    const onlyA = tagsA.filter((t) => !tagsB.includes(t));
    const onlyB = tagsB.filter((t) => !tagsA.includes(t));
    if (onlyA.length === 0 && onlyB.length === 0) return;
    points.push(
      `看${part.nameCn}：${a.nameCn}${onlyA.length ? onlyA.slice(0, 3).join("、") : "无明显独有特征"}，${b.nameCn}${onlyB.length ? onlyB.slice(0, 3).join("、") : "无明显独有特征"}`
    );
    covered.add(part.slug === "autumn" ? "leaf" : part.slug);
  });

  // 2. 常绿 / 落叶等生活型不同
  if (a.habit && b.habit && a.habit !== b.habit) {
    points.push(`看季节：${a.nameCn}是${a.habit}，${b.nameCn}是${b.habit}`);
  }

  // 3. 图鉴描述中不同的部位
  FIELD_POINTS.forEach(({ key, label }) => {
    const partSlug = key === "fruit" ? "fruit" : String(key);
    if (covered.has(partSlug)) return;
    const va = String(a[key] ?? "").trim();
    const vb = String(b[key] ?? "").trim();
    if (!va || !vb || va === vb) return;
    points.push(`${label}：${a.nameCn}${shorten(va)}；${b.nameCn}${shorten(vb)}`);
  });

  // 4. 不同属时补充分类差异
  if (a.genusSlug !== b.genusSlug) {
    points.push(
      a.familySlug === b.familySlug
        ? `看分类：同属${a.family}，但${a.nameCn}是${a.genus}，${b.nameCn}是${b.genus}`
        : `看分类：${a.nameCn}属于${a.family}，${b.nameCn}属于${b.family}`
    );
  }

  return { keyPoints: points.slice(0, 5), parts: [...covered].map((s) => getPart(s)?.nameCn ?? s) };
}
