import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/app/components/AdSlot";
import Breadcrumb from "@/app/components/Breadcrumb";
import JsonLd from "@/app/components/JsonLd";
import { getPart } from "@/data/parts";
import { copyrightNotice } from "@/lib/imageRights";
import { plantAlternates } from "@/lib/i18n";
import { loadPlants } from "@/lib/loadPlants";
import { absoluteUrl, loadPhotos, photoCreator, type PlantPhoto } from "@/lib/loadPhotos";
import {
  SITE_URL,
  TW_IMAGE_LICENSE_URL,
  getTwPlant,
  hasTwPlant,
  toTw,
  twName,
  twPlantPath,
  twPlantSlugs,
  type TwPlant,
} from "@/lib/tw";

// 只公開有繁體內容的植物（其餘 404）
export const dynamicParams = false;

export function generateStaticParams() {
  return twPlantSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

const PART_ORDER = ["habit", "leaf", "flower", "fruit", "cone", "seed", "bark", "branch", "bud", "autumn"];
const SEASON_TW: Record<string, string> = { 春季: "春", 夏季: "夏", 秋季: "秋", 冬季: "冬" };
const PLACE_TW: Record<string, string> = { 东京: "東京", 東京: "東京" };

function partName(part: string) {
  return toTw(getPart(part)?.nameCn ?? part);
}

function photoAlt(photo: PlantPhoto, plant: TwPlant) {
  const where = [PLACE_TW[photo.location], SEASON_TW[photo.season]].filter(Boolean).join("・");
  return `${plant.name}的${partName(photo.part)}（${plant.latin}）${where ? `｜攝於${where}` : ""}`;
}

function photosOf(slug: string) {
  return loadPhotos()
    .filter((p) => p.plant === slug)
    .sort((a, b) => PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tw = getTwPlant(slug);
  if (!tw) return {};
  const photos = photosOf(slug);
  const url = `${SITE_URL}${twPlantPath(slug)}`;
  return {
    title: tw.title,
    description: tw.description,
    alternates: plantAlternates(slug, "zh-TW"),
    openGraph: {
      title: tw.title,
      description: tw.description,
      url,
      siteName: "Plant Atlas World",
      locale: "zh_TW",
      type: "article",
      ...(photos[0] ? { images: [absoluteUrl(photos[0].src)] } : {}),
    },
  };
}

export default async function TwPlantPage({ params }: Props) {
  const { slug } = await params;
  const tw = getTwPlant(slug);
  if (!tw) notFound();
  const plants = loadPlants();
  const base = plants.find((p) => p.slug === slug)!;
  const photos = photosOf(slug);
  const url = `${SITE_URL}${twPlantPath(slug)}`;
  const hero = photos.find((p) => p.part === "habit") ?? photos.find((p) => p.part === "leaf") ?? photos[0];
  const gallery = photos.filter((p) => p !== hero);

  // 同科的植物排前面
  const others = twPlantSlugs()
    .filter((s) => s !== slug)
    .map((s) => plants.find((p) => p.slug === s)!)
    .sort((a, b) => Number(b.familySlug === base.familySlug) - Number(a.familySlug === base.familySlug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tw.title,
    description: tw.description,
    inLanguage: "zh-Hant-TW",
    url,
    dateModified: [tw.updated, ...photos.map((p) => p.updated)].filter(Boolean).sort().at(-1),
    author: { "@type": "Organization", name: "Plant Atlas World", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Plant Atlas World", url: SITE_URL },
    about: { "@type": "Thing", name: tw.name, alternateName: [tw.latin, ...tw.aliases] },
    image: photos.map((p) => ({
      "@type": "ImageObject",
      contentUrl: absoluteUrl(p.src),
      caption: photoAlt(p, tw),
      width: p.width,
      height: p.height,
      creator: photoCreator(p.author),
      creditText: p.author,
      copyrightNotice: copyrightNotice({ author: p.author, date: p.date }),
      license: TW_IMAGE_LICENSE_URL,
      acquireLicensePage: TW_IMAGE_LICENSE_URL,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "植物圖鑑", href: "/zh-tw" }, { name: tw.family }, { name: tw.name }]} />

      <h1>{tw.name}</h1>
      <p className="latin">{tw.latin}</p>
      {tw.aliases.length > 0 && <p className="plant-aliases">別名：{tw.aliases.join("、")}</p>}

      <div className="plant-facts">
        <span className="plant-fact">{tw.family}</span>
        <span className="plant-fact">{tw.genus}</span>
        {tw.habit && <span className="plant-fact">{tw.habit}</span>}
        {photos.length > 0 && (
          <a href="#photos" className="plant-fact plant-fact-photo">
            實拍照片 {photos.length} 張
          </a>
        )}
      </div>

      {hero && (
        <figure className="plant-hero-image ja-hero">
          <Image
            src={hero.src}
            alt={photoAlt(hero, tw)}
            width={hero.width}
            height={hero.height}
            sizes="(max-width: 980px) 100vw, 820px"
            preload
          />
          <figcaption className="photo-credit">{photoAlt(hero, tw)}</figcaption>
        </figure>
      )}

      {tw.lead.map((text) => (
        <p key={text} className="plant-intro">
          {text}
        </p>
      ))}

      <h2>如何辨識{tw.name}</h2>
      <dl className="plant-keys">
        {tw.points.map((row) => (
          <div key={row.label} className="plant-key">
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>

      {photos.length > 0 && (
        <>
          <h2 id="photos">{tw.name}的照片</h2>
          <p className="muted ja-note">所有照片皆為本站實地拍攝，點擊可看大圖。</p>
          <div className="photo-gallery ja-gallery">
            {(gallery.length > 0 ? gallery : photos).map((photo) => (
              <figure key={photo.id} className="photo-figure" id={photo.id}>
                <a href={photo.src} target="_blank" rel="noopener">
                  <Image
                    src={photo.src}
                    alt={photoAlt(photo, tw)}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </a>
                <figcaption>
                  <span className="photo-caption">
                    {tw.name}的{partName(photo.part)}
                  </span>
                  <span className="photo-credit">
                    {[SEASON_TW[photo.season], PLACE_TW[photo.location], photo.date].filter(Boolean).join(" · ")}
                    {(photo.season || photo.location || photo.date) && " · "}© {photo.author}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <AdSlot label="廣告" />
        </>
      )}

      {tw.similar.length > 0 && (
        <>
          <h2>{tw.name}和相似植物的區別</h2>
          <dl className="plant-keys">
            {tw.similar.map((s) => (
              <div key={s.name} className="plant-key">
                <dt>
                  {s.slug && hasTwPlant(s.slug) ? (
                    <Link href={twPlantPath(s.slug)} className="link">
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

      <h2>四季看點</h2>
      <dl className="plant-keys">
        {tw.seasons.map((s) => (
          <div key={s.label} className="plant-key">
            <dt>{s.label}</dt>
            <dd>{s.text}</dd>
          </div>
        ))}
      </dl>

      <h2>在哪裡看得到</h2>
      <p>{tw.where}</p>

      {tw.notes.length > 0 && (
        <>
          <h2>小知識</h2>
          <ul className="plant-tips">
            {tw.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      )}

      <h2>分類</h2>
      <p>
        {tw.name}（<i>{tw.latin}</i>）是{tw.family}
        {tw.genus}的{tw.habit || "植物"}。分類依據現代分子親緣分類（被子植物採用 APG IV）。
      </p>

      {others.length > 0 && (
        <>
          <h2>其他植物的辨識方法</h2>
          <ul className="plant-link-chips">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={twPlantPath(p.slug)} className="plant-link-chip">
                  <strong>{twName(p)}</strong>
                  <span>{toTw(p.family)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="muted ja-updated">
        最後更新：{tw.updated.replace(/-/g, "/")} ·{" "}
        <Link href={`/plant/${slug}`} hrefLang="zh-CN" lang="zh-CN" className="link">
          简体中文版
        </Link>
      </p>
    </>
  );
}
