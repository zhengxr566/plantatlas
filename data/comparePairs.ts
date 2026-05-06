import { loadPlants } from "@/lib/loadPlants";

type ComparePair = {
  slug: string;
  title: string;
};

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
    const similarList = Array.isArray(plant.similar) ? plant.similar : [];

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