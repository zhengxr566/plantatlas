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
  // 该节点下有实拍图的种数
  photoCount?: number;
  children?: LineageNode[];
};

const LEVELS: { level: LineageLevel; name: keyof Plant; slug?: keyof Plant; path?: string }[] = [
  { level: "division", name: "division" },
  { level: "class", name: "className", slug: "classSlug", path: "class" },
  { level: "order", name: "order", slug: "orderSlug", path: "order" },
  { level: "family", name: "family", slug: "familySlug", path: "family" },
  { level: "genus", name: "genus", slug: "genusSlug", path: "genus" },
];

function pickPhoto(photos: PlantPhoto[]) {
  return (
    photos.find((p) => p.part === "habit") ??
    photos.find((p) => p.part === "leaf") ??
    photos[0]
  )?.src;
}

export function buildLineageTree(plants: Plant[], photos: PlantPhoto[]): LineageNode {
  const root: LineageNode = { name: "植物界", level: "root", children: [] };

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
    parent.children!.push({
      name: plant.nameCn,
      level: "plant",
      href: `/plant/${plant.slug}`,
      photo: pickPhoto(photos.filter((p) => p.plant === plant.slug)),
    });
  });

  // 统计每个节点下有实拍图的种数
  const count = (node: LineageNode): number => {
    if (!node.children) return node.photo ? 1 : 0;
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
