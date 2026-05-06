import { loadPlants } from "@/lib/loadPlants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import type { Metadata } from "next";
import { generateComparePairs } from "@/lib/generateComparePairs";

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
    title: `${plant1.nameCn}和${plant2.nameCn}的区别｜分类、识别与特征对比`,
    description: `比较${plant1.nameCn}和${plant2.nameCn}在分类关系、叶片、花、果实、树皮、用途和识别标签上的差异。`,
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
  const sameDivision = plant1.division === plant2.division;

  const sharedTags = plant1.tags.filter((tag) => plant2.tags.includes(tag));
  const differentTags1 = plant1.tags.filter((tag) => !plant2.tags.includes(tag));
  const differentTags2 = plant2.tags.filter((tag) => !plant1.tags.includes(tag));

  const differences = [
    plant1.leaf !== plant2.leaf
      ? `叶片不同：${plant1.nameCn}是${plant1.leaf || "暂无数据"}，${plant2.nameCn}是${plant2.leaf || "暂无数据"}。`
      : "",
    plant1.flower !== plant2.flower
      ? `花部特征不同：${plant1.nameCn}是${plant1.flower || "暂无数据"}，${plant2.nameCn}是${plant2.flower || "暂无数据"}。`
      : "",
    plant1.fruit !== plant2.fruit
      ? `果实或种子不同：${plant1.nameCn}是${plant1.fruit || "暂无数据"}，${plant2.nameCn}是${plant2.fruit || "暂无数据"}。`
      : "",
    !sameFamily
      ? `分类不同：${plant1.nameCn}属于${plant1.family}，${plant2.nameCn}属于${plant2.family}。`
      : "",
  ].filter(Boolean);

  const comparePairs = generateComparePairs();

  return (
    <AtlasLayout>
      <h1>{plant1.nameCn}和{plant2.nameCn}的区别</h1>

      <p>
        {plant1.nameCn}和{plant2.nameCn}的区别，不能只看外观。
        更准确的判断方式是同时比较分类位置、叶片、花、果实、树皮和用途。
        {sameFamily
          ? `两者同属${plant1.family}，说明分类关系较近。`
          : `两者分别属于${plant1.family}和${plant2.family}，分类关系差异较大。`}
        {sameGenus
          ? `它们还同属${plant1.genus}，实际识别时更需要观察细节。`
          : "它们属于不同属，可以优先通过科属关系进行区分。"}
      </p>

      <h2>快速判断方法</h2>
      {differences.length > 0 ? (
        <ul>
          {differences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="meta">两者基础特征较接近，需要结合更多形态细节判断。</p>
      )}

      <h2>分类关系</h2>
      <p>
        {plant1.nameCn}的分类位置是{plant1.division}、{plant1.className}、{plant1.order}、
        {plant1.family}、{plant1.genus}；
        {plant2.nameCn}的分类位置是{plant2.division}、{plant2.className}、{plant2.order}、
        {plant2.family}、{plant2.genus}。
        两者{sameDivision ? "属于同一大类群" : "不属于同一大类群"}，
        {sameFamily ? "属于同一科" : "不属于同一科"}，
        {sameGenus ? "属于同一属" : "属于不同属"}。
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
            <td>{plant1.family} / {plant1.genus}</td>
            <td>{plant2.family} / {plant2.genus}</td>
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
            <td>{plant1.usage.join("、") || "-"}</td>
            <td>{plant2.usage.join("、") || "-"}</td>
          </tr>
        </tbody>
      </table>

      <h2>共同特征</h2>
      <p>
        两者共同标签包括：
        {sharedTags.length > 0 ? sharedTags.join("、") : "暂无明显共同标签"}。
        共同标签说明它们在形态、用途、生态习性或分类层级上存在一定相似性。
      </p>

      <h2>主要差异标签</h2>
      <p>
        {plant1.nameCn}更典型的特征包括：
        {differentTags1.length > 0 ? differentTags1.slice(0, 10).join("、") : "暂无明显差异标签"}。
      </p>
      <p>
        {plant2.nameCn}更典型的特征包括：
        {differentTags2.length > 0 ? differentTags2.slice(0, 10).join("、") : "暂无明显差异标签"}。
      </p>

      <h2>如何区分</h2>
      <p>
        如果两种植物属于不同科，通常可以先用分类位置排除；如果属于同一科或同一属，
        则要进一步观察叶片形状、花期、果实、树皮和用途。实际识别时，分类关系能帮助判断它们是真正近缘，
        还是只是外观上相似。
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

      <h2>更多相关对比</h2>
      <ul>
        {comparePairs.slice(0, 8).map((item) => (
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