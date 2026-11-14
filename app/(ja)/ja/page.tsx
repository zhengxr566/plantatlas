import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import { loadPhotos } from "@/lib/loadPhotos";
import { loadPlants } from "@/lib/loadPlants";
import { HOME_ALTERNATES, SITE_URL, jaPlantPath, jaPlants, photoAltJa } from "@/lib/ja";

const TITLE = "身近な植物の見分け方図鑑｜実物写真と分類でわかる｜Plant Atlas World";
const DESCRIPTION =
  "イチョウ、イロハモミジ、ケヤキ、クスノキ、ウメなど、公園や街路で出会う植物の見分け方を、東京で撮影した実物写真と最新の分類（APG IV）で解説。似ている植物との違いや季節の見どころもまとめています。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/ja`, languages: HOME_ALTERNATES },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/ja`,
    siteName: "Plant Atlas World",
    locale: "ja_JP",
    type: "website",
  },
};

// 木（高木・低木）と草花に分けて並べる。写真のある植物を先に
export default function JaHome() {
  const plants = loadPlants();
  const photos = loadPhotos();
  const cards = jaPlants
    .map((ja) => {
      const base = plants.find((p) => p.slug === ja.slug);
      const own = photos.filter((p) => p.plant === ja.slug);
      const cover = own.find((p) => p.part === "habit") ?? own.find((p) => p.part === "leaf") ?? own[0];
      return { ja, latin: base?.nameLatin ?? "", cover, count: own.length };
    })
    .sort((a, b) => b.count - a.count);
  const groups = [
    { title: "樹木", items: cards.filter((c) => !c.ja.habit.includes("草")) },
    { title: "草花", items: cards.filter((c) => c.ja.habit.includes("草")) },
  ].filter((g) => g.items.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Plant Atlas World 植物図鑑",
    url: `${SITE_URL}/ja`,
    inLanguage: "ja",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <h1>身近な植物の見分け方図鑑</h1>
      <p className="plant-intro">
        公園や街路樹、庭先で見かける植物を、実際に撮影した写真と最新の分類にもとづいて紹介する図鑑です。
        葉・花・実・樹皮のどこを見れば見分けられるのか、よく似た植物とどこが違うのかを、観察する人の目線でまとめています。
      </p>
      <ul className="ja-features">
        <li>
          <strong>実物写真</strong>
          <span>東京の公園や街で撮影したオリジナル写真。部位ごとに整理しています。</span>
        </li>
        <li>
          <strong>似た植物との違い</strong>
          <span>オオモミジとイロハモミジ、クヌギとクリなど、間違えやすい組み合わせを比較。</span>
        </li>
        <li>
          <strong>最新の分類</strong>
          <span>DNA解析にもとづくAPG IV分類体系で、植物どうしの関係がわかります。</span>
        </li>
      </ul>

      <h2 id="plants">植物一覧</h2>
      {groups.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <ul className="ja-cards">
            {group.items.map(({ ja, latin, cover, count }) => (
              <li key={ja.slug}>
                <Link href={jaPlantPath(ja.slug)} className="ja-card">
                  {cover ? (
                    <Image
                      src={cover.src}
                      alt={photoAltJa(cover, ja, latin)}
                      width={cover.width}
                      height={cover.height}
                      sizes="(max-width: 600px) 50vw, 240px"
                    />
                  ) : (
                    <span className="ja-card-empty" aria-hidden="true">
                      {ja.kanji.slice(0, 1)}
                    </span>
                  )}
                  <span className="ja-card-body">
                    <strong>
                      {ja.name}
                      <small>（{ja.kanji}）</small>
                    </strong>
                    <em>{latin}</em>
                    <span>
                      {ja.family} · {ja.habit}
                      {count > 0 && ` · 写真${count}枚`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="muted ja-note">
        日本語版は順次追加しています。現在の掲載数は{jaPlants.length}種です。中国語版では{plants.length}種の植物と系統図を公開しています（
        <Link href="/" hrefLang="zh-CN" lang="zh-CN" className="link">
          中文版
        </Link>
        ）。
      </p>
    </>
  );
}
