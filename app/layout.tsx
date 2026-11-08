import type { Metadata } from "next";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_ID } from "@/lib/analytics";
import "./globals.css";

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL("https://plantatlasworld.com"),
  title: "Plant Atlas World",
  description: "植物谱系与识别图谱数据库",
  ...(adsenseClient ? { other: { "google-adsense-account": adsenseClient } } : {}),
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
      </head>

      <body className="min-h-full flex flex-col">
        {children}
        {adsenseClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
      {/* 页面浏览（含站内跳转）由 GA4 的“增强型衡量”自动记录 */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
