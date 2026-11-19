import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import { about } from "@/data/about";
import { DEFAULT_PHOTO_AUTHOR, IMAGE_LICENSE_URL } from "@/lib/imageRights";
import { JA_IMAGE_LICENSE_URL, SITE_URL } from "@/lib/ja";
import { loadPhotos } from "@/lib/loadPhotos";

const TITLE = "画像の利用について｜Plant Atlas World 植物図鑑";
const DESCRIPTION =
  "Plant Atlas World に掲載している植物写真の著作権、無料で使える範囲、商用利用の申請方法について説明します。高解像度の元画像の提供や、特定の植物・部位の撮影のご相談も受け付けています。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: JA_IMAGE_LICENSE_URL,
    languages: { "zh-CN": IMAGE_LICENSE_URL, ja: JA_IMAGE_LICENSE_URL, "x-default": IMAGE_LICENSE_URL },
  },
};

export default function JaImageLicense() {
  const photos = loadPhotos();
  const plantCount = new Set(photos.map((p) => p.plant)).size;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: JA_IMAGE_LICENSE_URL,
          inLanguage: "ja",
          isPartOf: { "@type": "WebSite", name: "Plant Atlas World", url: SITE_URL },
        }}
      />
      <h1>画像の利用について</h1>
      <p>
        当サイトの植物写真は、すべて運営者が実際に撮影したオリジナルです。葉・花・果実・樹皮・樹形などの部位ごとに整理し、和名・学名と見分けのポイントを添えて掲載しています。
        現在 {plantCount} 種、{photos.length} 枚の写真を公開しており、順次追加しています。
      </p>

      <h2>著作権</h2>
      <p>
        特に記載のない限り、写真の著作権は {DEFAULT_PHOTO_AUTHOR} に帰属し、すべての権利を留保しています。
        各画像ファイルには、作成者、著作権表示、このページの URL を埋め込んでいます（EXIF / IPTC 情報）。
      </p>

      <h2>許可なく使える場合</h2>
      <p>次のような非営利の目的であれば、申請なしで利用できます。</p>
      <ul className="plant-tips">
        <li>個人の学習や自然観察の記録</li>
        <li>学校の授業や、非営利の自然観察会・学習会</li>
        <li>非営利の個人ブログや SNS での紹介</li>
      </ul>
      <p>利用する際は、次の点を守ってください。</p>
      <ul className="plant-tips">
        <li>
          出典として、写真が掲載されているページへのリンクを付けてください（例：<code>写真：{DEFAULT_PHOTO_AUTHOR}（plantatlasworld.com）</code>）
        </li>
        <li>画像に埋め込まれた作成者や著作権の情報を削除・改変しないでください</li>
        <li>画像単体での販売、素材サイトへのアップロード、自分の作品としての公開はしないでください</li>
      </ul>

      <h2>許可が必要な場合</h2>
      <p>次の目的で利用する場合は、事前にご連絡ください。</p>
      <ul className="plant-tips">
        <li>企業や商用サイト、広告・販促物</li>
        <li>書籍、雑誌、教材などの出版物</li>
        <li>アプリ、ソフトウェア、ゲーム、商品パッケージ</li>
        <li>AI・機械学習のデータセット（学習・評価を含む）</li>
        <li>高解像度の元画像が必要な場合（サイト上の画像は長辺 1600 ピクセルに縮小しています）</li>
      </ul>
      <p>1 枚単位のほか、部位ごとの比較写真のセット提供や、植物・部位・季節を指定した撮影のご相談も受け付けています。</p>

      <h2>申請方法</h2>
      <p>
        メール（<strong>{about.contact}</strong>）で、次の内容をお知らせください。日本語で大丈夫です。
      </p>
      <ol>
        <li>利用したい写真が掲載されているページの URL（複数可）</li>
        <li>利用目的と、掲載媒体・範囲（ウェブサイト、印刷部数、地域など）</li>
        <li>利用期間と、高解像度画像が必要かどうか</li>
      </ol>

      <p className="muted ja-note">
        個人情報と Cookie の取り扱いについては
        <Link href="/ja/privacy" className="link">
          プライバシーポリシー
        </Link>
        をご覧ください。
      </p>
    </>
  );
}
