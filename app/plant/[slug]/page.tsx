import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlants } from "@/lib/loadPlants";
import AtlasLayout from "@/app/components/AtlasLayout";
import Image from "next/image";
import { getPlantImage } from "@/lib/getPlantImage";

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[|、,，]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function hasTag(plant: any, tag: string) {
  return toList(plant.tags).includes(tag);
}

function sentenceList(items: string[]) {
  return items.filter(Boolean).join("、");
}

function buildPlantIntro(plant: any) {
  const tags = toList(plant.tags);

  return [
    `${plant.nameCn}（${plant.nameLatin}）是${plant.family}${plant.genus}植物。`,
    plant.habit ? `从生活型来看，它属于${plant.habit}。` : "",
    plant.leaf ? `它最容易观察的特征是${plant.leaf}。` : "",
    plant.environment ? `在生长环境上，${plant.environment}。` : "",
    tags.length > 0
      ? `常见识别标签包括${sentenceList(tags.slice(0, 6))}。`
      : "",
  ]
    .filter(Boolean)
    .join("");
}

function buildIdentificationText(plant: any) {
  const clues: string[] = [];

  if (plant.leaf) clues.push(`先看叶片：${plant.leaf}`);
  if (plant.flower) clues.push(`再看花：${plant.flower}`);
  if (plant.fruit) clues.push(`结果期可看果实：${plant.fruit}`);
  if (plant.bark) clues.push(`冬季或不开花时可观察树皮：${plant.bark}`);

  if (hasTag(plant, "针叶树")) {
    clues.push("如果叶片呈针形或鳞片状，通常可以优先考虑松柏类植物。");
  }

  if (hasTag(plant, "扇形叶")) {
    clues.push("如果叶片呈扇形并具有放射状叶脉，识别指向性很强。");
  }

  if (hasTag(plant, "掌状叶")) {
    clues.push("掌状叶植物适合从叶片裂片数量、叶缘和叶柄长度进一步区分。");
  }

  if (hasTag(plant, "秋天变黄") || hasTag(plant, "秋色叶")) {
    clues.push("秋季叶色变化也是重要线索，尤其适合在公园和行道树中观察。");
  }

  return clues;
}

function buildSeasonText(plant: any) {
  const tags = toList(plant.tags);
  const parts: string[] = [];

  if (tags.some((tag) => tag.includes("秋"))) {
    parts.push(
      `${plant.nameCn}具有明显的秋季观赏价值，秋天观察时可以重点看叶色变化。`
    );
  }

  if (tags.includes("常绿乔木") || tags.includes("常绿植物")) {
    parts.push(`${plant.nameCn}属于常绿类型，冬季仍能保持较明显的绿色景观。`);
  }

  if (tags.includes("落叶乔木")) {
    parts.push(
      `${plant.nameCn}属于落叶类型，春夏季适合观察叶片和花果，秋冬季则适合观察树形与树皮。`
    );
  }

  if (plant.flower && !plant.flower.includes("无明显")) {
    parts.push(`开花期可以通过“${plant.flower}”进行辅助识别。`);
  }

  if (plant.fruit) {
    parts.push(`结果期则可以观察“${plant.fruit}”。`);
  }

  return parts;
}

function buildUsageText(plant: any) {
  const usage = toList(plant.usage);
  const tags = toList(plant.tags);
  const parts: string[] = [];

  if (usage.length > 0) {
    parts.push(
      `${plant.nameCn}常用于${sentenceList(
        usage
      )}，因此在城市绿化、庭院或公园中较容易见到。`
    );
  }

  if (tags.includes("行道树")) {
    parts.push("作为行道树时，它通常具有较强的适应性，适合道路两侧种植。");
  }

  if (tags.includes("庭院树")) {
    parts.push("作为庭院树时，主要价值在于树形、叶色或花果观赏。");
  }

  if (tags.includes("湿地植物") || tags.includes("水边植物")) {
    parts.push("如果在河岸、湖边或湿地环境中看到相似植物，可以优先考虑这一类植物。");
  }

  if (tags.includes("耐寒")) {
    parts.push("耐寒性较强，使它在北方或冬季气温较低地区也较常见。");
  }

  if (tags.includes("耐污染")) {
    parts.push("耐污染能力较强，是它适合城市环境的重要原因。");
  }

  return parts;
}

function getPlantSeoTopic(plant: any) {
  const tags = toList(plant.tags);

  if (tags.some((tag) => tag.includes("针叶") || tag.includes("松果"))) {
    return "针叶树识别";
  }

  if (
    tags.some(
      (tag) =>
        tag.includes("秋") ||
        tag.includes("黄叶") ||
        tag.includes("红叶")
    )
  ) {
    return "秋色树识别";
  }

  if (tags.some((tag) => tag.includes("行道树") || tag.includes("城市绿化"))) {
    return "常见行道树";
  }

  if (tags.some((tag) => tag.includes("庭院") || tag.includes("观赏"))) {
    return "园林植物识别";
  }

  if (tags.some((tag) => tag.includes("湿地") || tag.includes("水边"))) {
    return "湿地植物识别";
  }

  return "植物识别";
}

function buildPlantTitle(plant: any) {
  const tags = toList(plant.tags);
  const highlights: string[] = [];

  if (tags.includes("扇形叶")) highlights.push("扇形叶");
  if (tags.includes("秋天变黄") || tags.includes("秋色叶")) {
    highlights.push("秋叶");
  }
  if (tags.includes("针叶树")) highlights.push("针叶树");
  if (tags.includes("行道树")) highlights.push("行道树");
  if (tags.includes("湿地植物") || tags.includes("水边植物")) {
    highlights.push("水边植物");
  }

  if (highlights.length > 0) {
    return `${plant.nameCn}｜${highlights
      .slice(0, 2)
      .join("、")}与${getPlantSeoTopic(plant)}`;
  }

  return `${plant.nameCn}（${plant.nameLatin}）｜特征、分类与识别方法`;
}

function buildPlantDescription(plant: any) {
  const parts: string[] = [];
  const tags = toList(plant.tags);

  if (plant.leaf) {
    parts.push(`叶片特征：${plant.leaf}`);
  }

  if (plant.flower && !plant.flower.includes("无明显")) {
    parts.push(`花：${plant.flower}`);
  }

  if (plant.fruit) {
    parts.push(`果实或种子：${plant.fruit}`);
  }

  if (plant.environment) {
    parts.push(`常见环境：${plant.environment}`);
  }

  if (tags.some((tag) => tag.includes("秋"))) {
    parts.push("适合秋季观叶识别");
  }

  if (tags.includes("行道树")) {
    parts.push("常见城市行道树");
  }

  const detail = parts.slice(0, 4).join("，");

  return `${plant.nameCn}属于${plant.family}${plant.genus}。${detail}。`;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plants = loadPlants();
  const plant = plants.find((p) => p.slug === slug);

  if (!plant) {
    return {
      title: "植物信息｜Plant Atlas World",
      description: "查看常见植物的分类、形态特征和识别方法。",
    };
  }

  const title = buildPlantTitle(plant);
  const description = buildPlantDescription(plant);

  return {
    title,
    description,
    alternates: {
      canonical: `https://plantatlasworld.com/plant/${plant.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://plantatlasworld.com/plant/${plant.slug}`,
      siteName: "Plant Atlas World",
      type: "article",
    },
  };
}

export default async function PlantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plants = loadPlants();

  const plant = plants.find((p) => p.slug === slug);
  if (!plant) notFound();
  const plantImage = await getPlantImage(
    plant.nameLatin
  );
  const sameFamilyPlants = plants.filter(
    (p) => p.familySlug === plant.familySlug && p.slug !== plant.slug
  );

  const sameGenusPlants = plants.filter(
    (p) => p.genusSlug === plant.genusSlug && p.slug !== plant.slug
  );

  const similarNames = toList(plant.similar);
  const comparePlants = plants.filter((p) => similarNames.includes(p.nameCn));

  const tags = toList(plant.tags);
  const usage = toList(plant.usage);
  const relatedNames = toList((plant as any).relatives ?? plant.similar);

  const identificationTexts = buildIdentificationText(plant);
  const seasonTexts = buildSeasonText(plant);
  const usageTexts = buildUsageText(plant);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${plant.nameCn}（${plant.nameLatin}）`,
    description: `${plant.nameCn}的植物识别、分类谱系和形态特征介绍。`,
    url: `https://plantatlasworld.com/plant/${plant.slug}`,
    about: {
      "@type": "Thing",
      name: plant.nameCn,
      alternateName: plant.nameLatin,
    },
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
        <span>{plant.division}</span>
        <span>›</span>
        <Link href={`/class/${plant.classSlug}`} className="lineage-node link">
          {plant.className}
        </Link>
        <span>›</span>
        <Link href={`/order/${plant.orderSlug}`} className="lineage-node link">
          {plant.order}
        </Link>
        <span>›</span>
        <Link href={`/family/${plant.familySlug}`} className="lineage-node link">
          {plant.family}
        </Link>
        <span>›</span>
        <Link href={`/genus/${plant.genusSlug}`} className="lineage-node link">
          {plant.genus}
        </Link>
      </nav>

      <h1>{plant.nameCn}</h1>
      <p className="latin">{plant.nameLatin}</p>
      {plantImage && (
        <div className="plant-hero-image">
          <Image
            src={plantImage}
            alt={`${plant.nameCn}（${plant.nameLatin}）植物图片`}
            width={1200}
            height={800}
            priority
          />
        </div>
      )}
      <h2>基础信息</h2>
      <div className="info-inline">
        <div className="info-item">
          <span className="info-label">科：</span>
          <Link href={`/family/${plant.familySlug}`} className="link">
            {plant.family}
          </Link>
        </div>

        <div className="info-item">
          <span className="info-label">属：</span>
          <Link href={`/genus/${plant.genusSlug}`} className="link">
            {plant.genus}
          </Link>
        </div>

        <div className="info-item">
          <span className="info-label">目：</span>
          <Link href={`/order/${plant.orderSlug}`} className="link">
            {plant.order}
          </Link>
        </div>

        <div className="info-item">
          <span className="info-label">纲：</span>
          <Link href={`/class/${plant.classSlug}`} className="link">
            {plant.className}
          </Link>
        </div>

        <div className="info-item">
          <span className="info-label">类群：</span>
          {plant.division}
        </div>

        {plant.habit && (
          <div className="info-item">
            <span className="info-label">类型：</span>
            {plant.habit}
          </div>
        )}
      </div>

      <h2>谱系位置</h2>
      <div className="lineage-horizontal">
        <span className="lineage-node">{plant.kingdom}</span>
        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{plant.division}</span>
        <span className="lineage-arrow">›</span>

        <Link href={`/class/${plant.classSlug}`} className="lineage-node link">
          {plant.className}
        </Link>
        <span className="lineage-arrow">›</span>

        <Link href={`/order/${plant.orderSlug}`} className="lineage-node link">
          {plant.order}
        </Link>
        <span className="lineage-arrow">›</span>

        <Link href={`/family/${plant.familySlug}`} className="lineage-node link">
          {plant.family}
        </Link>
        <span className="lineage-arrow">›</span>

        <Link href={`/genus/${plant.genusSlug}`} className="lineage-node link">
          {plant.genus}
        </Link>
        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{plant.nameCn}</span>
      </div>

      <h2>近缘或相似植物</h2>
      <p>
        {relatedNames.length > 0
          ? `${plant.nameCn}的近缘或常见相似植物包括：${relatedNames.join(
              "、"
            )}。这些植物可能在叶片、树形、季节变化或生长环境上与${plant.nameCn}存在相似之处。`
          : "暂无近缘或相似植物数据。"}
      </p>

      <h2>同科植物</h2>
      {sameFamilyPlants.length > 0 ? (
        <ul>
          {sameFamilyPlants.slice(0, 12).map((p) => (
            <li key={p.slug}>
              <Link href={`/plant/${p.slug}`} className="link">
                {p.nameCn}
              </Link>
              <span className="meta"> · {p.nameLatin} · {p.genus}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无同科植物数据。</p>
      )}

      <h2>同属植物</h2>
      {sameGenusPlants.length > 0 ? (
        <ul>
          {sameGenusPlants.slice(0, 12).map((p) => (
            <li key={p.slug}>
              <Link href={`/plant/${p.slug}`} className="link">
                {p.nameCn}
              </Link>
              <span className="meta"> · {p.nameLatin}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无同属植物数据。</p>
      )}

      <h2>常见对比</h2>
      {comparePlants.length > 0 ? (
        <ul>
          {comparePlants.map((p) => (
            <li key={p.slug}>
              <Link href={`/compare/${plant.slug}-vs-${p.slug}`} className="link">
                {plant.nameCn}和{p.nameCn}的区别
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">
          当前暂无常见对比。后续可以通过 similar 字段补充相似植物。
        </p>
      )}

      <p>{buildPlantIntro(plant)}</p>

      <h2>{plant.nameCn}是什么植物</h2>
      <p>
        {plant.nameCn}在分类上属于{plant.division}、
        <Link href={`/class/${plant.classSlug}`} className="link">
          {plant.className}
        </Link>
        、
        <Link href={`/order/${plant.orderSlug}`} className="link">
          {plant.order}
        </Link>
        、
        <Link href={`/family/${plant.familySlug}`} className="link">
          {plant.family}
        </Link>
        、
        <Link href={`/genus/${plant.genusSlug}`} className="link">
          {plant.genus}
        </Link>
        。
        {plant.habit ? ` 它的生活型为${plant.habit}。` : ""}
        通过科属关系可以判断它与同科、同属植物之间的亲缘关系，
        也能帮助区分外观相似但分类不同的植物。
      </p>

      <h2>{plant.nameCn}的主要特征</h2>
      <p>
        识别{plant.nameCn}时，最值得观察的是叶片、花、果实和树皮。
        {plant.leaf ? ` 叶片方面，${plant.leaf}。` : ""}
        {plant.flower ? ` 花部特征为${plant.flower}。` : ""}
        {plant.fruit ? ` 果实或种子特征为${plant.fruit}。` : ""}
        {plant.bark ? ` 树皮通常表现为${plant.bark}。` : ""}
      </p>

      <h2>如何识别{plant.nameCn}</h2>
      <ol>
        {identificationTexts.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ol>

      <h2>季节变化与观察时间</h2>
      {seasonTexts.length > 0 ? (
        seasonTexts.map((text, index) => <p key={index}>{text}</p>)
      ) : (
        <p>
          观察{plant.nameCn}时，可以结合春季新叶、花期、结果期和秋冬树形变化。
          不同季节可观察到的特征不同，建议结合多个部位判断。
        </p>
      )}

      <h2>生长环境与常见用途</h2>
      <p>
        {plant.environment
          ? `${plant.nameCn}的生长环境特点是：${plant.environment}。`
          : `${plant.nameCn}的生长环境资料暂不完整。`}
      </p>

      {usageTexts.map((text, index) => (
        <p key={index}>{text}</p>
      ))}

      {usage.length > 0 && (
        <>
          <h3>常见用途</h3>
          <ul>
            {usage.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}

      <h2>识别标签</h2>
      {tags.length > 0 ? (
        <p>
          {plant.nameCn}的标签包括：{tags.join("、")}。
          这些标签可以用于植物识别页、相似植物对比页和分类聚合页，
          帮助从外观、生态和用途角度理解这种植物。
        </p>
      ) : (
        <p>当前暂无标签数据。</p>
      )}
    </AtlasLayout>
  );
}