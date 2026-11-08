import type { Metadata } from "next";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import LineageTree from "@/app/components/LineageTree";
import { buildLineageTree, type LineageNode } from "@/lib/lineage";
import { loadPhotos } from "@/lib/loadPhotos";
import { loadPlants } from "@/lib/loadPlants";

export const metadata: Metadata = {
  title: "植物谱系地图｜常见植物的纲、目、科、属分类关系一览",
  description:
    "用可缩放的谱系树浏览常见植物的分类关系：从裸子植物、被子植物到纲、目、科、属和种，放大即可看到每种植物的简介名片和实拍图。",
  alternates: { canonical: "https://plantatlasworld.com/lineage" },
};

// 地图下方的文字目录：方便搜索引擎抓取所有分类页面
function Directory({ node }: { node: LineageNode }) {
  if (!node.children) {
    return (
      <Link href={node.href!} className="link">
        {node.name}
      </Link>
    );
  }
  const label = node.href ? (
    <Link href={node.href} className="link">
      {node.name}
    </Link>
  ) : (
    node.name
  );
  // 属下面直接列出种
  if (node.level === "genus") {
    return (
      <>
        {label}：
        {node.children.map((c, i) => (
          <span key={c.href}>
            {i > 0 && "、"}
            <Directory node={c} />
          </span>
        ))}
      </>
    );
  }
  return (
    <details open={node.level === "division" || node.level === "class"}>
      <summary>
        {label}
        <span className="meta">（{node.children.length}）</span>
      </summary>
      <ul>
        {node.children.map((c) => (
          <li key={`${c.level}-${c.name}`}>
            <Directory node={c} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function LineagePage() {
  const plants = loadPlants();
  const tree = buildLineageTree(plants, loadPhotos());

  return (
    <AtlasLayout>
      <Breadcrumb items={[{ name: "首页", href: "/" }, { name: "谱系地图" }]} />

      <h1>植物谱系地图</h1>
      <p>
        本站收录的 {plants.length} 种植物按“类群 › 纲 › 目 › 科 › 属 › 种”的分类关系排成一棵谱系树。
        从上往下，层级越低，亲缘关系越近；同一个属的植物排在一起，往往也是最容易混淆的组合。
        点击分类会展开下一级并自动缩放到合适的画面，每种植物显示为一张简介名片，有实拍图的会直接显示照片。
      </p>

      <LineageTree data={tree} />

      <h2>分类目录</h2>
      <div className="lineage-directory">
        {tree.children!.map((division) => (
          <Directory key={division.name} node={division} />
        ))}
      </div>
    </AtlasLayout>
  );
}
