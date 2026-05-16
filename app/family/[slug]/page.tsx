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
  const list = plants.filter((p) => p.familySlug === slug);

  if (list.length === 0) {
    return {
      title: "植物科属信息｜Plant Atlas World",
    };
  }

  const first = list[0];

  return {
    title: `${first.family}植物有哪些｜常见${first.family}植物、特征与分类`,
    description: `${first.family}是植物分类中的重要科。本页整理常见${first.family}植物，包括${list
      .slice(0, 6)
      .map((p) => p.nameCn)
      .join("、")}等，并介绍其科属关系、识别特征和常见用途。`,
    alternates: {
      canonical: `https://plantatlasworld.com/family/${slug}`,
    },
  };
}

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants();

  const list = plants.filter((p) => p.familySlug === slug);
  if (list.length === 0) notFound();

  const first = list[0];

  const genera = unique(list.map((p) => p.genus));
  const habits = unique(list.map((p) => p.habit || ""));
  const allTags = unique(list.flatMap((p) => toList(p.tags))).slice(0, 24);
  const usages = unique(list.flatMap((p) => toList(p.usage))).slice(0, 16);

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
        <span>{first.family}</span>
      </nav>

      <h1>{first.family}植物</h1>

      <p>
        {first.family}是{first.order}中的一个植物科。
        本页面整理 Plant Atlas World 已收录的常见{first.family}植物，
        包括{list.slice(0, 8).map((p) => p.nameCn).join("、")}等。
        这些植物在形态、用途和生长环境上可能存在差异，
        但通常可以通过科属关系、叶片、花、果实和树皮特征进行归类与识别。
      </p>

      <h2>{first.family}的分类位置</h2>
      <div className="lineage-horizontal">
        <span className="lineage-node">{first.kingdom}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.division}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.className}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.order}</span>
        <span className="lineage-arrow">›</span>
        <span className="lineage-node">{first.family}</span>
      </div>

      <h2>本科收录植物</h2>
      <p>
        当前共收录 {list.length} 种{first.family}植物，
        涉及 {genera.length} 个属。
      </p>

      <ul>
        {list.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta">
              {" "}
              · {plant.nameLatin} · {plant.genus}
            </span>
          </li>
        ))}
      </ul>

      <h2>{first.family}包含哪些属</h2>
      <p>
        本站当前收录的{first.family}植物主要涉及：
        {genera.join("、")}。
        同属植物通常亲缘关系更近，形态特征也更容易接近。
      </p>

      <ul>
        {genera.map((genus) => {
          const plant = list.find((p) => p.genus === genus);
          if (!plant) return null;

          return (
            <li key={genus}>
              <Link href={`/genus/${plant.genusSlug}`} className="link">
                {genus}
              </Link>
            </li>
          );
        })}
      </ul>

      {habits.length > 0 && (
        <>
          <h2>常见生活型</h2>
          <p>
            {first.family}植物在本站数据中常见生活型包括：
            {habits.join("、")}。
            生活型可以帮助判断植物是乔木、灌木、常绿类型还是落叶类型。
          </p>
        </>
      )}

      {allTags.length > 0 && (
        <>
          <h2>常见识别特征</h2>
          <p>
            {first.family}植物常见标签包括：{allTags.join("、")}。
            这些标签可用于判断叶片形态、季节变化、生长环境和园林用途。
          </p>
        </>
      )}

      {usages.length > 0 && (
        <>
          <h2>常见用途</h2>
          <p>
            本科植物常见用途包括：{usages.join("、")}。
            不同植物可能分别用于行道树、庭院树、观赏树、绿篱或湿地绿化等场景。
          </p>
        </>
      )}

      <h2>如何识别{first.family}植物</h2>
      <p>
        识别{first.family}植物时，建议先观察其所属属，再结合叶片、花、果实、
        树皮和生长环境判断。若多个植物属于同一科但不同属，
        可以通过叶形、花序、果实结构和树皮纹理进一步区分。
      </p>
    </AtlasLayout>
  );
}