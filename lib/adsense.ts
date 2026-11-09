// Google AdSense 发布商 ID（公开信息，可以写在代码里；需要更换时用 NEXT_PUBLIC_ADSENSE_CLIENT 覆盖）
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-8372619640631658";

// 只在生产环境加载广告脚本和广告位，本地开发时不请求广告（避免无效流量）
export const ADS_ENABLED = process.env.NODE_ENV === "production";
