import type { Metadata } from "next";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_ID } from "@/lib/analytics";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/adsense";
import "../globals.css";

// 繁體中文版（台灣）的根版面（<html lang="zh-Hant-TW">）。樣式沿用日文版的 .ja 版面
export const metadata: Metadata = {
  metadataBase: new URL("https://plantatlasworld.com"),
  title: "Plant Atlas World 植物圖鑑",
  description: "用實拍照片和現代分類（APG IV）介紹身邊常見植物的辨識方法。",
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export default function TwRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" className="h-full antialiased">
      <head>
        <meta name="google-site-verification" content="StOAJFm8UlsHTmQGEnWgTPaOfByWQA7EG2ZZjZL_Mik" />
        {ADS_ENABLED && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col ja tw">
        <header className="site-header ja-header">
          <Link href="/zh-tw" className="brand">
            <span className="brand-en">Plant Atlas World</span>
            <span className="brand-cn">植物圖鑑</span>
          </Link>
          <nav className="header-nav" aria-label="主選單">
            <Link href="/zh-tw#plants" className="header-link">
              植物列表
            </Link>
            <Link href="/zh-tw/about" className="header-link">
              關於本站
            </Link>
          </nav>
          <span className="ja-langs">
            <Link href="/" className="ja-lang" hrefLang="zh-CN" lang="zh-CN">
              简体
            </Link>
            <Link href="/ja" className="ja-lang" hrefLang="ja" lang="ja">
              日本語
            </Link>
          </span>
        </header>

        <main className="page ja-page">
          <article className="document-panel ja-panel">{children}</article>
        </main>

        <footer className="site-footer">
          <Link href="/zh-tw">植物列表</Link>
          <span>·</span>
          <Link href="/zh-tw/about">關於本站</Link>
          <span>·</span>
          <Link href="/zh-tw/image-license">圖片授權</Link>
          <span>·</span>
          <Link href="/zh-tw/privacy">隱私權政策</Link>
          <span>·</span>
          <Link href="/" hrefLang="zh-CN" lang="zh-CN">
            简体中文
          </Link>
          <span>·</span>
          <Link href="/ja" hrefLang="ja" lang="ja">
            日本語
          </Link>
        </footer>
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
