import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlants } from "@/lib/loadPlants";
import AtlasLayout from "@/app/components/AtlasLayout";

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[|、,，]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plants = loadPlants();
  const list = plants.filter((p) => p.genusSlug === slug);

  if (list.length === 0) {
    return {
      title: "植物属信息｜Plant Atlas World",
    };
  }

  const first = list[0];

  return {
    title: `${first.genus}植物有哪些｜常见${first.genus}植物、特征与识别`,
    description: `${first.genus}属于${first.family}。本页整理常见${first.genus}植物，包括${list
      .slice(0, 6)
      .map((p) => p.nameCn)
      .join("、")}等，并介绍其分类位置、识别特征和相似植物。`,
    alternates: {
      canonical: `https://plantatlasworld.com/genus/${slug}`,
    },
  };
}

export default async function GenusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants();

  const list = plants.filter((p) => p.genusSlug === slug);
  if (list.length === 0) notFound();

  const first = list[0];

  const habits = unique(list.map((p) => p.habit || ""));
  const allTags = unique(list.flatMap((p) => toList(p.tags))).slice(0, 24);
  const usages = unique(list.flatMap((p) => toList(p.usage))).slice(0, 16);

  const similarNames = unique(list.flatMap((p) => toList(p.similar)));
  const similarPlants = plants.filter((p) => similarNames.includes(p.nameCn));

  return (
    <AtlasLayout>
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span>›</span>
        <span>{first.division}</span>
        <span>›</span>
        <span>{first.className}</span>
        <span>›</span>
        <span>{first.order}</span>
        <span>›</span>
        <Link href={`/family/${first.familySlug}`}>{first.family}</Link>
        <span>›</span>
        <span>{first.genus}</span>
      </nav>

      <h1>{first.genus}植物</h1>

      <p>
        {first.genus}属于{first.family}，在分类位置上位于{first.order}、
        {first.className}、{first.division}之下。
        本页面整理本站已收录的常见{first.genus}植物，
        包括{list.slice(0, 8).map((p) => p.nameCn).join("、")}等。
      </p>

      <h2>{first.genus}的分类位置</h2>
      <div className="lineage-horizontal">
        <span className="lineage-node">{first.kingdom}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.division}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.className}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.order}</span>
        <span className="lineage-arrow">›</span>

        <Link href={`/family/${first.familySlug}`} className="lineage-node link">
          {first.family}
        </Link>

        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.genus}</span>
      </div>

      <h2>本属收录植物</h2>
      <p>
        当前共收录 {list.length} 种{first.genus}植物。
        同属植物通常亲缘关系较近，在叶片、花、果实或整体形态上可能存在相似性。
      </p>

      <ul>
        {list.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta"> · {plant.nameLatin}</span>
          </li>
        ))}
      </ul>

      {habits.length > 0 && (
        <>
          <h2>常见生活型</h2>
          <p>
            {first.genus}植物在本站数据中的生活型包括：{habits.join("、")}。
            生活型能帮助判断植物的整体形态和观察方式。
          </p>
        </>
      )}

      {allTags.length > 0 && (
        <>
          <h2>主要识别特征</h2>
          <p>
            {first.genus}植物常见标签包括：{allTags.join("、")}。
            这些特征可以辅助判断叶片形状、花果特征、季节变化和生长环境。
          </p>
        </>
      )}

      {usages.length > 0 && (
        <>
          <h2>常见用途</h2>
          <p>
            本属植物常见用途包括：{usages.join("、")}。
            在园林、行道树、庭院树、绿篱或观赏植物中较为常见。
          </p>
        </>
      )}

      <h2>如何识别{first.genus}植物</h2>
      <p>
        识别{first.genus}植物时，可以先确认其是否属于{first.family}，
        再比较同属植物之间的叶片、花、果实和树皮差异。
        如果多个植物外观接近，优先观察叶片形态、果实结构和季节变化。
      </p>

      {similarPlants.length > 0 && (
        <>
          <h2>容易混淆的植物</h2>
          <p>
            {first.genus}植物可能与以下植物在外观或生长环境上相似：
          </p>

          <ul>
            {similarPlants.slice(0, 12).map((plant) => (
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
        </>
      )}
    </AtlasLayout>
  );
}