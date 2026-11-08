import AtlasShell from "./AtlasShell";
import LineageSidebar, { type SidebarTree } from "./LineageSidebar";
import type { SearchEntry } from "./SiteSearch";
import { identifyPages } from "@/data/identify";
import { generateComparePairs } from "@/lib/generateComparePairs";
import { loadPhotos } from "@/lib/loadPhotos";
import { loadPlants } from "@/lib/loadPlants";

// 侧栏数据在服务端从 plants.csv 生成，和正文使用同一份数据
function buildSidebarData() {
  const plants = loadPlants();
  const photoCount = new Map<string, number>();
  loadPhotos().forEach((p) =>
    photoCount.set(p.plant, (photoCount.get(p.plant) ?? 0) + 1)
  );

  // 有实拍图的植物优先展示
  const featuredPlants = [...plants]
    .sort((a, b) => (photoCount.get(b.slug) ?? 0) - (photoCount.get(a.slug) ?? 0))
    .slice(0, 6)
    .map((p) => ({ slug: p.slug, nameCn: p.nameCn, family: p.family, genus: p.genus }));

  // 可收录的对比排在前面（generateComparePairs 已按此排序）
  const featuredCompares = generateComparePairs()
    .slice(0, 6)
    .map((p) => ({ slug: p.slug, title: p.title }));

  const tree: SidebarTree = {};
  plants.forEach((plant) => {
    const division = plant.division || "未分类类群";
    const className = plant.className || "未分类纲";
    const order = plant.order || "未分类目";
    const family = plant.family || "未分类科";
    const genus = plant.genus || "未分类属";

    tree[division] ??= {};
    tree[division][className] ??= {};
    tree[division][className][order] ??= {};
    tree[division][className][order][family] ??= {};
    tree[division][className][order][family][genus] ??= [];
    tree[division][className][order][family][genus].push({
      slug: plant.slug,
      nameCn: plant.nameCn,
      nameLatin: plant.nameLatin,
    });
  });

  return {
    featuredPlants,
    featuredCompares,
    identifyLinks: identifyPages.slice(0, 6).map((p) => ({ slug: p.slug, title: p.title })),
    tree,
  };
}

// 顶部搜索的索引：植物（中文名 + 学名 + 科）、属、科
function buildSearchEntries(): SearchEntry[] {
  const plants = loadPlants();
  const entries: SearchEntry[] = plants.map((p) => ({
    name: p.nameCn,
    sub: `${p.nameLatin} · ${p.family}`,
    href: `/plant/${p.slug}`,
    kind: "plant",
  }));
  const seen = new Set<string>();
  plants.forEach((p) => {
    if (p.genusSlug && !seen.has(`g:${p.genusSlug}`)) {
      seen.add(`g:${p.genusSlug}`);
      entries.push({ name: p.genus, sub: p.family, href: `/genus/${p.genusSlug}`, kind: "genus" });
    }
    if (p.familySlug && !seen.has(`f:${p.familySlug}`)) {
      seen.add(`f:${p.familySlug}`);
      entries.push({ name: p.family, sub: p.order, href: `/family/${p.familySlug}`, kind: "family" });
    }
  });
  return entries;
}

export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return (
    <AtlasShell
      sidebar={<LineageSidebar {...buildSidebarData()} />}
      searchEntries={buildSearchEntries()}
    >
      {children}
    </AtlasShell>
  );
}
