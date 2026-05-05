import { plants } from "@/data/plants";

export function generateIdentifyPages() {
  const map = new Map<
    string,
    {
      slug: string;
      title: string;
      description: string;
      match: (p: any) => boolean;
    }
  >();

  // ✅ 1. tags 自动生成
  plants.forEach((p) => {
    (p.tags || []).forEach((tag: string) => {
      const slug = `tag-${tag}`;

      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          title: `${tag}的树有哪些`,
          description: `具有“${tag}”特征的常见树种。`,
          match: (plant) => plant.tags?.includes(tag),
        });
      }
    });
  });

  // ✅ 2. 叶子
  plants.forEach((p) => {
    if (p.leaf?.includes("扇形")) {
      map.set("fan-shaped-leaf", {
        slug: "fan-shaped-leaf",
        title: "叶子像扇子的树有哪些",
        description: "叶片呈扇形的树种通常较为特殊。",
        match: (plant) => plant.leaf?.includes("扇形"),
      });
    }
  });

  // ✅ 3. 花
  plants.forEach((p) => {
    if (p.flower?.includes("白")) {
      map.set("white-flowers", {
        slug: "white-flowers",
        title: "开白花的树有哪些",
        description: "开白花的树在园林中非常常见。",
        match: (plant) => plant.flower?.includes("白"),
      });
    }
  });

  // ✅ 4. 用途
  plants.forEach((p) => {
    (p.usage || []).forEach((u: string) => {
      const slug = `usage-${u}`;

      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          title: `${u}有哪些`,
          description: `常见的${u}类型植物。`,
          match: (plant) => plant.usage?.includes(u),
        });
      }
    });
  });

  // ✅ 5. 常绿
  map.set("evergreen", {
    slug: "evergreen",
    title: "常见常绿树有哪些",
    description: "常绿树全年保持叶片。",
    match: (p) => p.evergreen === true,
  });

  // ✅ 6. 乔木/灌木
  map.set("trees", {
    slug: "trees",
    title: "常见乔木有哪些",
    description: "乔木是园林中最常见的树形。",
    match: (p) => p.habit === "乔木",
  });

  return Array.from(map.values());
}