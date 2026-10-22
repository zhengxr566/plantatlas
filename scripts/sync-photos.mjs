// 扫描 public/photos/<植物slug>/ 下的图片，同步到 data/photos.csv，并检查 data/compare.csv。
// - 新图片自动追加一行：plant 取文件夹名，part 取文件名前缀（leaf-01.jpg → leaf）
// - 自动填写 width / height
// - 检查植物 slug、部位、标签是否合法，并提示没有标签的图片
// 用法：npm run photos
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { imageSize } from "image-size";
import { plantParts } from "../data/parts.ts";

const root = process.cwd();
const photosDir = path.join(root, "public", "photos");
const csvPath = path.join(root, "data", "photos.csv");
const COLUMNS = [
  "file",
  "plant",
  "part",
  "tags",
  "caption",
  "season",
  "location",
  "date",
  "author",
  "license",
  "width",
  "height",
];
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;
const LARGE_FILE_BYTES = 1.5 * 1024 * 1024;

const partSlugs = new Set(plantParts.map((p) => p.slug));

const plantSlugs = new Set(
  parse(fs.readFileSync(path.join(root, "data", "plants.csv"), "utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }).map((row) => row.slug.trim())
);

const knownTags = new Set(
  fs
    .readFileSync(path.join(root, "tags.md"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
);

const rows = fs.existsSync(csvPath)
  ? parse(fs.readFileSync(csvPath, "utf8"), {
      bom: true,
      columns: true,
      skip_empty_lines: true,
    })
  : [];
const rowsByFile = new Map(rows.map((row) => [row.file, row]));

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return IMAGE_EXT.test(entry.name) ? [full] : [];
  });
}

const warnings = [];
let added = 0;

for (const full of walk(photosDir)) {
  const file = path.relative(photosDir, full).split(path.sep).join("/");
  const buffer = fs.readFileSync(full);
  const { width, height } = imageSize(buffer);

  if (buffer.length > LARGE_FILE_BYTES) {
    warnings.push(
      `${file}: ${(buffer.length / 1024 / 1024).toFixed(1)}MB，建议压缩到 1.5MB 以内（长边 1600-2000px）`
    );
  }

  let row = rowsByFile.get(file);
  if (!row) {
    const prefix = path.basename(file).split(/[-_.]/)[0].toLowerCase();
    row = {
      file,
      plant: file.includes("/") ? file.split("/")[0] : "",
      part: partSlugs.has(prefix) ? prefix : "",
    };
    rows.push(row);
    rowsByFile.set(file, row);
    added += 1;
  }

  row.width = String(width);
  row.height = String(height);
}

for (const row of rows) {
  if (!fs.existsSync(path.join(photosDir, row.file))) {
    warnings.push(`${row.file}: 文件不存在（可以删除这一行）`);
  }
  if (!plantSlugs.has(row.plant)) {
    warnings.push(`${row.file}: plant "${row.plant}" 不在 plants.csv 中`);
  }
  if (!partSlugs.has(row.part)) {
    warnings.push(
      `${row.file}: part "${row.part || ""}" 无效，可选：${[...partSlugs].join(" ")}`
    );
  }
  const tags = (row.tags || "").split("|").map((t) => t.trim()).filter(Boolean);
  if (tags.length === 0) {
    warnings.push(`${row.file}: 还没有标签，不会参与自动对比`);
  }
  tags
    .filter((tag) => !knownTags.has(tag))
    .forEach((tag) =>
      warnings.push(`${row.file}: 标签 "${tag}" 不在 tags.md 中（新标签请先加到 tags.md）`)
    );
}

const comparePath = path.join(root, "data", "compare.csv");
if (fs.existsSync(comparePath)) {
  parse(fs.readFileSync(comparePath, "utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }).forEach((row, i) => {
    [row.plantA, row.plantB]
      .filter((slug) => !plantSlugs.has(slug))
      .forEach((slug) =>
        warnings.push(`compare.csv 第 ${i + 2} 行: "${slug || ""}" 不在 plants.csv 中`)
      );
    if (!row.keyPoints && !row.intro) {
      warnings.push(`compare.csv 第 ${i + 2} 行: keyPoints 和 intro 都是空的`);
    }
  });
}

rows.sort((a, b) => a.file.localeCompare(b.file));

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const output = [
  COLUMNS.join(","),
  ...rows.map((row) => COLUMNS.map((col) => csvCell(row[col])).join(",")),
].join("\n");

fs.writeFileSync(csvPath, `${output}\n`, "utf8");

console.log(`photos.csv: ${rows.length} 张图片，新增 ${added} 张`);
if (warnings.length > 0) {
  console.log(`\n需要处理的问题（${warnings.length}）：`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}
