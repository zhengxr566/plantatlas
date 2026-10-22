"use client";

import { useEffect } from "react";

// 在 .env.local / Vercel 环境变量中配置：
//   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
//   NEXT_PUBLIC_ADSENSE_SLOT=1234567890   （AdSense 后台创建的“展示广告”单元 ID）
// 未配置时不渲染任何内容。
const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const defaultSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ slot = defaultSlot }: { slot?: string }) {
  useEffect(() => {
    if (!client || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 广告脚本被拦截时忽略
    }
  }, [slot]);

  if (!client || !slot) return null;

  return (
    <div className="ad-slot" aria-label="广告">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
