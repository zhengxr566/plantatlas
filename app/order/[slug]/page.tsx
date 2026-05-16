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

  const matched = plants.find((p) => p.orderSlug === slug);

  if (!matched) {
    return {
      title: "植物目｜Plant Atlas World",
    };
  }

  return {
    title: `${matched.order}植物有哪些｜分类、特征与常见植物`,
    description: `${matched.order}植物的分类位置、包含科属和常见植物。`,
    alternates: {
      canonical: `https://plantatlasworld.com/order/${slug}`,
    },
  };
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants();

  const list = plants.filter((p) => p.orderSlug === slug);

  if (list.length === 0) notFound();

  const first = list[0];

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

        <Link href={`/class/${first.classSlug}`} className="link">
          {first.className}
        </Link>

        <span>›</span>
        <span>{first.order}</span>
      </nav>

      <h1>{first.order}植物</h1>

      <p>
        {first.order}属于{first.className}中的一个目。
        当前本站收录 {list.length} 种{first.order}植物，
        包括{list.slice(0, 8).map((p) => p.nameCn).join("、")}等。
      </p>

      <h2>分类位置</h2>

      <div className="lineage-horizontal">
        <span className="lineage-node">{first.kingdom}</span>
        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{first.division}</span>
        <span className="lineage-arrow">›</span>

        <Link
          href={`/class/${first.classSlug}`}
          className="lineage-node link"
        >
          {first.className}
        </Link>

        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{first.order}</span>
      </div>

      <h2>包含哪些科</h2>

      <ul>
        {families.map((family) => (
          <li key={family.slug}>
            <Link href={`/family/${family.slug}`} className="link">
              {family.name}
            </Link>
          </li>
        ))}
      </ul>

      <h2>常见植物</h2>

      <ul>
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