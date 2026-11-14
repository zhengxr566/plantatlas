import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_ID } from "@/lib/analytics";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/adsense";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://plantatlasworld.com"),
  title: "Plant Atlas World",
  description: "植物谱系与识别图谱数据库",
  other: { "google-adsense-account": ADSENSE_CLIENT },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <head>
        <meta
          name="google-site-verification"
          content="StOAJFm8UlsHTmQGEnWgTPaOfByWQA7EG2ZZjZL_Mik"
        />
        {/* AdSense 要求放在 <head> 中的原始代码（next/script 会加 data-nscript 属性，AdSense 不支持） */}
        {ADS_ENABLED && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>

      <body className="min-h-full flex flex-col">
        {children}
      </body>
      {/* 页面浏览（含站内跳转）由 GA4 的“增强型衡量”自动记录 */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
