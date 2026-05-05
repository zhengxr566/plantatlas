import { plants } from "@/data/plants";
import { comparePairs } from "@/data/comparePairs";
import { identifyPages } from "@/data/identify";

export default function sitemap() {
  const baseUrl = "https://plantatlasworld.com";

  // 植物页
  const plantUrls = plants.map((p) => ({
    url: `${baseUrl}/plant/${p.slug}`,
  }));

  // 对比页
  const compareUrls = comparePairs.map((c) => ({
    url: `${baseUrl}/compare/${c.slug}`,
  }));

  // 识别页（🔥 新增重点）
  const identifyUrls = identifyPages.map((i) => ({
    url: `${baseUrl}/identify/${i.slug}`,
  }));

  return [
    {
      url: baseUrl,
    },
    ...plantUrls,
    ...compareUrls,
    ...identifyUrls,
  ];
}