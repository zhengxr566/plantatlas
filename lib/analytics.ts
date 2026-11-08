// Google Analytics 4：在 Vercel 环境变量中设置 NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX 后启用。
// 只在生产环境统计（本地 npm run dev 和后台操作不会计入）。
import { sendGAEvent } from "@next/third-parties/google";

export const GA_ID =
  process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_GA_ID : undefined;

// 记录自定义事件；GA 未启用时什么都不做
export function track(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!GA_ID) return;
  sendGAEvent("event", name, params);
}
