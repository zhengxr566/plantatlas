import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import LineageTree from "@/app/components/LineageTree";
import TaxonPath from "@/app/components/TaxonPath";
import { ORDER_CLADE, cladeAncestry, clades, getClade, inClade, type Clade } from "@/data/clades";
import { buildLineageTree, findLineageNode } from "@/lib/lineage";
import { loadPhotos } from "@/lib/loadPhotos";
import { loadPlants } from "@/lib/loadPlants";
import { taxonomyRobots } from "@/lib/taxonomy";

const SITE = "https://plantatlasworld.com";

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  return Array.from(new Map(items.map((item) => [key(item), item])).values());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const clade = getClade(slug);
  if (!clade) return { title: "植物演化支｜Plant Atlas World" };

  const list = loadPlants().filter((p) => inClade(p, slug));
  return {
    title: `${clade.name}（${clade.latin}）有哪些植物｜APG IV 分类与常见植物`,
    description: `${clade.name}是现代被子植物分类（APG IV）中的${clade.grade ? "一组早期分支" : "一个演化支"}。${clade.summary}`,
    alternates: { canonical: `${SITE}/clade/${slug}` },
    ...taxonomyRobots(list.length),
  };
}

export default async function CladePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clade = getClade(slug);
  if (!clade) notFound();

  const plants = loadPlants();
  const list = plants.filter((p) => inClade(p, slug));
  if (list.length === 0) notFound();

  const first = list[0];
  // 谱系中显示的演化支（不显示的中间层，如“核心真双子叶植物”，在路径中跳过）
  const visible = new Set(plants.flatMap((p) => p.groups.map((g) => g.slug)));
  const crumbs = [
    { name: "首页", href: "/" },
    { name: first.division },
    ...cladeAncestry(slug)
      .slice(0, -1)
      .filter((c) => visible.has(c.slug))
      .map((c) => ({ name: c.name, href: `/clade/${c.slug}` })),
    { name: clade.name },
  ];

  // 直接下级：显示的演化支中，跳过中间层后上一级是本演化支的；以及直接属于本演化支的目
  const shown = new Set([...visible, slug]);
  const shownParent = (c: Clade) => {
    let parent = c.parent;
    while (parent && !shown.has(parent)) parent = getClade(parent)?.parent;
    return parent;
  };
  const childClades = clades
    .filter((c) => visible.has(c.slug) && shownParent(c) === slug)
    .map((c) => ({ clade: c, count: plants.filter((p) => inClade(p, c.slug)).length }))
    .filter((c) => c.count > 0);
  const directOrders = uniqueBy(
    list.filter((p) => p.orderSlug && ORDER_CLADE[p.orderSlug] === slug),
    (p) => p.orderSlug ?? ""
  ).map((p) => ({
    name: p.order,
    slug: p.orderSlug!,
    count: list.filter((q) => q.orderSlug === p.orderSlug).length,
  }));
  // 目按 APG 的排列顺序
  const orderRank = Object.keys(ORDER_CLADE);
  directOrders.sort((a, b) => orderRank.indexOf(a.slug) - orderRank.indexOf(b.slug));
  const orders = uniqueBy(list, (p) => p.orderSlug ?? "").filter((p) => p.orderSlug);
  const families = uniqueBy(list, (p) => p.familySlug).filter((p) => p.familySlug);

  const lineageNode = findLineageNode(buildLineageTree(plants, loadPhotos()), `/clade/${slug}`);

  return (
    <AtlasLayout>
      <Breadcrumb items={crumbs} />

      <h1>
        {clade.name}
        <span className="meta"> {clade.latin}</span>
      </h1>

      <p>{clade.summary}</p>
      <p>
        当前本站收录 {list.length} 种{clade.name}，分属 {orders.length} 个目、{families.length} 个科，
        包括{list.slice(0, 8).map((p) => p.nameCn).join("、")}等。
      </p>

      <h2>分类位置</h2>
      <TaxonPath steps={[{ name: first.kingdom || "植物界" }, ...crumbs.slice(1)]} />
      <p className="meta">
        按现代被子植物分类系统 APG IV（2016）。APG 系统根据 DNA 研究划分演化支，不再使用传统的“纲”“亚纲”。
        {clade.grade && "本类群是依次分出的几个早期分支，并不构成一个单系类群（称为“级”）。"}
      </p>

      {lineageNode && <LineageTree data={lineageNode} compact={list.length <= 15} />}

      {(childClades.length > 0 || directOrders.length > 0) && (
        <>
          <h2>下级分支</h2>
          <ul className="card-grid compact">
            {directOrders.map((o) => (
              <li key={o.slug}>
                <Link href={`/order/${o.slug}`} className="link">
                  {o.name}
                </Link>
                <span className="meta"> · {o.count} 种</span>
              </li>
            ))}
            {childClades.map(({ clade: c, count }) => (
              <li key={c.slug}>
                <Link href={`/clade/${c.slug}`} className="link">
                  {c.name}
                </Link>
                <span className="meta"> · {count} 种</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>包含哪些科</h2>
      <ul className="card-grid compact scroll-box">
        {families.map((p) => (
          <li key={p.familySlug}>
            <Link href={`/family/${p.familySlug}`} className="link">
              {p.family}
            </Link>
            <span className="meta"> · {p.order}</span>
          </li>
        ))}
      </ul>

      <h2>常见植物</h2>
      <ul className="card-grid scroll-box">
        {list.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta">
              {" "}
              · {plant.family} · {plant.genus}
            </span>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}
