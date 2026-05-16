import type { Metadata } from "next";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import { generateComparePairs } from "@/lib/generateComparePairs";
import { loadPlants } from "@/lib/loadPlants";

export const metadata: Metadata = {
  title: "植物对比大全｜常见植物区别与识别方法",
  description:
    "查看常见植物之间的区别，包括叶片、花、果实、树皮、生长环境和分类关系，帮助快速识别容易混淆的植物。",
  alternates: {
    canonical: "https://plantatlasworld.com/compare",
  },
  openGraph: {
    title: "植物对比大全｜常见植物区别与识别方法",
    description:
      "比较银杏、水杉、松树、鹅掌楸等常见植物的区别，从叶片、树形、果实和分类关系帮助识别植物。",
    url: "https://plantatlasworld.com/compare",
    siteName: "Plant Atlas World",
    type: "website",
  },
};

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

export default function CompareHubPage() {
  const plants = loadPlants();
  const comparePairs = generateComparePairs();

  const compareCount = comparePairs.length;

  const popularPairs = comparePairs.slice(0, 24);

  const autumnPlants = plants.filter((p) =>
    toList(p.tags).some((tag) => tag.includes("秋"))
  );

  const needlePlants = plants.filter((p) =>
    toList(p.tags).includes("针叶树")
  );

  const deciduousPlants = plants.filter((p) =>
    toList(p.tags).includes("落叶乔木")
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "植物对比大全",
    description: "常见植物区别与识别方法",
    url: "https://plantatlasworld.com/compare",
  };

  return (
    <AtlasLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>植物对比大全</h1>

      <p>
        本页面整理常见植物之间的区别与识别方法，
        包括叶片、花、果实、树皮、树形、生长环境和分类关系等方面。
        很多植物在不开花、幼树阶段或秋冬季容易被混淆，
        通过植物对比页面可以更快速判断植物种类。
      </p>

      <p>
        当前共收录 {compareCount} 组常见植物对比关系，
        涵盖银杏、水杉、松树、杉树、柏树以及常见园林树种。
      </p>

      <h2>热门植物对比</h2>

      <ul>
        {popularPairs.map((pair) => (
          <li key={pair.slug}>
            <Link href={`/compare/${pair.slug}`} className="link">
              {pair.title}
            </Link>
          </li>
        ))}
      </ul>

      <h2>针叶树对比</h2>

      <p>
        松树、杉树、柏树等针叶植物在外观上较为接近，
        但叶片排列、球果、树皮和树形存在明显差异。
      </p>

      <ul>
        {needlePlants.slice(0, 12).map((plant) => (
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

      <h2>秋色叶植物对比</h2>

      <p>
        秋季变黄或变红的植物在城市道路、公园和山地中非常常见。
        通过秋叶颜色、叶形和树冠形态，可以区分许多容易混淆的树种。
      </p>

      <ul>
        {autumnPlants.slice(0, 12).map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
          </li>
        ))}
      </ul>

      <h2>落叶乔木对比</h2>

      <p>
        落叶乔木在春夏季适合观察叶片和花果，
        秋冬季则更适合观察树形、枝条和树皮。
      </p>

      <ul>
        {deciduousPlants.slice(0, 12).map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
          </li>
        ))}
      </ul>

      <h2>如何区分相似植物</h2>

      <p>
        识别植物时，建议不要只观察单一特征。
        很多植物在叶片颜色、树形或生长环境上存在相似性，
        但在叶脉、果实、花序、树皮和分类关系上往往差异明显。
      </p>

      <p>
        对于初学者，最推荐优先观察：
      </p>

      <ol>
        <li>叶片形状与排列方式</li>
        <li>是否属于针叶树或阔叶树</li>
        <li>秋季叶色变化</li>
        <li>树皮纹理</li>
        <li>球果、果实或种子</li>
      </ol>

      <h2>植物分类与对比关系</h2>

      <p>
        同属植物通常亲缘关系最近，
        同科植物则往往具有部分共同特征。
        但也有一些植物虽然分类差异较大，
        却因为叶片、树形或生长环境相似而容易被误认。
      </p>

      <p>
        Plant Atlas World 通过植物分类谱系、识别标签和相似植物关系，
        帮助建立更完整的植物知识图谱。
      </p>
    </AtlasLayout>
  );
}