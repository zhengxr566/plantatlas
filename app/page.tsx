import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { identifyPages } from "@/data/identify";
import { getPart } from "@/data/parts";
import { loadPlants } from "@/lib/loadPlants";
import { buildPhotoAlt, loadPhotos } from "@/lib/loadPhotos";
import { identifyCovers, latestPhotos, photoByPlant } from "@/lib/photoPicks";
import { generateComparePairs } from "@/lib/generateComparePairs";
import AtlasLayout from "@/app/components/AtlasLayout";
import JsonLd from "@/app/components/JsonLd";
import PhotoCard from "@/app/components/PhotoCard";
import { siteJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = {
  title: "植物谱系图谱｜植物识别、分类与常见植物对比",
  description:
    "Plant Atlas World 提供常见木本植物识别、植物分类谱系、科属关系和相似植物对比，帮助用户通过叶片、花、果实、树皮和生长习性判断植物。",
  alternates: {
    canonical: "https://plantatlasworld.com",
  },
  openGraph: {
    title: "植物谱系图谱｜植物识别、分类与常见植物对比",
    description:
      "按现代植物分类（APG IV）组织植物信息，提供植物识别、相似植物对比和谱系关系查询。",
    url: "https://plantatlasworld.com",
    siteName: "Plant Atlas World",
    type: "website",
  },
};

export default function Home() {
  const plants = loadPlants();
  const photos = loadPhotos();
  const comparePairs = generateComparePairs();

  // 首页大图：最新的实拍，每种植物一张
  const heroPhotos = latestPhotos(photos, plants, 4, true);
  const recentPhotos = latestPhotos(photos, plants, 8);
  const plantPhoto = photoByPlant(photos);
  const photoPlantCount = plantPhoto.size;

  // 识别入口：用匹配植物中最符合主题的实拍做封面，有图的排在前面
  const identifyCards = identifyCovers(identifyPages.slice(0, 12), plants, photos).sort((a, b) => Number(Boolean(b.cover)) - Number(Boolean(a.cover)));

  const plantsWithPhotos = plants.filter((p) => plantPhoto.has(p.slug));
  const otherPlants = plants.filter((p) => !plantPhoto.has(p.slug)).slice(0, 60);
  const featuredComparePairs = comparePairs.slice(0, 15);

  return (
    <AtlasLayout>
      <JsonLd data={siteJsonLd()} />

      <section className={heroPhotos.length > 0 ? "home-hero" : "home-hero home-hero-text-only"}>
        <div className="home-hero-text">
          <h1>植物谱系图谱</h1>
          <p>
            Plant Atlas World 是一个以植物分类关系为核心的植物识别与谱系图谱网站。
            本站从常见木本植物开始，按现代植物分类（被子植物采用 APG IV 演化支）组织植物信息，
            并通过叶片、花、果实、树皮、生长环境和相似植物对比，帮助用户判断植物。
          </p>
          <div className="home-hero-actions">
            <Link href="/identify" className="home-hero-button home-hero-button-primary">
              按特征识别植物
            </Link>
            <Link href="/compare" className="home-hero-button">
              相似植物对比
            </Link>
            <Link href="/lineage" className="home-hero-button">
              谱系地图
            </Link>
          </div>
          <p className="home-hero-stats">
            已收录 <strong>{plants.length}</strong> 种植物
            {photos.length > 0 && (
              <>
                {" · "}
                <strong>{photos.length}</strong> 张实拍图，覆盖 <strong>{photoPlantCount}</strong> 种
              </>
            )}
          </p>
        </div>

        {heroPhotos.length > 0 && (
          <div className={`home-hero-mosaic home-hero-mosaic-${heroPhotos.length}`}>
            {heroPhotos.map(({ photo, plant }, i) => (
              <Link key={photo.id} href={`/plant/${plant.slug}`} className="home-hero-tile">
                <Image
                  src={photo.src}
                  alt={buildPhotoAlt(photo, plant)}
                  width={photo.width}
                  height={photo.height}
                  sizes={i === 0 ? "(max-width: 768px) 100vw, 360px" : "(max-width: 768px) 33vw, 180px"}
                  preload={i === 0}
                />
                <span className="home-hero-tile-label">
                  {plant.nameCn} · {getPart(photo.part)?.nameCn}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p>
        如果你只知道植物的外观，可以从植物识别页面开始；如果你想区分两个相似植物，
        可以查看植物对比页面；如果你已经知道植物名称，可以进入对应植物页查看科属关系、
        近缘植物和谱系位置。
      </p>

      {recentPhotos.length > 0 && (
        <>
          <h2>最新实拍</h2>
          <p>
            本站图片均为实地拍摄，按叶片、花、果实、树皮、树形等部位整理，
            点击可以查看同一部位的相似植物对比。
          </p>
          <div className="photo-card-grid">
            {recentPhotos.map(({ photo, plant }) => (
              <PhotoCard
                key={photo.id}
                href={`/plant/${plant.slug}/${photo.part}`}
                title={plant.nameCn}
                subtitle={photo.tags.slice(0, 2).join("、") || plant.nameLatin}
                badge={getPart(photo.part)?.nameCn}
                photo={photo}
                plant={plant}
              />
            ))}
          </div>
        </>
      )}

      <h2>植物识别</h2>
      <p>
        按照叶形、花色、果实、季节变化和常见生长环境查找植物，
        适合用于初步判断路边、公园、校园和庭院中常见的木本植物。
      </p>

      <div className="photo-card-grid">
        {identifyCards.map(({ page, cover, count }) => (
          <PhotoCard
            key={page.slug}
            href={`/identify/${page.slug}`}
            title={page.title}
            subtitle={`${count} 种植物 · ${page.description}`}
            photo={cover?.photo}
            plant={cover?.plant}
          />
        ))}
      </div>
      <p>
        <Link href="/identify" className="link">
          浏览全部植物识别 ›
        </Link>
      </p>

      <h2>常见植物对比</h2>
      <p>
        很多植物在不开花、幼树阶段或秋冬季容易被混淆。
        对比页面会从分类位置、叶片、花、果实、树皮和生长习性等角度说明区别，
        帮助快速识别相似植物。
      </p>

      <ul>
        {featuredComparePairs.map((item) => (
          <li key={item.slug}>
            <Link href={`/compare/${item.slug}`} className="link">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <p>
        <Link href="/compare" className="link">
          浏览全部植物对比 ›
        </Link>
      </p>

      <h2>常见木本植物</h2>
      <p>
        以下收录常见乔木、灌木和园林植物。每个植物页面包含中文名、拉丁学名、
        分类位置、近缘植物、同科植物、同属植物和常见对比关系。
      </p>

      {plantsWithPhotos.length > 0 && (
        <div className="photo-card-grid">
          {plantsWithPhotos.map((plant) => (
            <PhotoCard
              key={plant.slug}
              href={`/plant/${plant.slug}`}
              title={plant.nameCn}
              subtitle={`${plant.nameLatin} · ${plant.family}`}
              photo={plantPhoto.get(plant.slug)}
              plant={plant}
            />
          ))}
        </div>
      )}

      <ul>
        {otherPlants.map((plant) => (
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

      <p className="meta">
        当前共收录 {plants.length} 种植物，更多植物可通过科属页面、识别页面和对比页面继续浏览。
      </p>
    </AtlasLayout>
  );
}
