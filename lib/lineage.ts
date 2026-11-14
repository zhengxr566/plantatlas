// 谱系地图的数据：植物界 › 类群 › 演化支（被子植物，可多层）或纲（裸子植物）› 目 › 科 › 属 › 种
import type { Plant } from "@/lib/loadPlants";
import type { PlantPhoto } from "@/lib/loadPhotos";
import { ORDER_CLADE, clades } from "@/data/clades";

export type LineageLevel =
  | "root"
  | "division"
  | "class"
  | "clade"
  | "order"
  | "family"
  | "genus"
  | "plant";

// 目以上的分支层级：谱系地图中从上往下展开，到目开始改为列表
export const BRANCH_LEVELS: LineageLevel[] = ["root", "division", "class", "clade"];

export type LineageNode = {
  name: string;
  level: LineageLevel;
  href?: string;
  // 学名（演化支、纲、目、科、属），谱系图中以小字显示
  latin?: string;
  // 种：有实拍图时的缩略图（优先树形，其次叶片）
  photo?: string;
  // 该节点下有实拍图的种数（种：自己的实拍图张数）
  photoCount?: number;
  // 种的简介名片
  card?: {
    latin: string;
    aliases: string[];
    habit: string;
    family: string;
    genus: string;
    summary: string;
    // 简介框中的识别要点：叶、花、果（各取第一句）
    points: { label: string; text: string }[];
    tags: string[];
  };
  children?: LineageNode[];
};

const DIVISION_LATIN: Record<string, string> = { 被子植物: "Angiosperms", 裸子植物: "Gymnosperms" };

// slug（如 rosales）→ 学名（Rosales）
function latinOf(slug?: string) {
  return slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ") : undefined;
}

type PathStep = { name: string; level: LineageLevel; href?: string; latin?: string };

// 从类群到属的路径（演化支的层数因植物而异）
function taxonPath(plant: Plant): PathStep[] {
  const link = (path: string, slug?: string) => (slug ? `/${path}/${slug}` : undefined);
  return [
    { name: plant.division || "未分类", level: "division", latin: DIVISION_LATIN[plant.division] },
    ...plant.groups.map((g) => ({
      name: g.name,
      level: g.level,
      href: g.href,
      latin: g.level === "clade" ? clades.find((c) => c.slug === g.slug)?.latin : latinOf(g.slug),
    })),
    { name: plant.order || "未分类", level: "order", href: link("order", plant.orderSlug), latin: latinOf(plant.orderSlug) },
    { name: plant.family || "未分类", level: "family", href: link("family", plant.familySlug), latin: latinOf(plant.familySlug) },
    { name: plant.genus || "未分类", level: "genus", href: link("genus", plant.genusSlug), latin: latinOf(plant.genusSlug) },
  ];
}

// 分类名称（纲/目/科/属等）不算识别特征
function featureTags(plant: Plant) {
  const taxa = [plant.division, plant.className, plant.order, plant.family, plant.genus];
  return (plant.tags ?? []).filter((t) => !taxa.includes(t) && !/[纲目科属]$/.test(t));
}

// 名片上的一句话：取叶片描述的第一句
function summarize(plant: Plant) {
  const first = (plant.leaf || plant.flower || "").split(/[，,；;。]/)[0].trim();
  return first.length > 18 ? `${first.slice(0, 18)}…` : first;
}

// 简介框：叶、花、果描述的第一句（太长时截断）
function keyPoints(plant: Plant) {
  const first = (text?: string) => {
    const s = (text || "").split(/[；;。]/)[0].trim();
    return s.length > 30 ? `${s.slice(0, 30)}…` : s;
  };
  return [
    { label: "叶", text: first(plant.leaf) },
    { label: "花", text: first(plant.flower) },
    { label: "果", text: first(plant.fruit) },
  ].filter((p) => p.text);
}

function pickPhoto(photos: PlantPhoto[]) {
  return (
    photos.find((p) => p.part === "habit") ??
    photos.find((p) => p.part === "leaf") ??
    photos[0]
  )?.src;
}

export function buildLineageTree(plants: Plant[], photos: PlantPhoto[]): LineageNode {
  const root: LineageNode = { name: "植物界", level: "root", children: [] };

  // 越少见的特征越能代表这种植物，名片上优先显示
  const df = new Map<string, number>();
  plants.forEach((p) => featureTags(p).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));

  plants.forEach((plant) => {
    let parent = root;
    for (const { name, level, href, latin } of taxonPath(plant)) {
      let child = parent.children!.find((c) => c.name === name && c.level === level);
      if (!child) {
        child = { name, level, href, latin, children: [] };
        parent.children!.push(child);
      }
      parent = child;
    }
    const plantPhotos = photos.filter((p) => p.plant === plant.slug);
    parent.children!.push({
      name: plant.nameCn,
      level: "plant",
      href: `/plant/${plant.slug}`,
      photo: pickPhoto(plantPhotos),
      photoCount: plantPhotos.length,
      card: {
        latin: plant.nameLatin,
        aliases: plant.aliases,
        habit: plant.habit ?? "",
        family: plant.family,
        genus: plant.genus,
        summary: summarize(plant),
        points: keyPoints(plant),
        tags: featureTags(plant)
          .sort((a, b) => (df.get(a) ?? 0) - (df.get(b) ?? 0))
          .slice(0, 3),
      },
    });
  });

  // 演化支和目按 APG 的分化顺序排列：同一分支下先列直接所属的目，再列下一级演化支
  const ORDER_INDEX = Object.keys(ORDER_CLADE);
  const rank = (node: LineageNode) => {
    const slug = node.href?.split("/").pop() ?? "";
    if (node.level === "order") return ORDER_INDEX.indexOf(slug) >>> 0;
    if (node.level === "clade") return 10000 + clades.findIndex((c) => c.slug === slug);
    return 20000;
  };
  const sortBranches = (node: LineageNode) => {
    if (!node.children || !BRANCH_LEVELS.includes(node.level)) return;
    node.children.sort((a, b) => rank(a) - rank(b));
    node.children.forEach(sortBranches);
  };
  sortBranches(root);

  // 统计每个节点下有实拍图的种数
  const count = (node: LineageNode): number => {
    if (!node.children) return node.photo ? 1 : 0;
    // 非叶节点：photoCount 表示其下有实拍图的种数
    node.photoCount = node.children.reduce((sum, c) => sum + count(c), 0);
    return node.photoCount;
  };
  count(root);
  return root;
}

// 取某个科或属的子树（用于科、属页面的局部地图）
export function findLineageNode(root: LineageNode, href: string): LineageNode | undefined {
  if (root.href === href) return root;
  for (const child of root.children ?? []) {
    const found = findLineageNode(child, href);
    if (found) return found;
  }
  return undefined;
}
