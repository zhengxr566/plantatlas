import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export type Plant = {
  slug: string;
  nameCn: string;
  nameLatin: string;
  kingdom: string;
  division: string;
  className: string;
  classSlug?: string;
  order: string;
  orderSlug?: string;
  family: string;
  familySlug: string;
  genus: string;
  genusSlug: string;
  habit?: string;
  leaf?: string;
  flower?: string;
  fruit?: string;
  bark?: string;
  environment?: string;
  usage?: string[];
  tags?: string[];
  similar?: string[];
  relatives?: string[];
};

function splitList(value?: string): string[] {
  return (value || "")
    .split(/[|、,，]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function loadPlants(): Plant[] {
  const filePath = path.join(process.cwd(), "data", "plants.csv");

  // 使用标准 CSV 解析：支持 Excel 保存时给含逗号的字段加的引号
  const rows = parse(fs.readFileSync(filePath, "utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  return rows.map((row) => {
    return {
      slug: row.slug,
      nameCn: row.nameCn,
      nameLatin: row.nameLatin,
      kingdom: row.kingdom,
      division: row.division,
      className: row.className,
      classSlug: row.classSlug,
      order: row.order,
      orderSlug: row.orderSlug,
      family: row.family,
      familySlug: row.familySlug,
      genus: row.genus,
      genusSlug: row.genusSlug,
      habit: row.habit,
      leaf: row.leaf,
      flower: row.flower,
      fruit: row.fruit,
      bark: row.bark,
      environment: row.environment,
      usage: splitList(row.usage),
      tags: splitList(row.tags),
      similar: splitList(row.similar),
    };
  });
}