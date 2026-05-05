import { plants } from "@/data/plants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import type { Metadata } from "next";
import { comparePairs } from "@/data/comparePairs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-vs-");

  if (parts.length !== 2) {
    return { title: "植物对比" };
  }

  const plant1 = plants.find((p) => p.slug === parts[0]);
  const plant2 = plants.find((p) => p.slug === parts[1]);

  if (!plant1 || !plant2) {
    return { title: "植物对比" };
  }

  return {
    title: `${plant1.nameCn}和${plant2.nameCn}的区别｜分类与特征对比`,
    description: `详细对比${plant1.nameCn}和${plant2.nameCn}在科属、形态特征、生长环境和用途上的差异。`,
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const parts = slug.split("-vs-");

  if (parts.length !== 2) return notFound();

  const plant1 = plants.find((p) => p.slug === parts[0]);
  const plant2 = plants.find((p) => p.slug === parts[1]);

  if (!plant1 || !plant2) return notFound();

  return (
    <AtlasLayout>
      <h1>
        {plant1.nameCn}和{plant2.nameCn}的区别
      </h1>

      <p style={{ marginTop: 16 }}>
        {plant1.nameCn}和{plant2.nameCn}
        {plant1.family === plant2.family
          ? `都属于${plant1.family}，`
          : `分别属于${plant1.family}和${plant2.family}，`}
        但在形态特征、生长习性和用途上存在明显区别。
      </p>

      {/* 对比表 */}
      <h2>对比一览</h2>

      <table border={1} cellPadding={10} style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <td>项目</td>
            <td>{plant1.nameCn}</td>
            <td>{plant2.nameCn}</td>
          </tr>
          <tr>
            <td>科</td>
            <td>{plant1.family}</td>
            <td>{plant2.family}</td>
          </tr>
          <tr>
            <td>属</td>
            <td>{plant1.genus}</td>
            <td>{plant2.genus}</td>
          </tr>
          <tr>
            <td>类型</td>
            <td>{plant1.division}</td>
            <td>{plant2.division}</td>
          </tr>
        </tbody>
      </table>

      {/* 区分方法 */}
      <h2>如何快速区分{plant1.nameCn}和{plant2.nameCn}</h2>

      <ul>
        <li>
          分类：{plant1.family} vs {plant2.family}
        </li>
        <li>
          属：{plant1.genus} vs {plant2.genus}
        </li>
        <li>
          外观：
          {(plant1.description ?? "").slice(0, 20)}… vs{" "}
          {(plant2.description ?? "").slice(0, 20)}…
        </li>
      </ul>

      {/* 详细差异 */}
      <h2>主要区别</h2>

      <h3>1. 分类差异</h3>
      <p>
        {plant1.nameCn}属于{plant1.family}（{plant1.genus}），
        {plant2.nameCn}属于{plant2.family}（{plant2.genus}）。
      </p>

      <h3>2. 外观差异</h3>

      <table border={1} cellPadding={10}>
        <tbody>
          <tr>
            <td>项目</td>
            <td>{plant1.nameCn}</td>
            <td>{plant2.nameCn}</td>
          </tr>
          <tr>
            <td>叶子</td>
            <td>{plant1.leaf ?? "-"}</td>
            <td>{plant2.leaf ?? "-"}</td>
          </tr>
          <tr>
            <td>花</td>
            <td>{plant1.flower ?? "-"}</td>
            <td>{plant2.flower ?? "-"}</td>
          </tr>
          <tr>
            <td>果实</td>
            <td>{plant1.fruit ?? "-"}</td>
            <td>{plant2.fruit ?? "-"}</td>
          </tr>
          <tr>
            <td>树皮</td>
            <td>{plant1.bark ?? "-"}</td>
            <td>{plant2.bark ?? "-"}</td>
          </tr>
        </tbody>
      </table>

      <h3>3. 生长特征</h3>
      <p>{plant1.nameCn}：{plant1.environment ?? "-"}</p>
      <p>{plant2.nameCn}：{plant2.environment ?? "-"}</p>

      <h3>4. 用途差异</h3>
      <p>
        {plant1.nameCn}：{plant1.usage?.join("、") ?? "-"}
      </p>
      <p>
        {plant2.nameCn}：{plant2.usage?.join("、") ?? "-"}
      </p>

      <h2>总结</h2>
      <p>
        总体来看，{plant1.nameCn}和{plant2.nameCn}
        {plant1.family === plant2.family
          ? "同属一个科，但在具体属和形态上存在差异。"
          : "属于不同科，在分类和形态上差异明显。"}
        在实际应用中可以根据分类和外观进行区分。
      </p>

      {/* 内链 */}
      <h2>相关植物</h2>
      <ul>
        <li>
          <Link href={`/plant/${plant1.slug}`} className="link">
            查看 {plant1.nameCn}
          </Link>
        </li>
        <li>
          <Link href={`/plant/${plant2.slug}`} className="link">
            查看 {plant2.nameCn}
          </Link>
        </li>
      </ul>

      <h2>更多相关对比</h2>
      <ul>
        {comparePairs.slice(0, 5).map((item) => (
          <li key={item.slug}>
            <Link href={`/compare/${item.slug}`} className="link">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}