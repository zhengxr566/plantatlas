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
  usage: string[];
  tags: string[];
  similar: string[];
};

export function loadPlants(): Plant[] {
  const filePath = path.join(process.cwd(), "data", "plants.csv");
  const csvContent = fs.readFileSync(filePath, "utf-8");

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((r: any) => ({
    ...r,
    usage: r.usage ? r.usage.split("|") : [],
    tags: r.tags ? r.tags.split("|") : [],
    similar: r.similar ? r.similar.split("|") : [],
  }));
}