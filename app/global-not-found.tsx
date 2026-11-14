import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// 网址不存在时的 404（中文版和日语版有各自的根布局，所以单独定义）
export const metadata: Metadata = {
  title: "404｜Plant Atlas World",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="zh-CN">
      <body>
        <main className="page">
          <article className="document-panel not-found-panel">
            <h1>找不到这个页面</h1>
            <p>页面可能已经移动或删除。</p>
            <p>
              <Link href="/" className="link">返回首页</Link>
            </p>
            <p lang="ja">
              ページが見つかりません。 <Link href="/ja" className="link">日本語版トップへ</Link>
            </p>
          </article>
        </main>
      </body>
    </html>
  );
}
