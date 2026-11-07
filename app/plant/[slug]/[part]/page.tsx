import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import { articleMeta, taxonomyCrumbs } from "@/lib/structuredData";
import PhotoFigure from "@/app/components/PhotoFigure";
import AdSlot from "@/app/components/AdSlot";
import { getPart } from "@/data/parts";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import {
  absoluteUrl,
  buildImageObjectJsonLd,
  getPartTags,
  getPhotoParts,
  loadPhotos,
} from "@/lib/loadPhotos";
import {
  generateComparePairs,
  getPairsForPlant,
} from "@/lib/generateComparePairs";

type Params = Promise<{ slug: string; part: string }>;

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
  const plant = loadPlants().find((p) => p.slug === slug);
  if (!part || !plant) return null;

  const allPhotos = loadPhotos().filter((p) => p.plant === plant.slug);
  const photos = allPhotos.filter((p) => p.part === part.slug);
  if (photos.length === 0) return null;

  return { part, plant, photos, allPhotos };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, part: partSlug } = await params;
  const data = resolve(slug, partSlug);
  if (!data) return { title: "植物图片｜Plant Atlas World" };

  const { part, plant, photos } = data;
  const tags = getPartTags(photos, part.slug);
  const title = `${plant.nameCn}${part.noun}图片｜${plant.nameCn}${part.nameCn}特征与识别`;
  const description = `${photos.length}张${plant.nameCn}（${plant.nameLatin}）${part.noun}实拍图片。${tags.length > 0 ? `识别特征：${tags.join("、")}。` : ""}`;
  const url = `https://plantatlasworld.com/plant/${plant.slug}/${part.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      images: photos.slice(0, 1).map((p) => ({
        url: absoluteUrl(p.src),
        width: p.width,
        height: p.height,
      })),
    },
  };
}

export default async function PlantPartPage({ params }: { params: Params }) {
  const { slug, part: partSlug } = await params;
  const data = resolve(slug, partSlug);
  if (!data) notFound();

  const { part, plant, photos, allPhotos } = data;
  const tags = getPartTags(photos, part.slug);
  const field = PART_FIELD[part.slug];
  const description = field ? String(plant[field] || "") : "";
  const otherParts = getPhotoParts(allPhotos).filter(
    (p) => p.slug !== part.slug
  );
  const confusable = getPairsForPlant(generateComparePairs(), plant.slug)
    .map((pair) => ({
      pair,
      other: pair.plantA.slug === plant.slug ? pair.plantB : pair.plantA,
      overlap: pair.partOverlaps.find((o) => o.part === part.slug),
    }))
    .filter((item) => item.overlap)
    .sort((a, b) => b.overlap!.sharedTags.length - a.overlap!.sharedTags.length);
  const url = `https://plantatlasworld.com/plant/${plant.slug}/${part.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    ...articleMeta(photos.map((p) => p.updated)),
    name: `${plant.nameCn}${part.noun}图片`,
    url,
    about: { "@type": "Thing", name: plant.nameCn, alternateName: plant.nameLatin },
    image: photos.map((p) => buildImageObjectJsonLd(p, plant, url)),
  };

  return (
    <AtlasLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[...taxonomyCrumbs(plant, "genus"), { name: plant.nameCn, href: `/plant/${plant.slug}` }, { name: part.nameCn }]}
      />

      <h1>
        {plant.nameCn}
        {part.noun}图片
      </h1>
      <p className="latin">{plant.nameLatin}</p>

      <p>
        本页收录{photos.length}张{plant.nameCn}
        {part.noun}的实拍照片。
        {description && `图鉴描述：${description}。`}
        {tags.length > 0 &&
          `从照片中可以观察到的识别特征包括${tags.join("、")}。`}
        观察{part.nameCn}时，建议重点看{part.lookFor}。
      </p>

      <div className="photo-gallery">
        {photos.map((photo, i) => (
          <PhotoFigure
            key={photo.id}
            photo={photo}
            plant={plant}
            preload={i === 0}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ))}
      </div>

      <AdSlot />

      {confusable.length > 0 && (
        <>
          <h2>
            容易与{plant.nameCn}
            {part.noun}混淆的植物
          </h2>
          <ul>
            {confusable.map(({ pair, other, overlap }) => (
              <li key={pair.slug}>
                <Link
                  href={`/compare/${pair.slug}/${part.slug}`}
                  className="link"
                >
                  {plant.nameCn}
                  {part.noun}和{other.nameCn}
                  {part.noun}的区别
                </Link>
                {overlap!.sharedTags.length > 0 && (
                  <span className="meta">
                    {" "}
                    · 共同特征：{overlap!.sharedTags.join("、")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {otherParts.length > 0 && (
        <>
          <h2>{plant.nameCn}其他部位图片</h2>
          <ul>
            {otherParts.map((p) => (
              <li key={p.slug}>
                <Link href={`/plant/${plant.slug}/${p.slug}`} className="link">
                  {plant.nameCn}
                  {p.noun}图片
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p>
        <Link href={`/plant/${plant.slug}`} className="link">
          返回{plant.nameCn}图鉴 ›
        </Link>
      </p>
    </AtlasLayout>
  );
}
