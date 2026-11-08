import type { MetadataRoute } from "next";
import { identifyPages } from "@/data/identify";
import { loadPlants, type Plant } from "@/lib/loadPlants";
import { generateComparePairs } from "@/lib/generateComparePairs";
import {
  absoluteUrl,
  getPhotoParts,
  groupPhotosByPlant,
  loadPhotos,
  type PlantPhoto,
} from "@/lib/loadPhotos";
import { isTaxonomyIndexable } from "@/lib/taxonomy";

// lastmod 只使用真实日期（图片或手写对比的 updated 列）；没有真实日期时不写，
// 避免每次部署都把所有页面标成“刚更新”，导致 Google 忽略整个 sitemap 的 lastmod
function lastModified(dates: string[]) {
  const latest = dates.filter(Boolean).sort().at(-1);
  return latest ? { lastModified: latest } : {};
}

function photoDates(photos: PlantPhoto[]) {
  return photos.map((p) => p.updated);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://plantatlasworld.com";

  const plants = loadPlants();
  // 只提交可收录的对比页（有实拍图对比或手写要点）
  const comparePairs = generateComparePairs().filter((p) => p.indexable);
  const photosByPlant = groupPhotosByPlant(loadPhotos());

  function photosOf(plantSlug: string, parts?: string[]) {
    return (photosByPlant.get(plantSlug) ?? []).filter(
      (p) => !parts || parts.includes(p.part)
    );
  }

  function photoUrls(plantSlug: string, parts?: string[]) {
    return photosOf(plantSlug, parts).map((p) => absoluteUrl(p.src));
  }

  // 只提交包含至少 2 种植物的分类页（其余为 noindex）
  function taxonomySlugs(key: keyof Plant) {
    const counts = new Map<string, number>();
    plants.forEach((p) => {
      const slug = String(p[key] || "");
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    });
    return [...counts].filter(([, n]) => isTaxonomyIndexable(n)).map(([slug]) => slug);
  }

  return [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/identify`, priority: 0.95 },
    { url: `${baseUrl}/compare`, priority: 0.95 },
    { url: `${baseUrl}/lineage`, priority: 0.9 },

    ...plants.map((p) => ({
      url: `${baseUrl}/plant/${p.slug}`,
      priority: 0.8,
      images: photoUrls(p.slug),
      ...lastModified(photoDates(photosOf(p.slug))),
    })),

    ...plants.flatMap((p) =>
      getPhotoParts(photosOf(p.slug)).map((part) => ({
        url: `${baseUrl}/plant/${p.slug}/${part.slug}`,
        priority: 0.75,
        images: photoUrls(p.slug, [part.slug]),
        ...lastModified(photoDates(photosOf(p.slug, [part.slug]))),
      }))
    ),

    ...taxonomySlugs("classSlug").map((slug) => ({
      url: `${baseUrl}/class/${slug}`,
      priority: 0.68,
    })),

    ...taxonomySlugs("orderSlug").map((slug) => ({
      url: `${baseUrl}/order/${slug}`,
      priority: 0.68,
    })),

    ...taxonomySlugs("familySlug").map((slug) => ({
      url: `${baseUrl}/family/${slug}`,
      priority: 0.75,
    })),

    ...taxonomySlugs("genusSlug").map((slug) => ({
      url: `${baseUrl}/genus/${slug}`,
      priority: 0.7,
    })),

    ...identifyPages.map((p) => ({
      url: `${baseUrl}/identify/${p.slug}`,
      priority: 0.9,
    })),

    // 对比页展示两种植物的全部实拍图
    ...comparePairs.map((p) => {
      const photos = [...photosOf(p.plantA.slug), ...photosOf(p.plantB.slug)];
      return {
        url: `${baseUrl}/compare/${p.slug}`,
        priority: 0.85,
        images: photos.map((photo) => absoluteUrl(photo.src)),
        ...lastModified([...photoDates(photos), p.note?.updated ?? ""]),
      };
    }),

    ...comparePairs.flatMap((p) =>
      p.partOverlaps.map((o) => {
        const photos = [
          ...photosOf(p.plantA.slug, [o.part]),
          ...photosOf(p.plantB.slug, [o.part]),
        ];
        return {
          url: `${baseUrl}/compare/${p.slug}/${o.part}`,
          priority: 0.8,
          images: photos.map((photo) => absoluteUrl(photo.src)),
          ...lastModified(photoDates(photos)),
        };
      })
    ),

    { url: `${baseUrl}/privacy`, priority: 0.2 },
  ];
}
