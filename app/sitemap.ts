import type { MetadataRoute } from "next";
import { identifyPages } from "@/data/identify";
import { loadPlants } from "@/lib/loadPlants";
import { generateComparePairs } from "@/lib/generateComparePairs";
import {
  absoluteUrl,
  getPhotoParts,
  groupPhotosByPlant,
  loadPhotos,
} from "@/lib/loadPhotos";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://plantatlasworld.com";

  const plants = loadPlants();
  // 只提交可收录的对比页（有实拍图对比或手写要点）
  const comparePairs = generateComparePairs().filter((p) => p.indexable);
  const photosByPlant = groupPhotosByPlant(loadPhotos());

  function photoUrls(plantSlug: string, parts?: string[]) {
    return (photosByPlant.get(plantSlug) ?? [])
      .filter((p) => !parts || parts.includes(p.part))
      .map((p) => absoluteUrl(p.src));
  }

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
      images: photoUrls(p.slug),
    })),

    ...plants.flatMap((p) =>
      getPhotoParts(photosByPlant.get(p.slug) ?? []).map((part) => ({
        url: `${baseUrl}/plant/${p.slug}/${part.slug}`,
        lastModified: new Date(),
        priority: 0.75,
        images: photoUrls(p.slug, [part.slug]),
      }))
    ),

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

    ...comparePairs.map((p) => {
      const parts = p.partOverlaps.map((o) => o.part);
      return {
        url: `${baseUrl}/compare/${p.slug}`,
        lastModified: new Date(),
        priority: 0.85,
        images: [
          ...photoUrls(p.plantA.slug, parts),
          ...photoUrls(p.plantB.slug, parts),
        ],
      };
    }),

    ...comparePairs.flatMap((p) =>
      p.partOverlaps.map((o) => ({
        url: `${baseUrl}/compare/${p.slug}/${o.part}`,
        lastModified: new Date(),
        priority: 0.8,
        images: [
          ...photoUrls(p.plantA.slug, [o.part]),
          ...photoUrls(p.plantB.slug, [o.part]),
        ],
      }))
    ),

    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      priority: 0.2,
    },
  ];
}