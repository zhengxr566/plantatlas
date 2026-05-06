import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { generateComparePairs } from "@/lib/generateComparePairs";

export default function sitemap() {
  const baseUrl = "https://plantatlasworld.com";
  const plants = loadPlants();
  const comparePairs = generateComparePairs();

  const familySlugs = Array.from(new Set(plants.map((p) => p.familySlug)));
  const genusSlugs = Array.from(new Set(plants.map((p) => p.genusSlug)));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1,
    },
    ...plants.map((p) => ({
      url: `${baseUrl}/plant/${p.slug}`,
      lastModified: new Date(),
      priority: 0.8,
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