import { loadPlants } from "@/lib/loadPlants";

type ComparePair = {
  slug: string;
  title: string;
};

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[、,，|]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeName(value: unknown): string {
  return String(value || "").trim();
}

function makePairKey(slugA: string, slugB: string) {
  return [slugA, slugB].sort().join("__");
}

export function generateComparePairs(): ComparePair[] {
  const plants = loadPlants();

  const pairs: ComparePair[] = [];
  const seen = new Set<string>();

  const plantsByName = new Map(
    plants.map((plant) => [normalizeName(plant.nameCn), plant])
  );

  plants.forEach((plant) => {
    const similarList = toList(plant.similar);

    similarList.forEach((similarName) => {
      const target = plantsByName.get(normalizeName(similarName));

      if (!target) return;
      if (target.slug === plant.slug) return;

      const pairKey = makePairKey(plant.slug, target.slug);
      if (seen.has(pairKey)) return;

      seen.add(pairKey);

      pairs.push({
        slug: `${plant.slug}-vs-${target.slug}`,
        title: `${plant.nameCn}和${target.nameCn}的区别`,
      });
    });
  });

  return pairs;
}