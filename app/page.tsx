import Link from "next/link";
import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { generateComparePairs } from "@/lib/generateComparePairs";
import AtlasLayout from "@/app/components/AtlasLayout";

export default function Home() {
  const plants = loadPlants();
  const comparePairs = generateComparePairs();

  return (
    <AtlasLayout>
      <h1>植物谱系图谱</h1>

      <p>
        Plant Atlas World 是一个以植物分类关系为核心的植物识别与谱系图谱网站。
        本站从常见木本植物开始，按照界、门、纲、目、科、属、种组织植物信息，
        并通过识别特征、对比关系和分类位置帮助用户判断植物。
      </p>

      <p>
        如果你只知道植物的外观，可以从“植物识别”开始；如果你想区分两个相似植物，
        可以查看“常见植物对比”；如果你已经知道植物名称，可以进入对应植物页查看科属关系、近缘植物和谱系位置。
      </p>

      <h2>植物识别</h2>
      <ul>
        {identifyPages.slice(0, 12).map((page) => (
          <li key={page.slug}>
            <Link href={`/identify/${page.slug}`} className="link">
              {page.title}
            </Link>
            <span className="meta"> · {page.description}</span>
          </li>
        ))}
      </ul>

      <h2>常见植物对比</h2>
      <ul>
        {comparePairs.slice(0, 15).map((item) => (
          <li key={item.slug}>
            <Link href={`/compare/${item.slug}`} className="link">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>

      <h2>常见木本植物</h2>
      <ul>
        {plants.map((plant) => (
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