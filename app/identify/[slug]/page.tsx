import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";

export default async function IdentifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = identifyPages.find((p) => p.slug === slug);

  if (!page) {
    notFound();
  }

  const plants = loadPlants();

  const matchedPlants = plants.filter((plant) =>
    (page.tagRules || []).some((tag) =>
      (plant.tags || []).includes(tag)
    )
  );

  const topNames = matchedPlants
    .slice(0, 5)
    .map((p) => p.nameCn)
    .join("、");

  return (
    <AtlasLayout>
      <h1>{page.title}</h1>

      <p>{page.description}</p>

      <h2>直接答案</h2>

      <p>
        {page.title.replace("有哪些", "")}
        常见包括：
        {topNames || "暂无数据"}。
      </p>

      <h2>如何判断</h2>

      <p>
        建议同时观察：
        叶片、花、果实、树皮以及植物分类关系。
      </p>

      <h2>常见植物</h2>

      <ul>
        {matchedPlants.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`}>
              {plant.nameCn}
            </Link>
            {" · "}
            {plant.family}
            {" · "}
            {plant.genus}
          </li>
        ))}
      </ul>

      <h2>分类关系</h2>

      <p>
        同属植物关系最接近，
        同科植物通常具有部分共同特征，
        不同科植物即使外观类似，
        也可能只是形态相似。
      </p>
    </AtlasLayout>
  );
}