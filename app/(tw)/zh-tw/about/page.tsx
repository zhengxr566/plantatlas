import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/data/about";
import { pageLanguages } from "@/lib/i18n";
import { SITE_URL } from "@/lib/tw";

const TITLE = "關於本站｜Plant Atlas World 植物圖鑑";
const DESCRIPTION =
  "Plant Atlas World 是以東京實拍照片和現代分類系統為基礎、介紹身邊植物辨識方法的個人植物圖鑑。說明經營者、照片和資料查證方式。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/zh-tw/about`,
    languages: pageLanguages({ zh: "/about", ja: "/ja/about", tw: "/zh-tw/about" }),
  },
};

export default function TwAbout() {
  return (
    <>
      <h1>關於本站</h1>
      <p className="plant-intro">
        Plant Atlas World 是一個用實拍照片和分類系統介紹身邊植物辨識方法的植物圖鑑。{about.startedYear}
        年開始上線簡體中文版，之後陸續加入日文版和繁體中文版。
      </p>

      <h2>經營者</h2>
      <p>
        經營與拍攝：{about.authorName}，住在東京的植物愛好者，利用工作之餘拍攝公園、街頭和日常生活中遇到的植物。
        並非專業研究人員，因此鑑定和描述力求謹慎，發現錯誤會隨時修正。
      </p>

      <h2>關於照片</h2>
      <ul className="plant-tips">
        <li>站上的照片全部由經營者在東京實地拍攝。</li>
        <li>照片依葉、花、果實、樹皮等部位整理，並記錄拍攝日期和季節。</li>
        <li>照片中如拍到人臉、車牌等個人資訊，會先打馬賽克再刊登。</li>
        <li>
          請勿任意轉載照片，使用規則請見
          <Link href="/zh-tw/image-license" className="link">
            圖片授權
          </Link>
          。
        </li>
      </ul>

      <h2>資料查證方式</h2>
      <p>
        植物分類依據以 DNA 研究為基礎的被子植物分類系統 APG IV。形態、分布和名稱由來等內容，參考植物圖鑑、公家機關與植物園的公開資料及百科全書，並對照實地觀察撰寫。
        繁體中文版以台灣用語和計量單位（公分、公尺）呈現，並補充台灣讀者在台灣能看到的地點與容易混淆的植物。
      </p>

      <h2>聯絡我們</h2>
      <p>內容有誤、照片使用或其他問題，歡迎來信：{about.contact}</p>
    </>
  );
}
