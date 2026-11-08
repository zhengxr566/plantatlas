import { plantParts } from "@/data/parts";
import { adminRoute } from "@/lib/admin/route";
import { readCompareRows, readPhotoRows, readTagGroups } from "@/lib/admin/store";
import { generateComparePairs } from "@/lib/generateComparePairs";
import { loadPlants } from "@/lib/loadPlants";

export const GET = adminRoute(async () => ({
  plants: loadPlants().map((p) => ({
    slug: p.slug,
    nameCn: p.nameCn,
    nameLatin: p.nameLatin,
    family: p.family,
    division: p.division,
    className: p.className,
  })),
  parts: plantParts,
  tagGroups: readTagGroups(),
  photos: readPhotoRows(),
  compareNotes: readCompareRows(),
  pairs: generateComparePairs().map((p) => ({
    slug: p.slug,
    title: p.title,
    plantA: p.plantA.slug,
    plantB: p.plantB.slug,
    sources: p.sources,
    indexable: p.indexable,
    parts: p.partOverlaps.map((o) => o.part),
  })),
}));
