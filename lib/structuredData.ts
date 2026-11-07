import type { Plant } from "@/lib/loadPlants";

export const SITE_URL = "https://plantatlasworld.com";
export const SITE_NAME = "Plant Atlas World";

export type Crumb = { name: string; href?: string };

const organization = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
};

export function breadcrumbJsonLd(items: Crumb[]) {
  // Google 要求除最后一项外都必须有链接，没有页面的中间项（如“裸子植物”）只在页面上显示
  const linked = items.filter((item, i) => item.href || i === items.length - 1);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: linked.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };
}

// Article 的作者、发布者和（有真实日期时的）更新日期
export function articleMeta(dates: string[] = []) {
  const latest = dates.filter(Boolean).sort().at(-1);
  return {
    author: organization,
    publisher: organization,
    ...(latest ? { dateModified: latest } : {}),
  };
}

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: "植物谱系世界",
        url: SITE_URL,
        inLanguage: "zh-CN",
      },
      { ...organization, logo: `${SITE_URL}/favicon.ico` },
    ],
  };
}

// 首页 › 类群 › 纲 › 目 › 科 › 属，到 depth 为止
export function taxonomyCrumbs(
  plant: Plant,
  depth: "class" | "order" | "family" | "genus"
): Crumb[] {
  const levels: Crumb[] = [
    { name: plant.className, href: plant.classSlug ? `/class/${plant.classSlug}` : undefined },
    { name: plant.order, href: plant.orderSlug ? `/order/${plant.orderSlug}` : undefined },
    { name: plant.family, href: `/family/${plant.familySlug}` },
    { name: plant.genus, href: `/genus/${plant.genusSlug}` },
  ];
  const count = { class: 1, order: 2, family: 3, genus: 4 }[depth];
  return [{ name: "首页", href: "/" }, { name: plant.division }, ...levels.slice(0, count)];
}
