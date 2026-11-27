import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/data/about";
import { pageLanguages } from "@/lib/i18n";
import { SITE_URL } from "@/lib/tw";

const TITLE = "隱私權政策｜Plant Atlas World 植物圖鑑";
const DESCRIPTION =
  "Plant Atlas World 的隱私權政策：流量分析（Google Analytics）、廣告（Google AdSense）與 Cookie，以及照片中個人資訊的處理方式。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/zh-tw/privacy`,
    languages: pageLanguages({ zh: "/privacy", ja: "/ja/privacy", tw: "/zh-tw/privacy" }),
  },
};

export default function TwPrivacy() {
  return (
    <>
      <h1>隱私權政策</h1>
      <p>以下說明 Plant Atlas World（plantatlasworld.com，以下稱「本站」）如何處理個人資料與使用者資訊。</p>

      <h2>蒐集的資訊</h2>
      <p>
        本站不需要註冊，也不會主動蒐集姓名、電子郵件等個人資料。伺服器和流量分析工具可能記錄瀏覽時間、瀏覽頁面、瀏覽器類型等匿名資訊，用於改善網站內容。
      </p>

      <h2>流量分析（Google Analytics）</h2>
      <p>
        本站使用 Google Analytics 4 了解使用狀況。Google Analytics 會透過 Cookie 蒐集匿名統計資料，不包含可識別個人的資訊。資料由 Google 管理，詳見
        <a href="https://policies.google.com/technologies/partner-sites?hl=zh-TW" className="link" rel="noopener">
          Google 如何使用合作夥伴網站或應用程式的資訊
        </a>
        。如不希望被統計，可以安裝
        <a href="https://tools.google.com/dlpage/gaoptout?hl=zh-TW" className="link" rel="noopener">
          Google Analytics 不透露資訊瀏覽器外掛程式
        </a>
        ，或在瀏覽器中停用 Cookie。
      </p>

      <h2>廣告（Google AdSense）與 Cookie</h2>
      <p>
        本站使用第三方廣告服務 Google AdSense。Google 等第三方廣告商可能使用 Cookie，根據您造訪本站及其他網站的紀錄放送廣告。您可以在
        <a href="https://adssettings.google.com/?hl=zh-TW" className="link" rel="noopener">
          Google 廣告設定
        </a>
        中關閉個人化廣告，或前往
        <a href="https://www.aboutads.info/" className="link" rel="noopener">
          www.aboutads.info
        </a>
        了解如何停用第三方 Cookie。
      </p>

      <h2>標籤建議功能</h2>
      <p>
        訪客可以不必註冊，為照片建議新增或修正辨識標籤。我們會保存所選的標籤、選填的補充說明、送出時間，以及經過單向雜湊處理（無法還原）的 IP 位址；IP 位址只用於限制短時間內重複送出。建議經人工審核後才會反映在網站上，審核後即刪除。請勿在補充說明中填寫個人資料。
      </p>

      <h2>照片中的個人資訊</h2>
      <p>
        本站照片拍攝於公園、街道等公共場所，以植物為主體。若照片中出現可辨識的人臉、車牌等個人資訊，會在刊登前打上馬賽克；照片檔案中的 GPS 位置等拍攝資訊也會在上傳時移除。
        如您認為某張照片涉及您的個人資訊，請透過下方電子郵件聯絡，我們會儘速處理或刪除。
      </p>

      <h2>照片著作權</h2>
      <p>
        除另有註明外，本站照片均由經營者拍攝，著作權屬於 Plant Atlas World。使用規則請見
        <Link href="/zh-tw/image-license" className="link">
          圖片授權
        </Link>
        。
      </p>

      <h2>聯絡我們</h2>
      <p>
        關於本政策、個人資料或照片的問題，請來信 <strong>{about.contact}</strong>。
      </p>

      <h2>政策修訂</h2>
      <p>本政策可能隨網站功能調整而修訂，修訂後的內容將公布於本頁。</p>
      <p className="muted ja-updated">最後更新：2026 年 11 月 27 日</p>
    </>
  );
}
