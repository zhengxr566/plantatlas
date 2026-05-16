import type { Metadata } from "next";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";

export const metadata: Metadata = {
  title: "植物识别大全｜按叶片、花果、树皮和环境识别植物",
  description:
    "通过叶片形状、花、果实、树皮、季节变化和生长环境识别常见植物，适合判断公园、街道、校园和庭院中的常见木本植物。",
  alternates: {
    canonical: "https://plantatlasworld.com/identify",
  },
  openGraph: {
    title: "植物识别大全｜Plant Atlas World",
    description:
      "按叶片、花果、树皮、季节和环境查找常见植物。",
    url: "https://plantatlasworld.com/identify",
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
      .split(/[|、,，;；]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export default function IdentifyHubPage() {
  const plants = loadPlants();

  const tagCounts = new Map<string, number>();

  plants.forEach((plant) => {
    toList(plant.tags).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const popularTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 32);

  const leafTags = popularTags.filter(([tag]) =>
    ["叶", "针", "掌", "羽", "扇", "鳞"].some((word) => tag.includes(word))
  );

  const seasonTags = popularTags.filter(([tag]) =>
    ["春", "夏", "秋", "冬", "花", "果"].some((word) => tag.includes(word))
  );

  const environmentTags = popularTags.filter(([tag]) =>
    ["行道", "城市", "湿", "水边", "庭院", "山地", "绿化"].some((word) =>
      tag.includes(word)
    )
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "植物识别大全",
    description: "按叶片、花果、树皮、季节和环境识别植物。",
    url: "https://plantatlasworld.com/identify",
  };

  return (
    <AtlasLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span>›</span>
        <span>植物识别</span>
      </nav>

      <h1>植物识别大全</h1>

      <p>
        本页面用于按外观特征查找植物。你可以根据叶片形状、花和果实、
        树皮纹理、季节变化、生长环境和常见用途，初步判断公园、街道、
        校园或庭院中看到的植物。
      </p>

      <p>
        Plant Atlas World 当前收录 {plants.length} 种常见植物，并通过识别标签、
        分类谱系和相似植物对比，帮助用户从多个角度判断植物。
      </p>

      <h2>常见植物识别入口</h2>
      <ul>
        {identifyPages.map((page) => (
          <li key={page.slug}>
            <Link href={`/identify/${page.slug}`} className="link">
              {page.title}
            </Link>
            <span className="meta"> · {page.description}</span>
          </li>
        ))}
      </ul>

      <h2>按叶片识别植物</h2>
      <p>
        叶片是最容易观察的识别特征。可以重点看叶形、叶缘、叶脉、
        叶片排列方式以及秋季颜色变化。
      </p>

      <ul>
        {leafTags.length > 0 ? (
          leafTags.map(([tag, count]) => (
            <li key={tag}>
              {tag}
              <span className="meta"> · {count} 种植物</span>
            </li>
          ))
        ) : (
          <li className="meta">暂无叶片标签数据。</li>
        )}
      </ul>

      <h2>按季节特征识别植物</h2>
      <p>
        春季适合观察花，夏季适合观察叶片和树形，秋季适合观察叶色和果实，
        冬季则可以通过树皮、枝条和常绿特征辅助判断。
      </p>

      <ul>
        {seasonTags.length > 0 ? (
          seasonTags.map(([tag, count]) => (
            <li key={tag}>
              {tag}
              <span className="meta"> · {count} 种植物</span>
            </li>
          ))
        ) : (
          <li className="meta">暂无季节标签数据。</li>
        )}
      </ul>

      <h2>按生长环境识别植物</h2>
      <p>
        生长环境可以作为辅助线索。例如行道树常见于道路两侧，
        湿地植物常见于水边，庭院树和观赏树则更多出现在公园和居住区。
      </p>

      <ul>
        {environmentTags.length > 0 ? (
          environmentTags.map(([tag, count]) => (
            <li key={tag}>
              {tag}
              <span className="meta"> · {count} 种植物</span>
            </li>
          ))
        ) : (
          <li className="meta">暂无环境标签数据。</li>
        )}
      </ul>

      <h2>识别植物时应该看什么</h2>
      <ol>
        <li>先看叶片：叶形、叶缘、叶脉和叶片排列最常用。</li>
        <li>再看花果：花色、花序、果实形态和成熟季节很关键。</li>
        <li>观察树皮：冬季或不开花结果时，树皮纹理很有价值。</li>
        <li>结合环境：道路、公园、湿地、山地和庭院会提供辅助信息。</li>
        <li>最后看分类：同科、同属植物往往更容易相似。</li>
      </ol>

      <h2>常见植物</h2>
      <ul>
        {plants.slice(0, 40).map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta">
              {" "}
              · {plant.nameLatin} · {plant.family} · {plant.genus}
            </span>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}