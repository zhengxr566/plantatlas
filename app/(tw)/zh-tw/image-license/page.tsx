import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import { about } from "@/data/about";
import { DEFAULT_PHOTO_AUTHOR } from "@/lib/imageRights";
import { pageLanguages } from "@/lib/i18n";
import { loadPhotos } from "@/lib/loadPhotos";
import { SITE_URL, TW_IMAGE_LICENSE_URL } from "@/lib/tw";

const TITLE = "圖片授權｜Plant Atlas World 植物圖鑑";
const DESCRIPTION =
  "Plant Atlas World 植物實拍照片的著作權說明、可免費使用的範圍，以及商業使用的申請方式。也可提供原始解析度圖片，或依需求拍攝指定植物與部位。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: TW_IMAGE_LICENSE_URL,
    languages: pageLanguages({ zh: "/image-license", ja: "/ja/image-license", tw: "/zh-tw/image-license" }),
  },
};

export default function TwImageLicense() {
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
          url: TW_IMAGE_LICENSE_URL,
          inLanguage: "zh-Hant-TW",
          isPartOf: { "@type": "WebSite", name: "Plant Atlas World", url: SITE_URL },
        }}
      />
      <h1>圖片授權</h1>
      <p>
        本站的植物照片全部由經營者實地拍攝，按葉、花、果實、樹皮、樹形等部位整理，並標註名稱、學名和辨識重點。目前共有 {photos.length} 張照片、涵蓋 {plantCount} 種植物，持續增加中。
      </p>

      <h2>著作權</h2>
      <p>
        除另有註明外，照片著作權屬於 {DEFAULT_PHOTO_AUTHOR}，保留一切權利。每張圖片檔案中都寫入了作者、著作權聲明和本頁網址（EXIF / IPTC 資訊）。
      </p>

      <h2>不必申請即可使用的情況</h2>
      <p>下列非商業用途可以直接使用：</p>
      <ul className="plant-tips">
        <li>個人學習、自然觀察筆記</li>
        <li>學校課堂和非營利的自然觀察、科普活動</li>
        <li>非商業的個人部落格、社群網站分享</li>
      </ul>
      <p>使用時請遵守：</p>
      <ul className="plant-tips">
        <li>
          註明出處並連結到照片所在頁面，例如：<code>圖片：{DEFAULT_PHOTO_AUTHOR}（plantatlasworld.com）</code>
        </li>
        <li>請勿刪除或修改圖片中的作者和著作權資訊</li>
        <li>請勿單獨販售圖片、上傳到圖庫，或當作自己的作品發表</li>
      </ul>

      <h2>需要授權的情況</h2>
      <ul className="plant-tips">
        <li>企業或商業網站、廣告和行銷素材</li>
        <li>書籍、雜誌、教材等出版品</li>
        <li>App、軟體、遊戲和商品包裝</li>
        <li>AI 或機器學習資料集（包括訓練和評估）</li>
        <li>需要原始解析度圖片（網站上為長邊 1600 像素的壓縮版本）</li>
      </ul>
      <p>除了單張授權，也可以提供成套的部位比較照片，或依需求拍攝指定植物、部位和季節。</p>

      <h2>申請方式</h2>
      <p>
        請來信 <strong>{about.contact}</strong>，並說明：
      </p>
      <ol>
        <li>照片所在頁面的網址（可以多張）</li>
        <li>用途，以及刊登的媒介和範圍（網站、印刷數量、地區等）</li>
        <li>使用期間，是否需要原始解析度圖片</li>
      </ol>

      <p className="muted ja-note">
        個人資料與 Cookie 的處理方式，請見
        <Link href="/zh-tw/privacy" className="link">
          隱私權政策
        </Link>
        。
      </p>
    </>
  );
}
