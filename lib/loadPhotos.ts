import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { getPart, plantParts } from "@/data/parts";

export const SITE_URL = "https://plantatlasworld.com";
export const DEFAULT_PHOTO_AUTHOR = "Plant Atlas World";
export const DEFAULT_PHOTO_LICENSE = "All rights reserved";

export type PlantPhoto = {
  // public/photos 下的相对路径，例如 ginkgo-biloba/leaf-01.jpg
  file: string;
  // 去掉扩展名的路径，用作锚点和 key
  id: string;
  src: string;
  plant: string;
  part: string;
  tags: string[];
  caption: string;
  season: string;
  location: string;
  date: string;
  author: string;
  license: string;
  width: number;
  height: number;
};

function splitList(value?: string): string[] {
  return (value || "")
    .split(/[|、,，]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function loadPhotos(): PlantPhoto[] {
  const filePath = path.join(process.cwd(), "data", "photos.csv");
  if (!fs.existsSync(filePath)) return [];

  const rows = parse(fs.readFileSync(filePath, "utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rows
    .filter((row) => row.file && row.plant && getPart(row.part))
    .map((row) => ({
      file: row.file,
      id: row.file.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-"),
      src: `/photos/${row.file}`,
      plant: row.plant,
      part: row.part,
      tags: splitList(row.tags),
      caption: row.caption || "",
      season: row.season || "",
      location: row.location || "",
      date: row.date || "",
      author: row.author || DEFAULT_PHOTO_AUTHOR,
      license: row.license || DEFAULT_PHOTO_LICENSE,
      width: Number(row.width) || 1200,
      height: Number(row.height) || 900,
    }));
}

export function groupPhotosByPlant(photos: PlantPhoto[]) {
  const map = new Map<string, PlantPhoto[]>();
  photos.forEach((photo) => {
    const list = map.get(photo.plant) ?? [];
    list.push(photo);
    map.set(photo.plant, list);
  });
  return map;
}

// 按 parts.ts 的顺序返回某植物有照片的部位
export function getPhotoParts(photos: PlantPhoto[]) {
  return plantParts.filter((part) => photos.some((p) => p.part === part.slug));
}

export function getPartTags(photos: PlantPhoto[], part: string) {
  return Array.from(
    new Set(photos.filter((p) => p.part === part).flatMap((p) => p.tags))
  );
}

export function absoluteUrl(src: string) {
  return `${SITE_URL}${encodeURI(src)}`;
}

export function buildPhotoAlt(
  photo: PlantPhoto,
  plant: { nameCn: string; nameLatin?: string }
) {
  const part = getPart(photo.part);
  const detail = photo.caption || photo.tags.slice(0, 3).join("、");
  return [
    `${plant.nameCn}${part?.noun ?? ""}`,
    plant.nameLatin ? `（${plant.nameLatin}）` : "",
    detail ? `：${detail}` : "",
  ].join("");
}

export function buildImageObjectJsonLd(
  photo: PlantPhoto,
  plant: { nameCn: string; nameLatin?: string },
  pageUrl: string
) {
  return {
    "@type": "ImageObject",
    contentUrl: absoluteUrl(photo.src),
    url: pageUrl,
    name: buildPhotoAlt(photo, plant),
    caption: buildPhotoAlt(photo, plant),
    width: photo.width,
    height: photo.height,
    creator: { "@type": "Person", name: photo.author },
    creditText: photo.author,
    copyrightNotice: `© ${photo.author}`,
    license: `${SITE_URL}/privacy#image-license`,
    acquireLicensePage: `${SITE_URL}/privacy#image-license`,
    ...(photo.date ? { dateCreated: photo.date } : {}),
    ...(photo.location ? { contentLocation: photo.location } : {}),
  };
}
