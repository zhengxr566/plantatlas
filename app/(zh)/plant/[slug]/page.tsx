import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import { articleMeta, taxonomyCrumbs } from "@/lib/structuredData";
import TaxonPath from "@/app/components/TaxonPath";
import Image from "next/image";
import PhotoFigure from "@/app/components/PhotoFigure";
import { plantPart, plantParts } from "@/data/parts";
import AdSlot from "@/app/components/AdSlot";
import { getZhPlant } from "@/data/zh/plants";
import { getJaPlant, jaPlantPath, zhPlantAlternates } from "@/lib/ja";
import {
  buildImageObjectJsonLd,
  buildPhotoAlt,
  loadPhotos,
  plantsWithPhotos,
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

// 没有手写内容时的简短介绍：只陈述名称和分类（生长环境在下文单独列出），不再罗列标签
function buildPlantIntro(plant: Plant) {
  return `${plant.nameCn}（${plant.nameLatin}）${aliasClause(plant)}是${plant.family}${plant.genus}的${plant.habit || "植物"}。`;
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

  // 有手写内容时使用手写的标题和说明
  const zh = getZhPlant(plant.slug);
  const title = zh?.title ?? buildPlantTitle(plant);
  const description = zh?.description ?? buildPlantDescription(plant);

  return {
    title,
    description,
    // 有日语版时互相标注 hreflang
    alternates: zhPlantAlternates(plant.slug),
    // 还没有实拍图的植物页只有模板文字：暂不收录，有图后自动恢复
    ...(plantsWithPhotos().has(plant.slug) ? {} : { robots: { index: false, follow: true } }),
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
  const zh = getZhPlant(plant.slug);
  const photos = loadPhotos().filter((p) => p.plant === plant.slug);
  // 只展示有实拍图的部位（不显示“整理中”的空占位）
  const shownParts = plantParts.filter((part) => photos.some((p) => p.part === part.slug));
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    ...articleMeta(photos.map((p) => p.updated)),
    headline: zh?.title ?? `${plant.nameCn}（${plant.nameLatin}）`,
    description: zh?.description ?? `${plant.nameCn}的植物识别、分类谱系和形态特征介绍。`,
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
        {getJaPlant(plant.slug) && (
          <Link href={jaPlantPath(plant.slug)} hrefLang="ja" lang="ja" className="plant-fact plant-fact-lang">
            日本語
          </Link>
        )}
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

      {zh ? (
        zh.lead.map((text) => (
          <p key={text} className="plant-intro">
            {text}
          </p>
        ))
      ) : (
        <p className="plant-intro">{buildPlantIntro(plant)}</p>
      )}

      {/* 识别要点：有手写内容时用手写的，否则用 plants.csv 中的字段 */}
      {(zh ? zh.points.length > 0 : keyRows.length > 0) && (
        <>
          <h2>如何识别{plant.nameCn}</h2>
          <dl className="plant-keys">
            {(zh ? zh.points.map((p) => ({ label: p.label, value: p.text })) : keyRows).map((row) => (
              <div key={row.label} className="plant-key">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {shownParts.length > 0 && (
        <>
          <h2 id="plant-photos">{plant.nameCn}各部位图片</h2>
          <div className="photo-gallery plant-part-gallery">
            {shownParts.map((part) => {
              const partPhotos = photos.filter((p) => p.part === part.slug);
              return (
                <div key={part.slug}>
                  <PhotoFigure
                    photo={partPhotos[0]}
                    plant={plant}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    showTags={false}
                  />
                  <Link href={`/plant/${plant.slug}/${part.slug}`} className="link">
                    {plantPart(plant.nameCn, part.noun)}图片（{partPhotos.length}张）›
                  </Link>
                </div>
              );
            })}
          </div>
          <AdSlot />
        </>
      )}

      {zh && zh.similar.length > 0 && (
        <>
          <h2>{plant.nameCn}和相似植物的区别</h2>
          <dl className="plant-keys">
            {zh.similar.map((s) => (
              <div key={s.name} className="plant-key">
                <dt>
                  {s.slug && plants.some((p) => p.slug === s.slug) ? (
                    <Link href={`/plant/${s.slug}`} className="link">
                      {s.name}
                    </Link>
                  ) : (
                    s.name
                  )}
                </dt>
                <dd>{s.text}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {comparePairs.length > 0 && (
        <>
          <h2>{zh ? `${plant.nameCn}的对比页` : `${plant.nameCn}和哪些植物容易混淆`}</h2>
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
      <TaxonPath steps={[...taxonomyCrumbs(plant, "genus").slice(1), { name: plant.nameCn }]} />
      <p>
        分类依据现代分子系统学（被子植物采用 APG IV）。和其他植物的亲缘关系可以在
        <Link href="/lineage" className="link">谱系地图</Link>
        中查看。
      </p>

      {zh && (
        <>
          <h2>四季看点</h2>
          <dl className="plant-keys">
            {zh.seasons.map((row) => (
              <div key={row.label} className="plant-key">
                <dt>{row.label}</dt>
                <dd>{row.text}</dd>
              </div>
            ))}
          </dl>
          <h2>在哪里能看到</h2>
          <p>{zh.where}</p>
          {zh.notes.length > 0 && (
            <>
              <h2>小知识</h2>
              <ul className="plant-tips">
                {zh.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {!zh && (plant.environment || usage.length > 0) && (
        <>
          <h2>生长环境与用途</h2>
          {plant.environment && <p>{plant.environment}。</p>}
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

      {/* 有手写内容时不再罗列识别标签（内容已在上文） */}
      {!zh && featureTags.length > 0 && (
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