import { loadPlants } from "@/lib/loadPlants";

export function generateComparePairs() {
  const plants = loadPlants();
  const pairs: { slug: string; title: string }[] = [];
  const seen = new Set<string>();

  plants.forEach((plant) => {
    plant.similar?.forEach((similarName) => {
      const target = plants.find((p) => p.nameCn === similarName);
      if (!target) return;

      const slug = `${plant.slug}-vs-${target.slug}`;
      const reverseSlug = `${target.slug}-vs-${plant.slug}`;

      if (seen.has(slug) || seen.has(reverseSlug)) return;

      seen.add(slug);

      pairs.push({
        slug,
        title: `${plant.nameCn}和${target.nameCn}的区别`,
      });
    });
  });

  return pairs;
}