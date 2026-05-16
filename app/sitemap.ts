import type { MetadataRoute } from "next";
import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { generateComparePairs } from "@/lib/generateComparePairs";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://plantatlasworld.com";

  const plants = loadPlants();
  const comparePairs = generateComparePairs();

  const classSlugs = Array.from(
    new Set(plants.map((p) => p.classSlug).filter(Boolean))
  );

  const orderSlugs = Array.from(
    new Set(plants.map((p) => p.orderSlug).filter(Boolean))
  );

  const familySlugs = Array.from(
    new Set(plants.map((p) => p.familySlug).filter(Boolean))
  );

  const genusSlugs = Array.from(
    new Set(plants.map((p) => p.genusSlug).filter(Boolean))
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: `${baseUrl}/identify`,
      lastModified: new Date(),
      priority: 0.95,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      priority: 0.95,
    },

    ...plants.map((p) => ({
      url: `${baseUrl}/plant/${p.slug}`,
      lastModified: new Date(),
      priority: 0.8,
    })),

    ...classSlugs.map((slug) => ({
      url: `${baseUrl}/class/${slug}`,
      lastModified: new Date(),
      priority: 0.68,
    })),

    ...orderSlugs.map((slug) => ({
      url: `${baseUrl}/order/${slug}`,
      lastModified: new Date(),
      priority: 0.68,
    })),

    ...familySlugs.map((slug) => ({
      url: `${baseUrl}/family/${slug}`,
      lastModified: new Date(),
      priority: 0.75,
    })),

    ...genusSlugs.map((slug) => ({
      url: `${baseUrl}/genus/${slug}`,
      lastModified: new Date(),
      priority: 0.7,
    })),

    ...identifyPages.map((p) => ({
      url: `${baseUrl}/identify/${p.slug}`,
      lastModified: new Date(),
      priority: 0.9,
    })),

    ...comparePairs.map((p) => ({
      url: `${baseUrl}/compare/${p.slug}`,
      lastModified: new Date(),
      priority: 0.85,
    })),
  ];
}