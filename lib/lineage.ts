// 谱系地图的数据：植物界 › 类群 › 纲 › 目 › 科 › 属 › 种
import type { Plant } from "@/lib/loadPlants";
import type { PlantPhoto } from "@/lib/loadPhotos";

export type LineageLevel = "root" | "division" | "class" | "order" | "family" | "genus" | "plant";

export type LineageNode = {
  name: string;
  level: LineageLevel;
  href?: string;
  // 种：有实拍图时的缩略图（优先树形，其次叶片）
  photo?: string;
  // 该节点下有实拍图的种数（种：自己的实拍图张数）
  photoCount?: number;
  // 种的简介名片
  card?: {
    latin: string;
    habit: string;
    family: string;
    summary: string;
    tags: string[];
  };
  children?: LineageNode[];
};

const LEVELS: { level: LineageLevel; name: keyof Plant; slug?: keyof Plant; path?: string }[] = [
  { level: "division", name: "division" },
  { level: "class", name: "className", slug: "classSlug", path: "class" },
  { level: "order", name: "order", slug: "orderSlug", path: "order" },
  { level: "family", name: "family", slug: "familySlug", path: "family" },
  { level: "genus", name: "genus", slug: "genusSlug", path: "genus" },
];

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
    for (const { level, name, slug, path } of LEVELS) {
      const label = String(plant[name] || "未分类");
      let child = parent.children!.find((c) => c.name === label && c.level === level);
      if (!child) {
        const slugValue = slug ? String(plant[slug] || "") : "";
        child = {
          name: label,
          level,
          href: path && slugValue ? `/${path}/${slugValue}` : undefined,
          children: [],
        };
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
        habit: plant.habit ?? "",
        family: plant.family,
        summary: summarize(plant),
        tags: featureTags(plant)
          .sort((a, b) => (df.get(a) ?? 0) - (df.get(b) ?? 0))
          .slice(0, 3),
      },
    });
  });

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
