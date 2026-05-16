import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";
import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";

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

function matchPlantByTags(plant: any, tagRules: string[]) {
  const plantTags = toList(plant.tags);

  return tagRules.some((tag) => plantTags.includes(tag));
}

function buildTitle(page: any) {
  return `${page.title}｜常见植物识别方法`;
}

function buildDescription(page: any) {
  return `${page.description}。通过叶片、花果、树皮、季节变化和生长环境识别常见植物。`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = identifyPages.find((p) => p.slug === slug);

  if (!page) {
    return {
      title: "植物识别｜Plant Atlas World",
      description: "按叶片、花果、树皮和环境识别常见植物。",
    };
  }

  return {
    title: buildTitle(page),
    description: buildDescription(page),
    alternates: {
      canonical: `https://plantatlasworld.com/identify/${page.slug}`,
    },
    openGraph: {
      title: buildTitle(page),
      description: buildDescription(page),
      url: `https://plantatlasworld.com/identify/${page.slug}`,
      siteName: "Plant Atlas World",
      type: "article",
    },
  };
}

export default async function IdentifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = identifyPages.find((p) => p.slug === slug);
  if (!page) notFound();

  const plants = loadPlants();

  const matchedPlants = plants.filter((plant) =>
    matchPlantByTags(plant, page.tagRules || [])
  );

  const relatedIdentifyPages = identifyPages
    .filter((p) => p.slug !== page.slug)
    .filter((p) =>
      p.tagRules?.some((tag) => page.tagRules?.includes(tag))
    )
    .slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: `https://plantatlasworld.com/identify/${page.slug}`,
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
        <Link href="/identify">植物识别</Link>
        <span>›</span>
        <span>{page.title}</span>
      </nav>

      <h1>{page.title}</h1>

      <p>{page.description}</p>

      {page.intro && <p>{page.intro}</p>}

      <h2>直接答案</h2>
      <p>
        {page.title.replace("有哪些", "")}
        常见植物包括：
        {matchedPlants.length > 0
          ? matchedPlants.slice(0, 8).map((p) => p.nameCn).join("、")
          : "当前暂无匹配植物"}。
      </p>

      {page.quickIdentify && page.quickIdentify.length > 0 && (
        <>
          <h2>如何快速识别</h2>
          <ol>
            {page.quickIdentify.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </>
      )}

      <h2>常见识别特征</h2>
      <p>
        识别这类植物时，可以重点观察叶片形状、叶片排列、花和果实、
        树皮纹理、季节变化以及生长环境。单一特征有时会误导判断，
        更可靠的方法是把多个特征组合起来观察。
      </p>

      {page.seoText && <p>{page.seoText}</p>}

      <h2>匹配植物</h2>

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
        <p className="meta">
          当前没有匹配植物。后续可以通过补充 tags 扩展本识别页面。
        </p>
      )}

      {page.confuseWith && page.confuseWith.length > 0 && (
        <>
          <h2>容易混淆的植物</h2>
          <p>
            这类植物常容易与
            {page.confuseWith.join("、")}
            等植物混淆。实际判断时，应优先比较叶片、花果、树皮和生长环境。
          </p>
        </>
      )}

      <h2>相关识别页面</h2>

      {relatedIdentifyPages.length > 0 ? (
        <ul>
          {relatedIdentifyPages.map((item) => (
            <li key={item.slug}>
              <Link href={`/identify/${item.slug}`} className="link">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无相关识别页面。</p>
      )}
    </AtlasLayout>
  );
}