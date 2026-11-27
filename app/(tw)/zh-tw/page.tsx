import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import { HOME_ALTERNATES } from "@/lib/ja";
import { loadPhotos } from "@/lib/loadPhotos";
import { loadPlants } from "@/lib/loadPlants";
import { SITE_URL, getTwPlant, twPlantPath, twPlantSlugs } from "@/lib/tw";

const TITLE = "身邊植物辨識圖鑑｜實拍照片與現代分類｜Plant Atlas World";
const DESCRIPTION =
  "銀杏、雞爪槭、櫸、山茶、紫薇……公園和行道樹上常見的植物怎麼分辨？用實地拍攝的照片和現代分類（APG IV），整理每種植物的辨識重點、相似植物的區別和四季看點。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/zh-tw`, languages: HOME_ALTERNATES },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/zh-tw`,
    siteName: "Plant Atlas World",
    locale: "zh_TW",
    type: "website",
  },
};

export default function TwHome() {
  const plants = loadPlants();
  const photos = loadPhotos();
  const cards = twPlantSlugs()
    .map((slug) => {
      const tw = getTwPlant(slug)!;
      const own = photos.filter((p) => p.plant === slug);
      const cover = own.find((p) => p.part === "habit") ?? own.find((p) => p.part === "leaf") ?? own[0];
      return { tw, cover, count: own.length };
    })
    .sort((a, b) => b.count - a.count);
  const groups = [
    { title: "樹木", items: cards.filter((c) => !c.tw.habit.includes("草")) },
    { title: "草花", items: cards.filter((c) => c.tw.habit.includes("草")) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Plant Atlas World 植物圖鑑",
          url: `${SITE_URL}/zh-tw`,
          inLanguage: "zh-Hant-TW",
        }}
      />
      <h1>身邊植物辨識圖鑑</h1>
      <p className="plant-intro">
        公園、行道樹和庭院裡常見的植物，該看葉子、花、果實還是樹皮才分得出來？和長得很像的植物差在哪裡？
        本站用實地拍攝的照片，加上現代分子親緣分類，一種一種整理辨識重點。
      </p>
      <ul className="ja-features">
        <li>
          <strong>實拍照片</strong>
          <span>所有照片都是本站在公園和街頭實地拍攝，按葉、花、果、樹皮等部位整理。</span>
        </li>
        <li>
          <strong>相似植物比較</strong>
          <span>山茶和茶梅、麻櫟和栓皮櫟……把容易搞混的植物放在一起比較。</span>
        </li>
        <li>
          <strong>現代分類</strong>
          <span>依據 DNA 研究的 APG IV 分類系統，看懂植物之間的親緣關係。</span>
        </li>
      </ul>

      <h2 id="plants">植物列表</h2>
      {groups.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <ul className="ja-cards">
            {group.items.map(({ tw, cover, count }) => (
              <li key={tw.slug}>
                <Link href={twPlantPath(tw.slug)} className="ja-card">
                  {cover ? (
                    <Image
                      src={cover.src}
                      alt={`${tw.name}（${tw.latin}）`}
                      width={cover.width}
                      height={cover.height}
                      sizes="(max-width: 600px) 50vw, 240px"
                    />
                  ) : (
                    <span className="ja-card-empty" aria-hidden="true">
                      {tw.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="ja-card-body">
                    <strong>{tw.name}</strong>
                    <em>{tw.latin}</em>
                    <span>
                      {tw.family} · {tw.habit}
                      {count > 0 && ` · 照片 ${count} 張`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="muted ja-note">
        繁體中文版陸續增加中，目前收錄 {cards.length} 種。簡體中文版收錄 {plants.length} 種植物和完整的植物譜系圖（
        <Link href="/" hrefLang="zh-CN" lang="zh-CN" className="link">
          简体中文版
        </Link>
        ）。
      </p>
    </>
  );
}
