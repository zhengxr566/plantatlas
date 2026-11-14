import type { Metadata } from "next";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_ID } from "@/lib/analytics";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/adsense";
import "../globals.css";

// 日本語版のルートレイアウト（<html lang="ja">）。中文版は app/(zh)/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://plantatlasworld.com"),
  title: "Plant Atlas World 植物図鑑",
  description: "身近な植物の見分け方を、実際に撮影した写真と分類（APG体系）で解説する植物図鑑。",
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export default function JaRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
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
      <body className="min-h-full flex flex-col ja">
        <header className="site-header ja-header">
          <Link href="/ja" className="brand">
            <span className="brand-en">Plant Atlas World</span>
            <span className="brand-cn">植物図鑑</span>
          </Link>
          <nav className="header-nav" aria-label="メインナビゲーション">
            <Link href="/ja#plants" className="header-link">
              植物一覧
            </Link>
            <Link href="/ja/about" className="header-link">
              このサイトについて
            </Link>
          </nav>
          <Link href="/" className="ja-lang" hrefLang="zh-CN" lang="zh-CN">
            中文
          </Link>
        </header>

        <main className="page ja-page">
          <article className="document-panel ja-panel">{children}</article>
        </main>

        <footer className="site-footer">
          <Link href="/ja">植物一覧</Link>
          <span>·</span>
          <Link href="/ja/about">このサイトについて</Link>
          <span>·</span>
          <Link href="/image-license" hrefLang="zh-CN">
            画像の利用について（中国語）
          </Link>
          <span>·</span>
          <Link href="/privacy" hrefLang="zh-CN">
            プライバシーポリシー（中国語）
          </Link>
          <span>·</span>
          <Link href="/" hrefLang="zh-CN" lang="zh-CN">
            中文版
          </Link>
        </footer>
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
