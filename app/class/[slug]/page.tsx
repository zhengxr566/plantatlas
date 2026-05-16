import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";
import { loadPlants } from "@/lib/loadPlants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plants = loadPlants();

  const matched = plants.find((p) => p.classSlug === slug);

  if (!matched) {
    return {
      title: "植物纲｜Plant Atlas World",
    };
  }

  return {
    title: `${matched.className}植物有哪些｜分类、特征与常见植物`,
    description: `${matched.className}植物的分类位置、常见特征、包含目科属以及代表植物。`,
    alternates: {
      canonical: `https://plantatlasworld.com/class/${slug}`,
    },
  };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants();

  const list = plants.filter((p) => p.classSlug === slug);

  if (list.length === 0) notFound();

  const first = list[0];

  const orders = Array.from(
    new Map(
      list
        .filter((p) => p.order && p.orderSlug)
        .map((p) => [p.orderSlug, { name: p.order, slug: p.orderSlug }])
    ).values()
  );

  const families = Array.from(
    new Map(
      list
        .filter((p) => p.family && p.familySlug)
        .map((p) => [p.familySlug, { name: p.family, slug: p.familySlug }])
    ).values()
  );

  return (
    <AtlasLayout>
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span>›</span>
        <span>{first.division}</span>
        <span>›</span>
        <span>{first.className}</span>
      </nav>

      <h1>{first.className}植物</h1>

      <p>
        {first.className}属于{first.division}中的一个纲。
        当前本站收录 {list.length} 种{first.className}植物，
        包括{list.slice(0, 8).map((p) => p.nameCn).join("、")}等。
      </p>

      <h2>分类位置</h2>

      <div className="lineage-horizontal">
        <span className="lineage-node">{first.kingdom}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.division}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.className}</span>
      </div>

      <h2>包含哪些目</h2>

      <ul className="card-grid compact scroll-box">
        {orders.map((order) => (
          <li key={order.slug}>
            <Link href={`/order/${order.slug}`} className="link">
              {order.name}
            </Link>
          </li>
        ))}
      </ul>

      <h2>包含哪些科</h2>

      <ul className="card-grid compact scroll-box">
        {families.map((family) => (
          <li key={family.slug}>
            <Link href={`/family/${family.slug}`} className="link">
              {family.name}
            </Link>
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
              {" "}· {plant.family} · {plant.genus}
            </span>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}