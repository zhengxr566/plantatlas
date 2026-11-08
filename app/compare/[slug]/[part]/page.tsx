import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";
import { articleMeta } from "@/lib/structuredData";
import Breadcrumb from "@/app/components/Breadcrumb";
import PartCompare, { describePartDifference } from "@/app/components/PartCompare";
import AdSlot from "@/app/components/AdSlot";
import { isSuggestionEnabled } from "@/lib/suggestions";
import { getPart } from "@/data/parts";
import {
  findComparePair,
  generateComparePairs,
} from "@/lib/generateComparePairs";
import {
  absoluteUrl,
  buildImageObjectJsonLd,
  groupPhotosByPlant,
  loadPhotos,
} from "@/lib/loadPhotos";
import type { Plant } from "@/lib/loadPlants";

type Params = Promise<{ slug: string; part: string }>;

// 部位对应 plants.csv 中的文字描述字段
const PART_FIELD: Record<string, keyof Plant> = {
  leaf: "leaf",
  autumn: "leaf",
  flower: "flower",
  fruit: "fruit",
  cone: "fruit",
  seed: "fruit",
  bark: "bark",
  habit: "habit",
};

function resolve(slug: string, partSlug: string) {
  const part = getPart(partSlug);
  const [slugA, slugB] = slug.split("-vs-");
  if (!part || !slugA || !slugB) return null;

  const pair = findComparePair(generateComparePairs(), slugA, slugB);
  if (!pair || !pair.partOverlaps.some((o) => o.part === partSlug)) return null;

  const photosByPlant = groupPhotosByPlant(loadPhotos());
  const photosA = photosByPlant.get(pair.plantA.slug) ?? [];
  const photosB = photosByPlant.get(pair.plantB.slug) ?? [];

  return { part, pair, photosA, photosB };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, part: partSlug } = await params;
  const data = resolve(slug, partSlug);
  if (!data) return { title: "植物对比｜Plant Atlas World" };

  const { part, pair, photosA, photosB } = data;
  const { plantA, plantB } = pair;
  const title = `${plantA.nameCn}${part.noun}和${plantB.nameCn}${part.noun}的区别｜实拍图片对比`;
  const description = `${plantA.nameCn}和${plantB.nameCn}的${part.noun}怎么区分？${describePartDifference(part.slug, plantA, photosA.filter((p) => p.part === part.slug), plantB, photosB.filter((p) => p.part === part.slug)).text}`.slice(0, 160);
  const url = `https://plantatlasworld.com/compare/${pair.slug}/${part.slug}`;
  const firstPhoto = [...photosA, ...photosB].find((p) => p.part === part.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images: firstPhoto
        ? [{ url: absoluteUrl(firstPhoto.src), width: firstPhoto.width, height: firstPhoto.height }]
        : [],
    },
  };
}

export default async function PartComparePage({ params }: { params: Params }) {
  const { slug, part: partSlug } = await params;
  const data = resolve(slug, partSlug);
  if (!data) notFound();

  const { part, pair, photosA, photosB } = data;
  if (pair.slug !== slug) permanentRedirect(`/compare/${pair.slug}/${part.slug}`);

  const { plantA, plantB } = pair;
  const field = PART_FIELD[part.slug];
  const otherParts = pair.partOverlaps
    .map((o) => getPart(o.part))
    .filter((p) => p && p.slug !== part.slug);
  const url = `https://plantatlasworld.com/compare/${pair.slug}/${part.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${plantA.nameCn}${part.noun}和${plantB.nameCn}${part.noun}的区别`,
    about: [plantA.nameCn, plantB.nameCn],
    mainEntityOfPage: url,
    ...articleMeta(
      [...photosA, ...photosB].filter((p) => p.part === part.slug).map((p) => p.updated)
    ),
    image: [
      ...photosA
        .filter((p) => p.part === part.slug)
        .map((p) => buildImageObjectJsonLd(p, plantA, url)),
      ...photosB
        .filter((p) => p.part === part.slug)
        .map((p) => buildImageObjectJsonLd(p, plantB, url)),
    ],
  };

  return (
    <AtlasLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[{ name: "首页", href: "/" }, { name: "植物对比", href: "/compare" }, { name: `${plantA.nameCn} vs ${plantB.nameCn}`, href: `/compare/${pair.slug}` }, { name: part.nameCn }]}
      />

      <h1>
        {plantA.nameCn}
        {part.noun}和{plantB.nameCn}
        {part.noun}的区别
      </h1>

      <PartCompare
        partSlug={part.slug}
        plantA={plantA}
        photosA={photosA}
        plantB={plantB}
        photosB={photosB}
        pairSlug={pair.slug}
        maxPhotos={6}
        headingLevel="h2"
        preload
        suggestable={isSuggestionEnabled()}
      />

      {field && (plantA[field] || plantB[field]) && (
        <>
          <h2>图鉴描述</h2>
          <ul>
            <li>
              <Link href={`/plant/${plantA.slug}`} className="link">
                {plantA.nameCn}
              </Link>
              ：{String(plantA[field] || "暂无描述")}
            </li>
            <li>
              <Link href={`/plant/${plantB.slug}`} className="link">
                {plantB.nameCn}
              </Link>
              ：{String(plantB[field] || "暂无描述")}
            </li>
          </ul>
        </>
      )}

      <AdSlot />

      <h2>继续对比其他部位</h2>
      <ul>
        <li>
          <Link href={`/compare/${pair.slug}`} className="link">
            {plantA.nameCn}和{plantB.nameCn}的区别（完整对比）
          </Link>
        </li>
        {otherParts.map((p) => (
          <li key={p!.slug}>
            <Link href={`/compare/${pair.slug}/${p!.slug}`} className="link">
              {plantA.nameCn}
              {p!.noun}和{plantB.nameCn}
              {p!.noun}的区别
            </Link>
          </li>
        ))}
        <li>
          <Link href={`/plant/${plantA.slug}/${part.slug}`} className="link">
            {plantA.nameCn}
            {part.noun}图片
          </Link>
        </li>
        <li>
          <Link href={`/plant/${plantB.slug}/${part.slug}`} className="link">
            {plantB.nameCn}
            {part.noun}图片
          </Link>
        </li>
      </ul>
    </AtlasLayout>
  );
}
