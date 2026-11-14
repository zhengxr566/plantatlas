"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/lib/adsense";

// 发布商 ID 见 lib/adsense.ts。广告单元 ID 在 Vercel 环境变量中配置：
//   NEXT_PUBLIC_ADSENSE_SLOT=1234567890   （AdSense 后台创建的“展示广告”单元 ID）
// 未配置单元 ID 或在本地开发时不渲染任何内容（此时可以用 AdSense 的「自动广告」）。
const client = ADS_ENABLED ? ADSENSE_CLIENT : undefined;
const defaultSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSlot({ slot = defaultSlot, label = "广告" }: { slot?: string; label?: string }) {
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
    <div className="ad-slot" aria-label={label}>
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
