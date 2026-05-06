import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import type { Metadata } from "next";

type PlantLike = {
  slug: string;
  nameCn: string;
  nameLatin?: string;
  family?: string;
  familySlug?: string;
  genus?: string;
  genusSlug?: string;
  leaf?: string;
  flower?: string;
  fruit?: string;
  bark?: string;
  habit?: string;
  environment?: string;
  usage?: string[] | string;
  tags?: string[] | string;
  description?: string;
};

type IdentifyPageData = {
  slug: string;
  title: string;
  description: string;
  tagRules: string[];
  intent?: string;
  observeParts?: string[];
  seoKeywords?: string[];
};

function toList(value?: string[] | string): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[、,，|;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function text(value?: string, fallback = "暂未收录明确描述") {
  return value && value.trim().length > 0 ? value : fallback;
}

function joinCn(items: string[], fallback = "暂无匹配数据") {
  return items.length > 0 ? items.join("、") : fallback;
}

function matchIdentifyPage(plant: PlantLike, page: IdentifyPageData) {
  const tags = toList(plant.tags);
  return page.tagRules.some((rule) => tags.some((tag) => tag.includes(rule) || rule.includes(tag)));
}

function buildDirectAnswer(page: IdentifyPageData, plants: PlantLike[]) {
  const names = plants.slice(0, 8).map((plant) => plant.nameCn);
  if (names.length === 0) {
    return `${page.title.replace("有哪些", "")}目前暂未匹配到植物。建议先补充植物 tags，例如叶形、花色、果实颜色、生活型、行道树、秋季变色等标签。`;
  }
  return `${page.title.replace("有哪些", "")}常见包括${joinCn(names)}。这些植物之所以会出现在本页，是因为它们具有${joinCn(page.tagRules)}等可观察特征，适合用于现场识别、图片搜索和植物分类学习。`;
}

function buildObserveGuide(page: IdentifyPageData, plants: PlantLike[]) {
  const parts = page.observeParts && page.observeParts.length > 0 ? page.observeParts : ["叶片", "花", "果实", "树皮", "生长环境"];
  const families = Array.from(new Set(plants.map((p) => p.family).filter(Boolean))) as string[];

  return `判断${page.title.replace("有哪些", "")}时，建议优先观察${joinCn(parts)}。如果多个植物都符合${joinCn(page.tagRules)}，不要只凭一个特征下结论，而要继续比较叶片形状、叶缘、花期、果实结构、树皮纹理和出现环境。本页匹配到的植物涉及${joinCn(families.slice(0, 6), "多个科")}，说明相似外观可能来自不同分类群，实际识别时需要结合分类关系。`;
}

function buildCommonMistakes(page: IdentifyPageData) {
  return `常见误区是把“看起来像”直接等同于“同一种植物”。例如同样是${joinCn(page.tagRules)}，可能只是叶形、颜色或用途相似，并不代表它们属于同一科或同一属。更稳妥的做法是先用标签缩小范围，再点进具体植物页面查看科属、叶片、花、果实、树皮和用途。`;
}

function buildSeasonalGuide(page: IdentifyPageData) {
  const rules = page.tagRules.join("、");
  if (rules.includes("秋") || rules.includes("变黄") || rules.includes("红叶")) {
    return "如果这个特征与秋季变色有关，最佳观察时间通常是秋季叶色稳定之后。此时可以重点比较叶片颜色、变色均匀度、落叶时间和树冠整体色块。";
  }
  if (rules.includes("花") || rules.includes("开花")) {
    return "如果这个特征与花有关，最好在花期观察。花色、花瓣数量、花序位置、开花早晚和是否先花后叶，都是判断植物的重要线索。";
  }
  if (rules.includes("果") || rules.includes("果实")) {
    return "如果这个特征与果实有关，建议在果实成熟期观察。果实颜色、形状、是否成串、是否为球形或荚果，通常能明显缩小识别范围。";
  }
  return "如果季节特征不明显，可以全年观察叶片、树皮和树形；如果遇到花期或果期，再补充花果信息，识别准确率会更高。";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = identifyPages.find((item) => item.slug === slug) as IdentifyPageData | undefined;

  if (!page) {
    return {
      title: "植物识别｜Plant Atlas World",
      description: "按叶片、花、果实、树皮、季节和用途识别常见植物。",
    };
  }

  return {
    title: `${page.title}｜常见植物识别与分类线索`,
    description: `${page.description} 本页整理符合${joinCn(page.tagRules)}特征的常见植物，并说明如何通过叶片、花果、树皮和分类关系进行判断。`,
    alternates: {
      canonical: `/identify/${slug}`,
    },
    openGraph: {
      title: `${page.title}｜Plant Atlas World`,
      description: page.description,
      type: "article",
      url: `/identify/${slug}`,
    },
  };
}

export default async function IdentifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = identifyPages.find((item) => item.slug === slug) as IdentifyPageData | undefined;

  if (!page) notFound();

  const plants = loadPlants() as PlantLike[];
  const matchedPlants = plants.filter((plant) => matchIdentifyPage(plant, page));
  const matchedFamilies = Array.from(new Set(matchedPlants.map((p) => p.family).filter(Boolean))) as string[];
  const matchedGenera = Array.from(new Set(matchedPlants.map((p) => p.genus).filter(Boolean))) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    keywords: [...page.tagRules, ...(page.seoKeywords || [])].join(","),
    mainEntityOfPage: `/identify/${slug}`,
  };

  return (
    <AtlasLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="breadcrumb" aria-label="breadcrumb">
        <Link href="/">首页</Link>
        <span>›</span>
        <Link href="/identify">植物识别</Link>
        <span>›</span>
        <span>{page.title}</span>
      </nav>

      <h1>{page.title}</h1>
      <p className="identify-intro">{page.description}</p>

      <h2>直接答案</h2>
      <p>{buildDirectAnswer(page, matchedPlants)}</p>

      <h2>如何判断这类植物</h2>
      <p>{buildObserveGuide(page, matchedPlants)}</p>

      <h2>常见植物列表</h2>
      {matchedPlants.length > 0 ? (
        <ul className="dense-list">
          {matchedPlants.map((plant) => (
            <li key={plant.slug}>
              <Link href={`/plant/${plant.slug}`} className="link">
                {plant.nameCn}
              </Link>
              <span className="meta">
                {plant.nameLatin ? ` · ${plant.nameLatin}` : ""} · {text(plant.family, "未知科")} · {text(plant.genus, "未知属")}
              </span>
              <p>
                {text(plant.description)} {plant.leaf ? `叶片特征：${plant.leaf}。` : ""}
                {plant.flower ? `花：${plant.flower}。` : ""}
                {plant.fruit ? `果实：${plant.fruit}。` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无匹配植物。请检查 plants 数据中的 tags 是否包含：{joinCn(page.tagRules)}。</p>
      )}

      <h2>分类关系</h2>
      <p>
        本页匹配植物覆盖{matchedFamilies.length}个科、{matchedGenera.length}个属。
        常见科包括{joinCn(matchedFamilies.slice(0, 8), "暂无科属数据")}。
        如果两个植物同属，通常亲缘关系更近；如果只是共享同一个识别标签，则可能只是外观相似。
      </p>

      <h2>季节和观察时机</h2>
      <p>{buildSeasonalGuide(page)}</p>

      <h2>容易混淆的地方</h2>
      <p>{buildCommonMistakes(page)}</p>

      <h2>相关识别标签</h2>
      <p>
        当前页面使用的识别标签为：{joinCn(page.tagRules)}。
        后续可以继续增加叶形、叶色、花色、果实、树皮、生活型、用途和季节标签，页面内容会自动变得更完整。
      </p>
    </AtlasLayout>
  );
}
