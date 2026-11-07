export function toTaxonomySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-一-龥]/g, "");
}
// 分类页（纲/目/科/属）至少包含多少种植物才允许被收录。
// 只有 1 种植物的分类页内容和植物页几乎重复，设为 noindex，植物增加后自动恢复。
export const MIN_PLANTS_TO_INDEX = 2;

export function isTaxonomyIndexable(plantCount: number) {
  return plantCount >= MIN_PLANTS_TO_INDEX;
}

export function taxonomyRobots(plantCount: number) {
  return isTaxonomyIndexable(plantCount)
    ? {}
    : { robots: { index: false, follow: true } };
}
