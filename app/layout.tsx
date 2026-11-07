import type { Metadata } from "next";
import Script from "next/script";
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
    </html>
  );
}
