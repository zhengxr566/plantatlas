import type { Metadata } from "next";
import Link from "next/link";
import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { generateComparePairs } from "@/lib/generateComparePairs";
import AtlasLayout from "@/app/components/AtlasLayout";

export const metadata: Metadata = {
  title: "植物谱系图谱｜植物识别、分类与常见植物对比",
  description:
    "Plant Atlas World 提供常见木本植物识别、植物分类谱系、科属关系和相似植物对比，帮助用户通过叶片、花、果实、树皮和生长习性判断植物。",
  alternates: {
    canonical: "https://plantatlasworld.com",
  },
  openGraph: {
    title: "植物谱系图谱｜植物识别、分类与常见植物对比",
    description:
      "按照界、门、纲、目、科、属、种组织植物信息，提供植物识别、相似植物对比和谱系关系查询。",
    url: "https://plantatlasworld.com",
    siteName: "Plant Atlas World",
    type: "website",
  },
};

export default function Home() {
  const plants = loadPlants();
  const comparePairs = generateComparePairs();

  const featuredPlants = plants.slice(0, 60);
  const featuredIdentifyPages = identifyPages.slice(0, 12);
  const featuredComparePairs = comparePairs.slice(0, 15);

  return (
    <AtlasLayout>
      <h1>植物谱系图谱</h1>

      <p>
        Plant Atlas World 是一个以植物分类关系为核心的植物识别与谱系图谱网站。
        本站从常见木本植物开始，按照界、门、纲、目、科、属、种组织植物信息，
        并通过叶片、花、果实、树皮、生长环境和相似植物对比，帮助用户判断植物。
      </p>

      <p>
        如果你只知道植物的外观，可以从植物识别页面开始；如果你想区分两个相似植物，
        可以查看常见植物对比；如果你已经知道植物名称，可以进入对应植物页查看科属关系、
        近缘植物和谱系位置。
      </p>

      <h2>植物识别</h2>
      <p>
        按照叶形、花色、果实、季节变化和常见生长环境查找植物，
        适合用于初步判断路边、公园、校园和庭院中常见的木本植物。
      </p>

      <ul>
        {featuredIdentifyPages.map((page) => (
          <li key={page.slug}>
            <Link href={`/identify/${page.slug}`} className="link">
              {page.title}
            </Link>
            <span className="meta"> · {page.description}</span>
          </li>
        ))}
      </ul>

      <h2>常见植物对比</h2>
      <p>
        很多植物在不开花或幼树阶段容易被混淆。对比页面会从分类位置、叶片、
        花、果实、树皮和生长习性等角度说明区别，帮助快速识别相似植物。
      </p>

      <ul>
        {featuredComparePairs.map((item) => (
          <li key={item.slug}>
            <Link href={`/compare/${item.slug}`} className="link">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>

      <h2>常见木本植物</h2>
      <p>
        以下收录常见乔木、灌木和园林植物。每个植物页面包含中文名、拉丁学名、
        分类位置、近缘植物、同科植物、同属植物和常见对比关系。
      </p>

      <ul>
        {featuredPlants.map((plant) => (
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

      {plants.length > featuredPlants.length && (
        <p className="meta">
          当前共收录 {plants.length} 种植物，更多植物可通过科属页面、识别页面和对比页面继续浏览。
        </p>
      )}
    </AtlasLayout>
  );
}