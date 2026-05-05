import Link from "next/link";
import { plants } from "@/data/plants";
import { comparePairs } from "@/data/comparePairs";
import AtlasLayout from "@/app/components/AtlasLayout";
import { identifyPages } from "@/data/identify";

export default function Home() {
  return (
    <AtlasLayout>
      <h1>植物谱系图谱</h1>
      <p className="meta">
        Plant Atlas World 从常见木本植物开始，按照门、纲、目、科、属、种组织植物信息。
      </p>

      <h2>常见木本植物</h2>
      <ul className="data-list">
        {plants.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta"> · {plant.family} · {plant.genus}</span>
          </li>
        ))}
      </ul>

      <h2>常见植物对比</h2>
      <ul className="data-list">
        {comparePairs.map((item) => (
          <li key={item.slug}>
            <Link href={`/compare/${item.slug}`} className="link">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <h2 style={{ marginTop: 30 }}>植物识别</h2>

      <ul>
        {identifyPages.map((p) => (
          <li key={p.slug}>
            <Link href={`/identify/${p.slug}`} className="link">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}