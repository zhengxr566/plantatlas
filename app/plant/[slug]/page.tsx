import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import { articleMeta, taxonomyCrumbs } from "@/lib/structuredData";
import Image from "next/image";
import PhotoFigure from "@/app/components/PhotoFigure";
import PartPlaceholder from "@/app/components/PartPlaceholder";
import { getCorePartSlugs, plantParts } from "@/data/parts";
import AdSlot from "@/app/components/AdSlot";
import {
  buildImageObjectJsonLd,
  buildPhotoAlt,
  loadPhotos,
} from "@/lib/loadPhotos";
import {
  generateComparePairs,
  getPairsForPlant,
} from "@/lib/generateComparePairs";

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

// “，又名白果树、公孙树，”——让搜索别名的读者确认找对了植物
function aliasClause(plant: Plant) {
  const aliases = toList(plant.aliases);
  return aliases.length > 0 ? `，又名${aliases.join("、")}，` : "";
}

// 标题里放第一个别名，例如“银杏（白果树）”
function titleName(plant: Plant) {
  const [alias] = toList(plant.aliases);
  return alias ? `${plant.nameCn}（${alias}）` : plant.nameCn;
}

function buildPlantIntro(plant: any) {
  const tags = toList(plant.tags);

  return [
    `${plant.nameCn}（${plant.nameLatin}）${aliasClause(plant)}是${plant.family}${plant.genus}植物。`,
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
    return `${titleName(plant)}｜${highlights
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

  const aliases = toList(plant.aliases);
  const aka = aliases.length > 0 ? `（又名${aliases.slice(0, 2).join("、")}）` : "";
  return `${plant.nameCn}${aka}属于${plant.family}${plant.genus}。${detail}。`;
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
  const photos = loadPhotos().filter((p) => p.plant === plant.slug);
  // 核心部位始终展示（没有图时显示占位），其他部位有图才展示
  const coreParts = getCorePartSlugs(plant.division, plant.className);
  const shownParts = plantParts.filter(
    (part) =>
      coreParts.includes(part.slug) || photos.some((p) => p.part === part.slug)
  );
  const heroPhoto =
    photos.find((p) => p.part === "habit") ??
    photos.find((p) => p.part === "leaf") ??
    photos[0];
  const sameFamilyPlants = plants.filter(
    (p) => p.familySlug === plant.familySlug && p.slug !== plant.slug
  );

  const sameGenusPlants = plants.filter(
    (p) => p.genusSlug === plant.genusSlug && p.slug !== plant.slug
  );

  const comparePairs = getPairsForPlant(generateComparePairs(), plant.slug);

  const usage = toList(plant.usage);
  // 分类名称（纲/目/科/属）不作为识别标签显示
  const taxa = [plant.division, plant.className, plant.order, plant.family, plant.genus];
  const featureTags = toList(plant.tags).filter(
    (t) => !taxa.includes(t) && !/[纲目科属]$/.test(t)
  );
  // 同科中不同属的植物（同属的单独列出）
  const otherFamilyPlants = sameFamilyPlants.filter((p) => p.genusSlug !== plant.genusSlug);

  // 识别要点：叶、花、果、树皮，没有内容的不显示
  const keyRows = [
    { label: "叶片", value: plant.leaf },
    { label: "花", value: plant.flower },
    { label: "果实 / 种子", value: plant.fruit },
    { label: "树皮", value: plant.bark },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
  // buildIdentificationText 前几条与上面的字段重复，只保留后面基于标签的提示
  const identifyTips = buildIdentificationText(plant).slice(keyRows.length);
  const seasonTexts = buildSeasonText(plant);
  const usageTexts = buildUsageText(plant);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    ...articleMeta(photos.map((p) => p.updated)),
    headline: `${plant.nameCn}（${plant.nameLatin}）`,
    description: `${plant.nameCn}的植物识别、分类谱系和形态特征介绍。`,
    url: `https://plantatlasworld.com/plant/${plant.slug}`,
    about: {
      "@type": "Thing",
      name: plant.nameCn,
      alternateName: [plant.nameLatin, ...plant.aliases],
    },
    image: photos.map((p) =>
      buildImageObjectJsonLd(
        p,
        plant,
        `https://plantatlasworld.com/plant/${plant.slug}`
      )
    ),
  };

  return (
    <AtlasLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[...taxonomyCrumbs(plant, "genus"), { name: plant.nameCn }]}
      />

      <h1>{plant.nameCn}</h1>
      <p className="latin">{plant.nameLatin}</p>
      {plant.aliases.length > 0 && (
        <p className="plant-aliases">
          别名：{plant.aliases.join("、")}
        </p>
      )}

      <div className="plant-facts">
        <Link href={`/family/${plant.familySlug}`} className="plant-fact">
          {plant.family}
        </Link>
        <Link href={`/genus/${plant.genusSlug}`} className="plant-fact">
          {plant.genus}
        </Link>
        {plant.habit && <span className="plant-fact">{plant.habit}</span>}
        {photos.length > 0 && (
          <a href="#plant-photos" className="plant-fact plant-fact-photo">
            {photos.length} 张实拍
          </a>
        )}
      </div>

      {heroPhoto && (
        <div className="plant-hero-image">
          <Image
            src={heroPhoto.src}
            alt={buildPhotoAlt(heroPhoto, plant)}
            width={heroPhoto.width}
            height={heroPhoto.height}
            sizes="(max-width: 980px) 100vw, 70vw"
            preload
          />
        </div>
      )}

      <p className="plant-intro">{buildPlantIntro(plant)}</p>

      {(keyRows.length > 0 || identifyTips.length > 0) && (
        <>
          <h2>如何识别{plant.nameCn}</h2>
          {keyRows.length > 0 && (
            <dl className="plant-keys">
              {keyRows.map((row) => (
                <div key={row.label} className="plant-key">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {identifyTips.length > 0 && (
            <ul className="plant-tips">
              {identifyTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
        </>
      )}

      <h2 id="plant-photos">{plant.nameCn}各部位图片</h2>
      <div className="photo-gallery plant-part-gallery">
        {shownParts.map((part) => {
          const partPhotos = photos.filter((p) => p.part === part.slug);
          return (
            <div key={part.slug}>
              {partPhotos.length > 0 ? (
                <>
                  <PhotoFigure
                    photo={partPhotos[0]}
                    plant={plant}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    showTags={false}
                  />
                  <Link
                    href={`/plant/${plant.slug}/${part.slug}`}
                    className="link"
                  >
                    {plant.nameCn}
                    {part.noun}图片（{partPhotos.length}张）›
                  </Link>
                </>
              ) : (
                <PartPlaceholder partSlug={part.slug} plantName={plant.nameCn} />
              )}
            </div>
          );
        })}
      </div>
      {photos.length > 0 && <AdSlot />}

      {comparePairs.length > 0 && (
        <>
          <h2>{plant.nameCn}和哪些植物容易混淆</h2>
          <ul className="plant-link-chips">
            {comparePairs.map((pair) => {
              const other = pair.plantA.slug === plant.slug ? pair.plantB : pair.plantA;
              return (
                <li key={pair.slug}>
                  <Link href={`/compare/${pair.slug}`} className="plant-link-chip">
                    <strong>{other.nameCn}</strong>
                    <span>看区别 ›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {sameGenusPlants.length > 0 && (
        <>
          <h2>同属的其他植物</h2>
          <ul className="plant-link-chips">
            {sameGenusPlants.slice(0, 12).map((p) => (
              <li key={p.slug}>
                <Link href={`/plant/${p.slug}`} className="plant-link-chip">
                  <strong>{p.nameCn}</strong>
                  <span>{p.nameLatin}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {otherFamilyPlants.length > 0 && (
        <>
          <h2>{plant.family}的其他植物</h2>
          <ul className="plant-link-chips">
            {otherFamilyPlants.slice(0, 12).map((p) => (
              <li key={p.slug}>
                <Link href={`/plant/${p.slug}`} className="plant-link-chip">
                  <strong>{p.nameCn}</strong>
                  <span>{p.genus}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>{plant.nameCn}是什么植物</h2>
      <div className="lineage-horizontal">
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
      <p>
        {plant.nameCn}是{plant.division}中{plant.family}
        {plant.genus}的植物
        {plant.habit ? `，生活型为${plant.habit}` : ""}。
        在<Link href="/lineage" className="link">谱系地图</Link>
        中可以看到它和同科、同属植物的关系。
      </p>

      {seasonTexts.length > 0 && (
        <>
          <h2>季节变化与观察时间</h2>
          {seasonTexts.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </>
      )}

      {(plant.environment || usageTexts.length > 0 || usage.length > 0) && (
        <>
          <h2>生长环境与常见用途</h2>
          {plant.environment && (
            <p>
              {plant.nameCn}的生长环境特点是：{plant.environment}。
            </p>
          )}
          {usageTexts.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
          {usage.length > 0 && (
            <div className="photo-tags plant-usage">
              {usage.map((item) => (
                <span key={item} className="photo-tag">
                  {item}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {featureTags.length > 0 && (
        <>
          <h2>识别标签</h2>
          <div className="photo-tags">
            {featureTags.map((tag) => (
              <span key={tag} className="photo-tag">
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
    </AtlasLayout>
  );
}