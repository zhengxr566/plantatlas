import fs from "fs";
import path from "path";

export type Plant = {
  slug: string;
  nameCn: string;
  nameLatin: string;
  kingdom: string;
  division: string;
  className: string;
  order: string;
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
};

function splitList(value?: string): string[] {
  return (value || "")
    .split(/[|、,，]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((v) => v.trim());
}

export function loadPlants(): Plant[] {
  const filePath = path.join(process.cwd(), "data", "plants.csv");
  const csv = fs.readFileSync(filePath, "utf8");

  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return {
      slug: row.slug,
      nameCn: row.nameCn,
      nameLatin: row.nameLatin,
      kingdom: row.kingdom,
      division: row.division,
      className: row.className,
      order: row.order,
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