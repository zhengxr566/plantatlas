import { loadPlants } from "@/lib/loadPlants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plants = loadPlants();

  const parts = slug.split("-vs-");
  if (parts.length !== 2) {
    return { title: "植物对比｜Plant Atlas World" };
  }

  const plant1 = plants.find((p) => p.slug === parts[0]);
  const plant2 = plants.find((p) => p.slug === parts[1]);

  if (!plant1 || !plant2) {
    return { title: "植物对比｜Plant Atlas World" };
  }

  return {
    title: `${plant1.nameCn}和${plant2.nameCn}的区别｜分类与识别对比`,
    description: `比较${plant1.nameCn}和${plant2.nameCn}在分类关系、叶片、花、果实、树皮和用途上的区别。`,
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants();

  const parts = slug.split("-vs-");
  if (parts.length !== 2) return notFound();

  const plant1 = plants.find((p) => p.slug === parts[0]);
  const plant2 = plants.find((p) => p.slug === parts[1]);

  if (!plant1 || !plant2) return notFound();

  const sameFamily = plant1.family === plant2.family;
  const sameGenus = plant1.genus === plant2.genus;

  const sharedTags = plant1.tags.filter((tag) => plant2.tags.includes(tag));
  const plant1OnlyTags = plant1.tags.filter((tag) => !plant2.tags.includes(tag));
  const plant2OnlyTags = plant2.tags.filter((tag) => !plant1.tags.includes(tag));

  return (
    <AtlasLayout>
      <h1>{plant1.nameCn}和{plant2.nameCn}的区别</h1>

      <p>
        {plant1.nameCn}和{plant2.nameCn}的区别，不能只看外观。
        更准确的判断方式是同时比较它们的分类位置、叶片、花、果实、树皮和用途。
        {sameFamily
          ? `两者都属于${plant1.family}，分类关系较近。`
          : `两者分别属于${plant1.family}和${plant2.family}，分类关系差异较明显。`}
        {sameGenus
          ? `它们还同属${plant1.genus}，实际识别时需要看细节。`
          : "它们属于不同属，可以先通过科属关系区分。"}
      </p>

      <h2>快速结论</h2>
      <ul>
        <li>
          分类：{plant1.nameCn}属于{plant1.family} / {plant1.genus}；
          {plant2.nameCn}属于{plant2.family} / {plant2.genus}。
        </li>
        <li>
          叶片：{plant1.nameCn}为{plant1.leaf || "暂无数据"}；
          {plant2.nameCn}为{plant2.leaf || "暂无数据"}。
        </li>
        <li>
          花果：{plant1.nameCn}为{plant1.flower || "暂无花部数据"}、
          {plant1.fruit || "暂无果实数据"}；
          {plant2.nameCn}为{plant2.flower || "暂无花部数据"}、
          {plant2.fruit || "暂无果实数据"}。
        </li>
      </ul>

      <h2>分类关系</h2>
      <p>
        {plant1.nameCn}的谱系位置是：
        {plant1.division} › {plant1.className} › {plant1.order} ›{" "}
        {plant1.family} › {plant1.genus}。
        {plant2.nameCn}的谱系位置是：
        {plant2.division} › {plant2.className} › {plant2.order} ›{" "}
        {plant2.family} › {plant2.genus}。
      </p>

      <p>
        从分类学角度看，
        {sameGenus
          ? "同属植物关系最接近，因此外观和生态习性可能更相似。"
          : sameFamily
          ? "同科但不同属的植物有一定共同特征，但仍需要通过叶、花、果实进一步区分。"
          : "不同科植物即使外观相似，也通常只是形态或用途上的相似，而不代表亲缘关系很近。"}
      </p>

      <h2>对比一览</h2>
      <table border={1} cellPadding={10}>
        <tbody>
          <tr>
            <td>项目</td>
            <td>{plant1.nameCn}</td>
            <td>{plant2.nameCn}</td>
          </tr>
          <tr>
            <td>科 / 属</td>
            <td>
              {plant1.family} / {plant1.genus}
            </td>
            <td>
              {plant2.family} / {plant2.genus}
            </td>
          </tr>
          <tr>
            <td>类型</td>
            <td>{plant1.habit || "-"}</td>
            <td>{plant2.habit || "-"}</td>
          </tr>
          <tr>
            <td>叶</td>
            <td>{plant1.leaf || "-"}</td>
            <td>{plant2.leaf || "-"}</td>
          </tr>
          <tr>
            <td>花</td>
            <td>{plant1.flower || "-"}</td>
            <td>{plant2.flower || "-"}</td>
          </tr>
          <tr>
            <td>果实/种子</td>
            <td>{plant1.fruit || "-"}</td>
            <td>{plant2.fruit || "-"}</td>
          </tr>
          <tr>
            <td>树皮</td>
            <td>{plant1.bark || "-"}</td>
            <td>{plant2.bark || "-"}</td>
          </tr>
          <tr>
            <td>用途</td>
            <td>{plant1.usage.length > 0 ? plant1.usage.join("、") : "-"}</td>
            <td>{plant2.usage.length > 0 ? plant2.usage.join("、") : "-"}</td>
          </tr>
        </tbody>
      </table>

      <h2>共同特征</h2>
      <p>
        两者共同标签包括：
        {sharedTags.length > 0 ? sharedTags.join("、") : "暂无明显共同标签"}。
        共同标签可以帮助判断它们在形态、用途或生态习性上的相似点。
      </p>

      <h2>主要差异</h2>
      <p>
        {plant1.nameCn}更典型的特征包括：
        {plant1OnlyTags.length > 0
          ? plant1OnlyTags.slice(0, 10).join("、")
          : "暂无明显独有标签"}
        。
      </p>
      <p>
        {plant2.nameCn}更典型的特征包括：
        {plant2OnlyTags.length > 0
          ? plant2OnlyTags.slice(0, 10).join("、")
          : "暂无明显独有标签"}
        。
      </p>

      <h2>如何区分</h2>
      <p>
        实际识别时，建议先看分类关系，再看形态特征。若两者不同科，通常可以通过科属关系快速排除；
        若两者同科或同属，则需要重点观察叶片、花期、果实、树皮和用途差异。
      </p>

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
    </AtlasLayout>
  );
}