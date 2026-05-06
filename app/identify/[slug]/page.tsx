import { identifyPages } from "@/data/identify";
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
  const page = identifyPages.find((p) => p.slug === slug);

  if (!page) return { title: "植物识别｜Plant Atlas World" };

  return {
    title: `${page.title}｜植物识别、分类关系与常见树种`,
    description: page.description,
  };
}

export default async function IdentifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = identifyPages.find((p) => p.slug === slug);
  if (!page) return notFound();

  const plants = loadPlants();

  const matchedPlants = plants.filter((plant) =>
    page.tagRules.some((tag) => plant.tags?.includes(tag))
  );

  const topPlants = matchedPlants.slice(0, 6);
  const topNames = topPlants.map((p) => p.nameCn).join("、");

  const families = Array.from(new Set(matchedPlants.map((p) => p.family)));
  const genera = Array.from(new Set(matchedPlants.map((p) => p.genus)));
  const divisions = Array.from(new Set(matchedPlants.map((p) => p.division)));

  const keyTags = Array.from(
    new Set(matchedPlants.flatMap((p) => p.tags || []))
  ).slice(0, 16);

  return (
    <AtlasLayout>
      <h1>{page.title}</h1>

      <p>{page.description}</p>

      <h2>直接答案</h2>
      <p>
        {page.title.replace("有哪些", "")}，常见植物包括
        {topNames || "暂无匹配植物"}。如果只是从外观判断，容易出现误认；
        更稳妥的方法是同时观察叶、花、果实、树皮和树形，再结合它们在植物谱系中的位置。
      </p>

      <h2>识别要点</h2>
      <p>
        这类植物常见的识别标签包括：
        {keyTags.length > 0 ? keyTags.join("、") : "暂无标签"}。
        这些标签不是孤立特征，而是可以与科、属、种的分类关系一起使用。
      </p>

      <h2>分类关系</h2>
      <p>
        从分类上看，这组植物涉及
        {divisions.length > 0 ? divisions.join("、") : "多个类群"}，
        主要分布在{families.length > 0 ? families.join("、") : "多个科"}。
        常见属包括{genera.length > 0 ? genera.join("、") : "多个属"}。
        同属植物关系通常更近，同科植物往往具有部分共同特征；不同科植物即使外观相似，
        也可能只是叶形、花色或用途上的相似。
      </p>

      <h2>常见植物</h2>
      {matchedPlants.length > 0 ? (
        <ul>
          {matchedPlants.map((plant) => (
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
      ) : (
        <p className="meta">暂无匹配植物数据。</p>
      )}

      <h2>如何避免误判</h2>
      <p>
        识别植物时，不建议只依赖单一特征。例如“白花”“常绿”“针叶”都可能出现在多个不同科属中。
        更可靠的判断顺序是：先看明显外观特征，再看花果和树皮，最后用科属关系确认。
        对于相似植物，同属通常最容易混淆，不同科则更容易通过分类位置排除。
      </p>

      <h2>相关谱系入口</h2>
      <ul>
        {families.slice(0, 8).map((family) => {
          const plant = matchedPlants.find((p) => p.family === family);
          if (!plant) return null;

          return (
            <li key={family}>
              <Link href={`/family/${plant.familySlug}`} className="link">
                {family}
              </Link>
            </li>
          );
        })}
      </ul>
    </AtlasLayout>
  );
}