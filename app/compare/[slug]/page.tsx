import { loadPlants } from "@/lib/loadPlants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import type { Metadata } from "next";

type PlantLike = {
  slug: string;
  nameCn: string;
  nameLatin?: string;
  kingdom?: string;
  division?: string;
  className?: string;
  order?: string;
  family?: string;
  familySlug?: string;
  genus?: string;
  genusSlug?: string;
  leaf?: string;
  flower?: string;
  fruit?: string;
  bark?: string;
  height?: string;
  habit?: string;
  environment?: string;
  distribution?: string;
  usage?: string[] | string;
  tags?: string[] | string;
  description?: string;
  relatives?: string[] | string;
  similar?: string[] | string;
};

function toList(value?: string[] | string): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[、,，|;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinCn(items: string[], fallback = "暂无明确数据") {
  return items.length > 0 ? items.join("、") : fallback;
}

function text(value?: string, fallback = "暂未收录明确描述") {
  return value && value.trim().length > 0 ? value : fallback;
}

function hasAny(tags: string[], keywords: string[]) {
  return tags.some((tag) => keywords.some((keyword) => tag.includes(keyword)));
}

function getSharedTags(a: PlantLike, b: PlantLike) {
  const tagsA = toList(a.tags);
  const tagsB = toList(b.tags);
  return tagsA.filter((tag) => tagsB.includes(tag));
}

function getOnlyTags(a: PlantLike, b: PlantLike) {
  const tagsA = toList(a.tags);
  const tagsB = toList(b.tags);
  return tagsA.filter((tag) => !tagsB.includes(tag));
}

function getCompareTopic(plant1: PlantLike, plant2: PlantLike) {
  const tags = [...toList(plant1.tags), ...toList(plant2.tags)];

  if (tags.some((tag) => tag.includes("针叶") || tag.includes("松果"))) {
    return "两种常见针叶树";
  }

  if (
    tags.some(
      (tag) =>
        tag.includes("秋") ||
        tag.includes("黄叶") ||
        tag.includes("红叶")
    )
  ) {
    return "两种常见秋色树";
  }

  if (
    tags.some(
      (tag) =>
        tag.includes("行道树") ||
        tag.includes("城市绿化")
    )
  ) {
    return "两种常见行道树";
  }

  if (
    tags.some(
      (tag) =>
        tag.includes("庭院") ||
        tag.includes("观赏")
    )
  ) {
    return "两种常见园林植物";
  }

  if (plant1.family && plant1.family === plant2.family) {
    return `两种常见${plant1.family}植物`;
  }

  return "两种常见植物";
}

function buildCompareTitle(
  plant1: PlantLike,
  plant2: PlantLike
) {
  return `${plant1.nameCn} vs ${plant2.nameCn}｜如何快速区分${getCompareTopic(
    plant1,
    plant2
  )}`;
}

function buildMetaDescription(plant1: PlantLike, plant2: PlantLike) {
  return `${plant1.nameCn}和${plant2.nameCn}怎么区分？从分类关系、叶片、花果、树皮、树形、生态环境和常见用途对比${plant1.nameCn}与${plant2.nameCn}的主要区别。`;
}

function buildIntro(plant1: PlantLike, plant2: PlantLike) {
  const sameFamily = plant1.family && plant1.family === plant2.family;
  const sameGenus = plant1.genus && plant1.genus === plant2.genus;
  const tags1 = toList(plant1.tags);
  const tags2 = toList(plant2.tags);
  const sharedTags = getSharedTags(plant1, plant2);

  if (sameGenus) {
    return `${plant1.nameCn}和${plant2.nameCn}都属于${plant1.genus}，亲缘关系很近，因此在叶片、花期或整体树形上容易给人相似印象。区分这类同属植物时，不能只看“像不像”，更应该把叶片形态、花和果实结构、树皮纹理以及出现季节放在一起判断。`;
  }

  if (sameFamily) {
    return `${plant1.nameCn}和${plant2.nameCn}都属于${plant1.family}，属于同一科的常见木本植物。它们可能共享某些科级特征，但具体到属、叶片、花果和生态习性时仍然存在清楚差异。实际识别时，先看叶片和花果，再结合树形与生长环境，通常就能比较稳定地区分。`;
  }

  if (sharedTags.length > 0) {
    return `${plant1.nameCn}和${plant2.nameCn}常被放在一起比较，主要是因为它们都具有${joinCn(sharedTags)}等相似特征。虽然外观或用途上有交集，但二者分别属于${text(plant1.family, "不同科")}和${text(plant2.family, "不同科")}，分类位置并不相同。判断时不要只看单一特征，而要把叶片、树皮、花果和生态环境组合起来观察。`;
  }

  if (hasAny(tags1.concat(tags2), ["行道树", "园林", "绿化"])) {
    return `${plant1.nameCn}和${plant2.nameCn}都是城市园林和绿化中容易遇到的植物。很多人是在公园、街道或校园里看到它们时产生疑问：两者到底是不是同一种树？其实只要从分类、叶片、花果和树皮几个角度观察，就能看出它们的差别。`;
  }

  return `${plant1.nameCn}和${plant2.nameCn}是两种常见木本植物，名称和外观有时会让初学者混淆。要判断它们的区别，最可靠的方法不是只看单张照片，而是结合分类关系、叶片形态、花和果实、树皮纹理、生长环境以及用途进行综合比较。`;
}

function buildClassificationNarrative(plant1: PlantLike, plant2: PlantLike) {
  const sameDivision = plant1.division && plant1.division === plant2.division;
  const sameFamily = plant1.family && plant1.family === plant2.family;
  const sameGenus = plant1.genus && plant1.genus === plant2.genus;

  if (sameGenus) {
    return `从分类上看，${plant1.nameCn}和${plant2.nameCn}同属${plant1.genus}，这是二者相似的重要原因。同属植物往往在花、果实或叶片结构上有连续性，但仍可能因为种的不同而表现出花期、叶形、树皮、树冠或用途上的差异。因此，同属对比的重点应放在细节特征，而不是只看大类。`;
  }

  if (sameFamily) {
    return `从分类上看，${plant1.nameCn}和${plant2.nameCn}同属于${plant1.family}，但分别归入${text(plant1.genus)}和${text(plant2.genus)}。同科不同属说明它们有一定亲缘关系，却不是同一种植物。对于这类植物，科级特征只能帮助理解关系，真正用于识别的仍然是叶片、花果和树皮等可观察特征。`;
  }

  if (sameDivision) {
    return `从分类上看，二者都属于${plant1.division}，但科属位置不同：${plant1.nameCn}属于${text(plant1.family)}${text(plant1.genus)}，${plant2.nameCn}属于${text(plant2.family)}${text(plant2.genus)}。这说明它们即使在外观或应用场景上相似，也不是亲缘特别接近的植物。`;
  }

  return `从分类上看，${plant1.nameCn}属于${text(plant1.division)}，${plant2.nameCn}属于${text(plant2.division)}，二者在植物谱系中的位置差异较大。分类差异越大，越应该优先观察核心结构，例如叶片排列、繁殖结构和树皮，而不是只根据树高或生长地点判断。`;
}

function buildLeafNarrative(plant1: PlantLike, plant2: PlantLike) {
  const leaf1 = text(plant1.leaf);
  const leaf2 = text(plant2.leaf);
  const tags1 = toList(plant1.tags);
  const tags2 = toList(plant2.tags);

  if (leaf1 === "暂未收录明确描述" && leaf2 === "暂未收录明确描述") {
    return `目前两者的叶片细节数据还不完整。实际观察时，建议优先补充叶形、叶缘、叶序、叶片质地和秋季颜色等标签，因为叶片通常是区分${plant1.nameCn}和${plant2.nameCn}最稳定、最容易被普通用户观察到的依据。`;
  }

  if (hasAny(tags1, ["扇形叶"]) || hasAny(tags2, ["扇形叶"])) {
    return `叶片是区分二者的第一观察点。${plant1.nameCn}的叶片特征为${leaf1}；${plant2.nameCn}的叶片特征为${leaf2}。如果其中一种具有明显扇形叶，通常可以在不开花、不结果的季节直接识别出来，因为扇形叶在常见树木中辨识度很高。`;
  }

  if (hasAny(tags1.concat(tags2), ["针形叶", "针叶树"])) {
    return `观察叶片时，要特别注意是否为针形、鳞片状或阔叶。${plant1.nameCn}的叶片特征为${leaf1}；${plant2.nameCn}的叶片特征为${leaf2}。针叶类植物远看都可能呈深绿色团块，但近看叶片排列方式、叶长和枝条形态会有明显差异。`;
  }

  return `叶片是最适合作为日常识别依据的部位。${plant1.nameCn}的叶片通常表现为${leaf1}；${plant2.nameCn}的叶片通常表现为${leaf2}。如果二者叶形差异明显，直接看叶片即可判断；如果叶形接近，则需要继续观察叶缘、叶序、叶片质地以及秋季变色。`;
}

function buildFlowerFruitNarrative(plant1: PlantLike, plant2: PlantLike) {
  return `花和果实适合用于季节性识别。${plant1.nameCn}的花部特征为${text(plant1.flower)}，果实或种子特征为${text(plant1.fruit)}；${plant2.nameCn}的花部特征为${text(plant2.flower)}，果实或种子特征为${text(plant2.fruit)}。如果正处于花期或果期，花色、花序形态、果实颜色和果实结构通常比树形更可靠；如果不在花果期，则应回到叶片和树皮进行判断。`;
}

function buildBarkAndShapeNarrative(plant1: PlantLike, plant2: PlantLike) {
  return `树皮和整体树形适合远距离或冬季识别。${plant1.nameCn}的树皮特征为${text(plant1.bark)}，生活型或高度特征为${text(plant1.habit || plant1.height)}；${plant2.nameCn}的树皮特征为${text(plant2.bark)}，生活型或高度特征为${text(plant2.habit || plant2.height)}。当叶片脱落、花果不明显时，树皮颜色、裂纹方向、树干姿态和树冠轮廓会成为重要线索。`;
}

function buildHabitatNarrative(plant1: PlantLike, plant2: PlantLike) {
  const usage1 = joinCn(toList(plant1.usage), "用途暂未收录");
  const usage2 = joinCn(toList(plant2.usage), "用途暂未收录");

  return `生长环境和用途可以作为辅助判断。${plant1.nameCn}常见环境为${text(plant1.environment)}，常见用途包括${usage1}；${plant2.nameCn}常见环境为${text(plant2.environment)}，常见用途包括${usage2}。不过环境只能作为辅助证据，因为很多园林植物会被跨地区栽培，真正可靠的仍然是形态结构。`;
}

function buildBeginnerGuide(plant1: PlantLike, plant2: PlantLike) {
  return `如果你只是想快速判断，可以按这个顺序观察：第一看叶片，确认叶形、叶缘和叶片排列；第二看花或果实，尤其是在春季开花或秋季结果时；第三看树皮和树形，判断是否有明显裂纹、斑驳树皮、圆锥形树冠或开展树冠；第四再看分类关系和生长环境。这个顺序适合大多数${plant1.nameCn}和${plant2.nameCn}的实际识别场景。`;
}

function buildSummary(plant1: PlantLike, plant2: PlantLike) {
  const sameFamily = plant1.family && plant1.family === plant2.family;
  const sharedTags = getSharedTags(plant1, plant2);
  const only1 = getOnlyTags(plant1, plant2);
  const only2 = getOnlyTags(plant2, plant1);

  if (sameFamily) {
    return `总体来看，${plant1.nameCn}和${plant2.nameCn}的关系较近，但不能因为同属${plant1.family}就把它们视为同一种植物。${plant1.nameCn}更值得注意的特征包括${joinCn(only1)}；${plant2.nameCn}更值得注意的特征包括${joinCn(only2)}。如果二者共享${joinCn(sharedTags)}等标签，说明它们在某些观察场景中确实容易混淆，但通过叶片、花果和树皮仍然可以区分。`;
  }

  return `总体来看，${plant1.nameCn}和${plant2.nameCn}的主要区别来自分类位置和可观察形态。${plant1.nameCn}的代表性特征包括${joinCn(only1)}；${plant2.nameCn}的代表性特征包括${joinCn(only2)}。实际识别时，优先比较叶片和树形，再结合花果、树皮和环境，就能避免只凭名称或单一外观造成误判。`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plants = loadPlants() as PlantLike[];
  const parts = slug.split("-vs-");

  if (parts.length !== 2) {
    return {
      title: "植物对比｜Plant Atlas World",
      description: "查看常见植物之间的分类关系、形态特征和识别方法。",
    };
  }

  const [slug1, slug2] = parts;
  const plant1 = plants.find((p) => p.slug === slug1);
  const plant2 = plants.find((p) => p.slug === slug2);

  if (!plant1 || !plant2) {
    return {
      title: "植物对比｜Plant Atlas World",
      description: "查看常见植物之间的分类关系、形态特征和识别方法。",
    };
  }

  return {
    title: buildCompareTitle(plant1, plant2),
    description: buildMetaDescription(plant1, plant2),
    alternates: {
      canonical: `https://plantatlasworld.com/compare/${slug}`,
    },
    openGraph: {
      title: buildCompareTitle(plant1, plant2),
      description: buildMetaDescription(plant1, plant2),
      type: "article",
      url: `https://plantatlasworld.com/compare/${slug}`,
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants() as PlantLike[];
  const parts = slug.split("-vs-");

  if (parts.length !== 2) notFound();

  const [slug1, slug2] = parts;
  const plant1 = plants.find((p) => p.slug === slug1);
  const plant2 = plants.find((p) => p.slug === slug2);

  if (!plant1 || !plant2) notFound();

  const sharedTags = getSharedTags(plant1, plant2);
  const plant1OnlyTags = getOnlyTags(plant1, plant2);
  const plant2OnlyTags = getOnlyTags(plant2, plant1);

  const relatedPlants = plants
    .filter(
      (p) =>
        p.slug !== plant1.slug &&
        p.slug !== plant2.slug &&
        (p.family === plant1.family ||
          p.family === plant2.family ||
          p.genus === plant1.genus ||
          p.genus === plant2.genus)
    )
    .slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${plant1.nameCn}和${plant2.nameCn}的区别`,
    description: buildMetaDescription(plant1, plant2),
    about: [plant1.nameCn, plant2.nameCn],
    mainEntityOfPage: `https://plantatlasworld.com/compare/${slug}`,
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
        <Link href="/compare">植物对比</Link>
        <span>›</span>
        <span>
          <Link href={`/plant/${plant1.slug}`} className="link">
            {plant1.nameCn}
          </Link>
          {" vs "}
          <Link href={`/plant/${plant2.slug}`} className="link">
            {plant2.nameCn}
          </Link>
        </span>
      </nav>

      <h1>
        {plant1.nameCn} vs {plant2.nameCn}：怎么快速区分
      </h1>

      <p className="compare-intro">{buildIntro(plant1, plant2)}</p>

      <h2>一句话区别</h2>
      <p>
        <Link href={`/plant/${plant1.slug}`} className="link">
          {plant1.nameCn}
        </Link>
        属于
        {plant1.familySlug ? (
          <Link href={`/family/${plant1.familySlug}`} className="link">
            {text(plant1.family)}
          </Link>
        ) : (
          text(plant1.family)
        )}
        {plant1.genusSlug ? (
          <Link href={`/genus/${plant1.genusSlug}`} className="link">
            {text(plant1.genus)}
          </Link>
        ) : (
          text(plant1.genus)
        )}
        ，典型特征是{text(plant1.leaf || plant1.description)}；
        <Link href={`/plant/${plant2.slug}`} className="link">
          {plant2.nameCn}
        </Link>
        属于
        {plant2.familySlug ? (
          <Link href={`/family/${plant2.familySlug}`} className="link">
            {text(plant2.family)}
          </Link>
        ) : (
          text(plant2.family)
        )}
        {plant2.genusSlug ? (
          <Link href={`/genus/${plant2.genusSlug}`} className="link">
            {text(plant2.genus)}
          </Link>
        ) : (
          text(plant2.genus)
        )}
        ，典型特征是{text(plant2.leaf || plant2.description)}。
      </p>

      <h2>快速对比表</h2>
      <table className="compare-table">
        <tbody>
          <tr>
            <th scope="row">对比项目</th>
            <th scope="col">
              <Link href={`/plant/${plant1.slug}`} className="link">
                {plant1.nameCn}
              </Link>
            </th>
            <th scope="col">
              <Link href={`/plant/${plant2.slug}`} className="link">
                {plant2.nameCn}
              </Link>
            </th>
          </tr>
          <tr>
            <td>中文名 / 学名</td>
            <td>
              <Link href={`/plant/${plant1.slug}`} className="link">
                {plant1.nameCn}
              </Link>
              {plant1.nameLatin ? ` / ${plant1.nameLatin}` : ""}
            </td>
            <td>
              <Link href={`/plant/${plant2.slug}`} className="link">
                {plant2.nameCn}
              </Link>
              {plant2.nameLatin ? ` / ${plant2.nameLatin}` : ""}
            </td>
          </tr>
          <tr>
            <td>科 / 属</td>
            <td>
              {plant1.familySlug ? (
                <Link href={`/family/${plant1.familySlug}`} className="link">
                  {text(plant1.family, "-")}
                </Link>
              ) : (
                text(plant1.family, "-")
              )}
              {" / "}
              {plant1.genusSlug ? (
                <Link href={`/genus/${plant1.genusSlug}`} className="link">
                  {text(plant1.genus, "-")}
                </Link>
              ) : (
                text(plant1.genus, "-")
              )}
            </td>
            <td>
              {plant2.familySlug ? (
                <Link href={`/family/${plant2.familySlug}`} className="link">
                  {text(plant2.family, "-")}
                </Link>
              ) : (
                text(plant2.family, "-")
              )}
              {" / "}
              {plant2.genusSlug ? (
                <Link href={`/genus/${plant2.genusSlug}`} className="link">
                  {text(plant2.genus, "-")}
                </Link>
              ) : (
                text(plant2.genus, "-")
              )}
            </td>
          </tr>
          <tr>
            <td>生活型</td>
            <td>{text(plant1.habit, "-")}</td>
            <td>{text(plant2.habit, "-")}</td>
          </tr>
          <tr>
            <td>叶片</td>
            <td>{text(plant1.leaf, "-")}</td>
            <td>{text(plant2.leaf, "-")}</td>
          </tr>
          <tr>
            <td>花</td>
            <td>{text(plant1.flower, "-")}</td>
            <td>{text(plant2.flower, "-")}</td>
          </tr>
          <tr>
            <td>果实 / 种子</td>
            <td>{text(plant1.fruit, "-")}</td>
            <td>{text(plant2.fruit, "-")}</td>
          </tr>
          <tr>
            <td>树皮</td>
            <td>{text(plant1.bark, "-")}</td>
            <td>{text(plant2.bark, "-")}</td>
          </tr>
          <tr>
            <td>生态环境</td>
            <td>{text(plant1.environment, "-")}</td>
            <td>{text(plant2.environment, "-")}</td>
          </tr>
          <tr>
            <td>常见用途</td>
            <td>{joinCn(toList(plant1.usage), "-")}</td>
            <td>{joinCn(toList(plant2.usage), "-")}</td>
          </tr>
        </tbody>
      </table>

      <h2>分类关系有什么不同</h2>
      <p>{buildClassificationNarrative(plant1, plant2)}</p>

      <div className="compare-lineage-grid">
        <section className="compare-lineage-card">
          <h3>
            <Link href={`/plant/${plant1.slug}`} className="link">
              {plant1.nameCn}
            </Link>
            的谱系位置
          </h3>
          <p>
            {text(plant1.kingdom)} › {text(plant1.division)} ›{" "}
            {text(plant1.className)} › {text(plant1.order)} ›{" "}
            {plant1.familySlug ? (
              <Link href={`/family/${plant1.familySlug}`} className="link">
                {text(plant1.family)}
              </Link>
            ) : (
              text(plant1.family)
            )}{" "}
            ›{" "}
            {plant1.genusSlug ? (
              <Link href={`/genus/${plant1.genusSlug}`} className="link">
                {text(plant1.genus)}
              </Link>
            ) : (
              text(plant1.genus)
            )}
          </p>
        </section>

        <section className="compare-lineage-card">
          <h3>
            <Link href={`/plant/${plant2.slug}`} className="link">
              {plant2.nameCn}
            </Link>
            的谱系位置
          </h3>
          <p>
            {text(plant2.kingdom)} › {text(plant2.division)} ›{" "}
            {text(plant2.className)} › {text(plant2.order)} ›{" "}
            {plant2.familySlug ? (
              <Link href={`/family/${plant2.familySlug}`} className="link">
                {text(plant2.family)}
              </Link>
            ) : (
              text(plant2.family)
            )}{" "}
            ›{" "}
            {plant2.genusSlug ? (
              <Link href={`/genus/${plant2.genusSlug}`} className="link">
                {text(plant2.genus)}
              </Link>
            ) : (
              text(plant2.genus)
            )}
          </p>
        </section>
      </div>

      <h2>看叶片怎么区分</h2>
      <p>{buildLeafNarrative(plant1, plant2)}</p>

      <h2>看花和果实怎么区分</h2>
      <p>{buildFlowerFruitNarrative(plant1, plant2)}</p>

      <h2>看树皮和树形怎么区分</h2>
      <p>{buildBarkAndShapeNarrative(plant1, plant2)}</p>

      <h2>生长环境和用途差异</h2>
      <p>{buildHabitatNarrative(plant1, plant2)}</p>

      <h2>共同特征和容易混淆的原因</h2>
      <p>
        二者共同标签：{joinCn(sharedTags)}。这些标签代表它们在外观、季节、生态或用途上的交集。
        当共同标签较多时，用户在照片识别或现场观察中更容易混淆；当共同标签较少时，通常说明二者只是名称、用途或生境上有联系。
      </p>

      <div className="compare-diff-grid">
        <section>
          <h3>
            <Link href={`/plant/${plant1.slug}`} className="link">
              {plant1.nameCn}
            </Link>
            更典型的特征
          </h3>
          <p>{joinCn(plant1OnlyTags)}</p>
        </section>
        <section>
          <h3>
            <Link href={`/plant/${plant2.slug}`} className="link">
              {plant2.nameCn}
            </Link>
            更典型的特征
          </h3>
          <p>{joinCn(plant2OnlyTags)}</p>
        </section>
      </div>

      <h2>新手识别顺序</h2>
      <p>{buildBeginnerGuide(plant1, plant2)}</p>

      <h2>
        总结：{plant1.nameCn}和{plant2.nameCn}怎么区分
      </h2>
      <p>{buildSummary(plant1, plant2)}</p>

      <h2>相关植物</h2>
      <ul className="dense-list">
        <li>
          <Link href={`/plant/${plant1.slug}`} className="link">
            查看{plant1.nameCn}的分类和识别信息
          </Link>
        </li>
        <li>
          <Link href={`/plant/${plant2.slug}`} className="link">
            查看{plant2.nameCn}的分类和识别信息
          </Link>
        </li>
        {relatedPlants.map((p) => (
          <li key={p.slug}>
            <Link href={`/plant/${p.slug}`} className="link">
              {p.nameCn}
            </Link>
            <span className="meta">
              {" "}· {text(p.family, "未知科")} · {text(p.genus, "未知属")}
            </span>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}