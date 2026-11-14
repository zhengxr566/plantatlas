import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/data/about";
import { SITE_URL } from "@/lib/ja";

const TITLE = "このサイトについて｜Plant Atlas World 植物図鑑";
const DESCRIPTION =
  "Plant Atlas World は、東京で撮影した植物の写真と最新の分類体系をもとに、身近な植物の見分け方を紹介する個人運営の植物図鑑です。運営者、写真、情報の確認方法について説明します。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/ja/about`,
    languages: { "zh-CN": `${SITE_URL}/about`, ja: `${SITE_URL}/ja/about`, "x-default": `${SITE_URL}/about` },
  },
};

export default function JaAbout() {
  return (
    <>
      <h1>このサイトについて</h1>
      <p className="plant-intro">
        Plant Atlas World（プラント・アトラス・ワールド）は、身近な植物の見分け方を、実際に撮影した写真と分類体系にもとづいて紹介する植物図鑑です。
        {about.startedYear}年に中国語版を公開し、日本語版を少しずつ追加しています。
      </p>

      <h2>運営者</h2>
      <p>
        運営・撮影：{about.authorName}（東京在住）。仕事の合間に、公園や街路、日常生活の中で出会う植物を撮影している植物愛好家です。
        専門の研究者ではないため、同定や記述には慎重を期し、誤りに気づいた場合は随時修正しています。
      </p>

      <h2>写真について</h2>
      <ul className="plant-tips">
        <li>掲載している写真は、すべて運営者が東京で撮影したオリジナルです。</li>
        <li>写真は葉・花・果実・樹皮などの部位ごとに整理し、撮影日と季節を記録しています。</li>
        <li>人物の顔や車のナンバープレートなどの個人情報が写り込んだ場合は、モザイク処理をしてから掲載しています。</li>
        <li>
          写真の無断転載はご遠慮ください。利用条件は
          <Link href="/image-license" hrefLang="zh-CN" className="link">
            画像の利用について（中国語）
          </Link>
          をご覧ください。
        </li>
      </ul>

      <h2>情報の確認方法</h2>
      <p>
        植物の分類は、DNAの解析にもとづく被子植物の分類体系 APG IV に従っています。形態や分布、名前の由来などの記述は、植物図鑑や公的機関・植物園の公開資料、百科事典を参照し、実物の観察と照らし合わせて書いています。
        日本語版の各ページは機械翻訳ではなく、日本で植物を観察する人に役立つよう、日本語で書き下ろしています。
      </p>

      <h2>お問い合わせ</h2>
      <p>
        記述の誤り、写真の利用、そのほかのお問い合わせは、メール（{about.contact}）までお願いします。日本語でお送りいただいて大丈夫です。
      </p>
    </>
  );
}
