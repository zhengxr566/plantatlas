import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/app/components/AdSlot";
import Breadcrumb from "@/app/components/Breadcrumb";
import JsonLd from "@/app/components/JsonLd";
import TaxonPath from "@/app/components/TaxonPath";
import { loadPlants } from "@/lib/loadPlants";
import { absoluteUrl, loadPhotos } from "@/lib/loadPhotos";
import { copyrightNotice, IMAGE_LICENSE_URL } from "@/lib/imageRights";
import {
  SITE_URL,
  getJaPlant,
  jaPlantAlternates,
  jaPlantPath,
  jaPlants,
  partJa,
  photoAltJa,
  photoMetaJa,
} from "@/lib/ja";

// 日本語の内容を書いた植物だけを公開する（それ以外は 404）
export const dynamicParams = false;

export function generateStaticParams() {
  return jaPlants.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

// 写真は部位の順に並べる（全体の姿 → 葉 → 花 → 果実 → 樹皮…）
const PART_ORDER = ["habit", "leaf", "flower", "fruit", "cone", "seed", "bark", "branch", "bud", "autumn"];

function plantData(slug: string) {
  const ja = getJaPlant(slug);
  const base = loadPlants().find((p) => p.slug === slug);
  if (!ja || !base) return null;
  const photos = loadPhotos()
    .filter((p) => p.plant === slug)
    .sort((a, b) => PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part));
  return { ja, base, photos };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = plantData(slug);
  if (!data) return {};
  const { ja, photos } = data;
  const url = `${SITE_URL}${jaPlantPath(slug)}`;
  const image = photos[0] ? absoluteUrl(photos[0].src) : undefined;
  return {
    title: ja.title,
    description: ja.description,
    alternates: jaPlantAlternates(slug),
    openGraph: {
      title: ja.title,
      description: ja.description,
      url,
      siteName: "Plant Atlas World",
      locale: "ja_JP",
      type: "article",
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function JaPlantPage({ params }: Props) {
  const { slug } = await params;
  const data = plantData(slug);
  if (!data) notFound();
  const { ja, base, photos } = data;
  const url = `${SITE_URL}${jaPlantPath(slug)}`;
  const hero = photos.find((p) => p.part === "habit") ?? photos.find((p) => p.part === "leaf") ?? photos[0];
  const gallery = photos.filter((p) => p !== hero);

  // 同じ科・目の植物を先に
  const others = jaPlants
    .filter((p) => p.slug !== slug)
    .sort((a, b) => Number(b.family === ja.family) - Number(a.family === ja.family));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ja.title,
    description: ja.description,
    inLanguage: "ja",
    url,
    dateModified: [ja.updated, ...photos.map((p) => p.updated)].filter(Boolean).sort().at(-1),
    author: { "@type": "Organization", name: "Plant Atlas World", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Plant Atlas World", url: SITE_URL },
    about: {
      "@type": "Thing",
      name: ja.name,
      alternateName: [ja.kanji, base.nameLatin, ...ja.aliases],
    },
    image: photos.map((p) => ({
      "@type": "ImageObject",
      contentUrl: absoluteUrl(p.src),
      caption: photoAltJa(p, ja, base.nameLatin),
      width: p.width,
      height: p.height,
      creditText: p.author,
      copyrightNotice: copyrightNotice({ author: p.author, date: p.date }),
      license: IMAGE_LICENSE_URL,
      acquireLicensePage: IMAGE_LICENSE_URL,
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { name: "植物図鑑", href: "/ja" },
          { name: ja.family },
          { name: ja.name },
        ]}
      />

      <h1>
        {ja.name}
        <span className="ja-kanji">（{ja.kanji}）</span>
      </h1>
      <p className="latin">{base.nameLatin}</p>
      {ja.aliases.length > 0 && <p className="plant-aliases">別名：{ja.aliases.join("、")}</p>}

      <div className="plant-facts">
        <span className="plant-fact">{ja.family}</span>
        <span className="plant-fact">{ja.genus}</span>
        <span className="plant-fact">{ja.habit}</span>
        {photos.length > 0 && (
          <a href="#photos" className="plant-fact plant-fact-photo">
            実物写真 {photos.length} 枚
          </a>
        )}
      </div>

      {hero && (
        <figure className="plant-hero-image ja-hero">
          <Image
            src={hero.src}
            alt={photoAltJa(hero, ja, base.nameLatin)}
            width={hero.width}
            height={hero.height}
            sizes="(max-width: 980px) 100vw, 820px"
            preload
          />
          <figcaption className="photo-credit">
            {photoAltJa(hero, ja, base.nameLatin)}
          </figcaption>
        </figure>
      )}

      {ja.lead.map((text) => (
        <p key={text} className="plant-intro">
          {text}
        </p>
      ))}

      <h2>{ja.name}の見分け方</h2>
      <dl className="plant-keys">
        {ja.points.map((row) => (
          <div key={row.label} className="plant-key">
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>

      {photos.length > 0 && (
        <>
          <h2 id="photos">{ja.name}の写真</h2>
          <p className="muted ja-note">
            すべて当サイトで撮影した写真です。クリックすると大きな画像で表示されます。
          </p>
          <div className="photo-gallery ja-gallery">
            {(gallery.length > 0 ? gallery : photos).map((photo) => (
              <figure key={photo.id} className="photo-figure" id={photo.id}>
                <a href={photo.src} target="_blank" rel="noopener">
                  <Image
                    src={photo.src}
                    alt={photoAltJa(photo, ja, base.nameLatin)}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </a>
                <figcaption>
                  <span className="photo-caption">
                    {ja.name}の{partJa(photo.part, ja)}
                  </span>
                  <span className="photo-credit">
                    {photoMetaJa(photo)}
                    {photoMetaJa(photo) && " · "}© {photo.author}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <AdSlot label="広告" />
        </>
      )}

      {ja.similar.length > 0 && (
        <>
          <h2>{ja.name}に似ている植物との違い</h2>
          <dl className="plant-keys ja-similar">
            {ja.similar.map((s) => (
              <div key={s.name} className="plant-key">
                <dt>{s.slug && getJaPlant(s.slug) ? <Link href={jaPlantPath(s.slug)} className="link">{s.name}</Link> : s.name}</dt>
                <dd>{s.text}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <h2>季節ごとの見どころ</h2>
      <dl className="plant-keys ja-seasons">
        {ja.seasons.map((s) => (
          <div key={s.label} className="plant-key">
            <dt>{s.label}</dt>
            <dd>{s.text}</dd>
          </div>
        ))}
      </dl>

      <h2>どこで見られる？</h2>
      <p>{ja.where}</p>

      <h2>分類</h2>
      <TaxonPath steps={[{ name: "植物界" }, ...ja.lineage.map((name) => ({ name })), { name: ja.name }]} />
      <p>
        {ja.name}（<i>{base.nameLatin}</i>）は{ja.family}{ja.genus}の{ja.habit}です。分類はDNAの解析にもとづく最新の体系（被子植物はAPG IV）に従っています。
        ほかの植物との系統関係は
        <Link href="/lineage" className="link" hrefLang="zh-CN">
          系統図（中国語版）
        </Link>
        で確認できます。
      </p>

      {ja.notes.length > 0 && (
        <>
          <h2>名前の由来・豆知識</h2>
          <ul className="plant-tips">
            {ja.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      )}

      {others.length > 0 && (
        <>
          <h2>ほかの植物の見分け方</h2>
          <ul className="plant-link-chips">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={jaPlantPath(p.slug)} className="plant-link-chip">
                  <strong>{p.name}</strong>
                  <span>{p.family}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="muted ja-updated">
        最終更新：{ja.updated.replace(/-/g, "/")} ·{" "}
        <Link href={`/plant/${slug}`} hrefLang="zh-CN" lang="zh-CN" className="link">
          中文版
        </Link>
      </p>
    </>
  );
}
