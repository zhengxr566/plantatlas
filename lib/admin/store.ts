// 图片管理后台使用的读写工具，只在本地开发环境（npm run dev）下可用。
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { parse } from "csv-parse/sync";
import sharp from "sharp";
import { getPart } from "@/data/parts";
import { loadPlants } from "@/lib/loadPlants";
import { readTagGroups, tagsMdPath as tagsMd } from "@/lib/tags";

export { readTagGroups, type TagGroup } from "@/lib/tags";

const root = process.cwd();
const photosDir = path.join(root, "public", "photos");
const photosCsv = path.join(root, "data", "photos.csv");
const compareCsv = path.join(root, "data", "compare.csv");

export const PHOTO_COLUMNS = [
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
  "updated",
] as const;
const COMPARE_COLUMNS = ["plantA", "plantB", "keyPoints", "intro", "updated"] as const;

// 本地时区的 YYYY-MM-DD（toISOString 是 UTC，日本上午会得到前一天）
function today() {
  return new Date().toLocaleDateString("sv-SE");
}

// 上传图片统一压缩：长边 1600px，JPEG 质量 82，去除 EXIF（包括 GPS 位置）
const MAX_EDGE = 1600;
const JPEG_QUALITY = 82;

export type PhotoRow = Record<(typeof PHOTO_COLUMNS)[number], string>;
export type CompareRow = Record<(typeof COMPARE_COLUMNS)[number], string>;

export function isAdminEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function adminDisabledResponse() {
  return new Response("Not Found", { status: 404 });
}

function readCsv(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) return [];
  return parse(fs.readFileSync(filePath, "utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(
  filePath: string,
  columns: readonly string[],
  rows: Record<string, string>[],
  { bom = false, eol = "\n" }: { bom?: boolean; eol?: string } = {}
) {
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((col) => csvCell(row[col])).join(",")),
  ];
  fs.writeFileSync(filePath, `${bom ? "\ufeff" : ""}${lines.join(eol)}${eol}`, "utf8");
}

export function readPhotoRows() {
  return readCsv(photosCsv) as PhotoRow[];
}

function writePhotoRows(rows: PhotoRow[]) {
  rows.sort((a, b) => a.file.localeCompare(b.file));
  writeCsv(photosCsv, PHOTO_COLUMNS, rows);
}

export function readCompareRows() {
  return readCsv(compareCsv) as CompareRow[];
}

function cleanTags(tags: unknown) {
  const list = Array.isArray(tags) ? tags : String(tags ?? "").split("|");
  return Array.from(
    new Set(list.map((t) => String(t).trim()).filter(Boolean))
  ).join("|");
}

function validatePlantAndPart(plant: string, part: string) {
  if (!loadPlants().some((p) => p.slug === plant)) {
    throw new Error(`植物 "${plant}" 不在 plants.csv 中`);
  }
  if (!getPart(part)) throw new Error(`部位 "${part}" 无效`);
}

// 在植物文件夹中找一个未使用的文件名，例如 leaf-03.jpg
function nextFileName(plant: string, part: string) {
  const dir = path.join(photosDir, plant);
  const used = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  for (let i = 1; ; i++) {
    const name = `${part}-${String(i).padStart(2, "0")}.jpg`;
    if (!used.has(name)) return name;
  }
}

// 从 EXIF 中读取拍摄日期（YYYY:MM:DD HH:MM:SS）
function readExifDate(exif?: Buffer) {
  const match = exif?.toString("latin1").match(/(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

export type PhotoInput = {
  plant: string;
  part: string;
  tags?: string[] | string;
  caption?: string;
  season?: string;
  location?: string;
  date?: string;
};

// 裁剪区域，单位是按 EXIF 转正后的原图像素
export type CropRect = { x: number; y: number; width: number; height: number };

// 转正 → 裁剪 → 压缩到长边 1600px 的 JPEG（同时去除 EXIF）
async function processImage(buffer: Buffer, crop?: CropRect | null) {
  const meta = await sharp(buffer).metadata();
  let image = sharp(buffer).rotate();

  if (crop) {
    // EXIF 方向 5–8 表示需要旋转 90°，转正后宽高互换
    const swap = (meta.orientation ?? 1) >= 5;
    const fullW = (swap ? meta.height : meta.width) ?? 0;
    const fullH = (swap ? meta.width : meta.height) ?? 0;
    const left = Math.max(0, Math.min(Math.round(crop.x), fullW - 1));
    const top = Math.max(0, Math.min(Math.round(crop.y), fullH - 1));
    const width = Math.max(1, Math.min(Math.round(crop.width), fullW - left));
    const height = Math.max(1, Math.min(Math.round(crop.height), fullH - top));
    // 在 rotate() 之后调用 extract()，裁剪基于转正后的图片
    image = image.extract({ left, top, width, height });
  }

  const result = await image
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { ...result, meta };
}

export async function addPhoto(buffer: Buffer, input: PhotoInput, crop?: CropRect | null) {
  validatePlantAndPart(input.plant, input.part);

  const { data, info, meta } = await processImage(buffer, crop);

  const dir = path.join(photosDir, input.plant);
  fs.mkdirSync(dir, { recursive: true });
  const name = nextFileName(input.plant, input.part);
  fs.writeFileSync(path.join(dir, name), data, { flag: "wx" });

  const row: PhotoRow = {
    file: `${input.plant}/${name}`,
    plant: input.plant,
    part: input.part,
    tags: cleanTags(input.tags),
    caption: (input.caption ?? "").trim(),
    season: (input.season ?? "").trim(),
    location: (input.location ?? "").trim(),
    date: (input.date ?? "").trim() || readExifDate(meta.exif),
    author: "",
    license: "",
    width: String(info.width),
    height: String(info.height),
    updated: today(),
  };

  writePhotoRows([...readPhotoRows(), row]);
  return { row, bytes: data.length };
}

export function updatePhoto(file: string, input: PhotoInput) {
  validatePlantAndPart(input.plant, input.part);
  const rows = readPhotoRows();
  const row = rows.find((r) => r.file === file);
  if (!row) throw new Error(`找不到图片 ${file}`);

  // 换了植物：把文件移动到新植物的文件夹
  if (row.plant !== input.plant) {
    const name = nextFileName(input.plant, input.part);
    fs.mkdirSync(path.join(photosDir, input.plant), { recursive: true });
    fs.renameSync(
      path.join(photosDir, row.file),
      path.join(photosDir, input.plant, name)
    );
    row.file = `${input.plant}/${name}`;
  }

  Object.assign(row, {
    plant: input.plant,
    part: input.part,
    tags: cleanTags(input.tags),
    caption: (input.caption ?? "").trim(),
    season: (input.season ?? "").trim(),
    location: (input.location ?? "").trim(),
    date: (input.date ?? "").trim(),
    updated: today(),
  });

  writePhotoRows(rows);
  return row;
}

// 重新裁剪已有图片（基于网站上保存的版本，覆盖原文件）
export async function cropPhoto(file: string, crop: CropRect) {
  const rows = readPhotoRows();
  const row = rows.find((r) => r.file === file);
  if (!row) throw new Error(`找不到图片 ${file}`);
  const full = path.resolve(photosDir, file);
  if (!full.startsWith(photosDir + path.sep)) throw new Error("非法路径");

  const { data, info } = await processImage(fs.readFileSync(full), crop);
  fs.writeFileSync(full, data);
  Object.assign(row, {
    width: String(info.width),
    height: String(info.height),
    updated: today(),
  });
  writePhotoRows(rows);
  return row;
}

export function deletePhoto(file: string) {
  const rows = readPhotoRows();
  if (!rows.some((r) => r.file === file)) throw new Error(`找不到图片 ${file}`);

  const full = path.resolve(photosDir, file);
  if (!full.startsWith(photosDir + path.sep)) throw new Error("非法路径");
  if (fs.existsSync(full)) fs.unlinkSync(full);
  // 植物文件夹空了就一起删掉
  const dir = path.dirname(full);
  if (dir !== photosDir && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);

  writePhotoRows(rows.filter((r) => r.file !== file));
}

export function saveCompareNote(
  plantA: string,
  plantB: string,
  keyPoints: string[],
  intro: string
) {
  const plants = loadPlants();
  if (![plantA, plantB].every((slug) => plants.some((p) => p.slug === slug))) {
    throw new Error("植物不在 plants.csv 中");
  }
  if (plantA === plantB) throw new Error("请选择两种不同的植物");

  const samePair = (r: CompareRow) =>
    (r.plantA === plantA && r.plantB === plantB) ||
    (r.plantA === plantB && r.plantB === plantA);

  const points = keyPoints.map((p) => p.replace(/\|/g, "／").trim()).filter(Boolean);
  const rows = readCompareRows();
  const existing = rows.find(samePair);
  const others = rows.filter((r) => !samePair(r));

  // 内容清空时删除这一行
  const next =
    points.length > 0 || intro.trim()
      ? [
          ...others,
          {
            plantA: existing?.plantA ?? plantA,
            plantB: existing?.plantB ?? plantB,
            keyPoints: points.join("|"),
            intro: intro.trim(),
            updated: today(),
          },
        ]
      : others;

  writeCsv(compareCsv, COMPARE_COLUMNS, next);
}

const CUSTOM_GROUP = "自定义 Custom";

// 新标签写入 tags.md 的“自定义”分组（放在“Tag 使用规则”之前）
function validateTagName(tag: string) {
  const clean = tag.trim();
  if (!clean || /[|,，、]/.test(clean)) throw new Error("标签不能为空或包含分隔符 | , ，、");
  return clean;
}

// 读写 tags.md，保留原文件的换行符
function editTagsMd(edit: (lines: string[]) => void) {
  const text = fs.readFileSync(tagsMd, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  edit(lines);
  fs.writeFileSync(tagsMd, lines.join(eol), "utf8");
}

// 新标签写入 tags.md 的指定分组（默认“自定义”分组，放在“Tag 使用规则”之前）
export function addTag(tag: string, group = CUSTOM_GROUP) {
  const clean = validateTagName(tag);
  if (readTagGroups().some((g) => g.tags.includes(clean))) return;

  editTagsMd((lines) => {
    const header = lines.findIndex((l) => l.trim() === `## ${group}`);
    if (header >= 0) {
      let end = header + 1;
      while (end < lines.length && !lines[end].startsWith("## ")) end++;
      while (end > header + 1 && lines[end - 1].trim() === "") end--;
      lines.splice(end, 0, `- ${clean}`);
    } else {
      let at = lines.findIndex((l) => l.startsWith("## Tag 使用规则"));
      if (at < 0) at = lines.length;
      lines.splice(at, 0, `## ${group}`, "", `- ${clean}`, "");
    }
  });
}

// ---------- 植物资料（plants.csv） ----------

const plantsCsv = path.join(root, "data", "plants.csv");
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LIST_FIELDS = ["usage", "tags", "similar"];
const REQUIRED_FIELDS: Record<string, string> = {
  slug: "网址标识",
  nameCn: "中文名",
  nameLatin: "学名",
  division: "类群",
  className: "纲",
  classSlug: "纲标识",
  order: "目",
  orderSlug: "目标识",
  family: "科",
  familySlug: "科标识",
  genus: "属",
  genusSlug: "属标识",
};

export type PlantRow = Record<string, string>;

function readPlantFile() {
  const text = fs.readFileSync(plantsCsv, "utf8");
  const rows = parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as PlantRow[];
  const columns = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)[0]
    .split(",")
    .map((c) => c.trim());
  // 保持原文件格式（BOM + 换行符），方便继续用 Excel 打开
  const format = {
    bom: text.startsWith("﻿"),
    eol: text.includes("\r\n") ? "\r\n" : "\n",
  };
  return { rows, columns, format };
}

export function readPlantRows() {
  const { rows, columns } = readPlantFile();
  return { rows, columns };
}

function writePlantRows(rows: PlantRow[]) {
  const { columns, format } = readPlantFile();
  writeCsv(plantsCsv, columns, rows, format);
}

function normalizeList(value: unknown) {
  const list = Array.isArray(value) ? value : String(value ?? "").split(/[|、,，]/);
  return Array.from(new Set(list.map((v) => String(v).trim()).filter(Boolean))).join("|");
}

// 同一个分类标识必须对应同一个名称（例如 genusSlug=pinus 只能是“松属”）
function checkTaxonomy(row: PlantRow, others: PlantRow[]) {
  const pairs: [string, string, string][] = [
    ["classSlug", "className", "纲"],
    ["orderSlug", "order", "目"],
    ["familySlug", "family", "科"],
    ["genusSlug", "genus", "属"],
  ];
  for (const [slugKey, nameKey, label] of pairs) {
    const clash = others.find(
      (o) =>
        (o[slugKey] === row[slugKey] && o[nameKey] !== row[nameKey]) ||
        (o[nameKey] === row[nameKey] && o[slugKey] !== row[slugKey])
    );
    if (clash) {
      throw new Error(
        `${label}“${row[nameKey]}”（${row[slugKey]}）与${clash.nameCn}的${label}“${clash[nameKey]}”（${clash[slugKey]}）不一致`
      );
    }
  }
}

// isNew=true 时新增；否则按 slug 更新（slug 不可修改，避免已收录的网址失效）
export function savePlant(input: PlantRow, isNew: boolean) {
  const { rows, columns } = readPlantFile();
  const row: PlantRow = {};
  for (const col of columns) {
    row[col] = LIST_FIELDS.includes(col)
      ? normalizeList(input[col])
      : String(input[col] ?? "").trim().replace(/\r?\n/g, " ");
  }
  row.kingdom ||= "植物界";

  for (const [key, label] of Object.entries(REQUIRED_FIELDS)) {
    if (!row[key]) throw new Error(`请填写${label}`);
  }
  for (const key of ["slug", "classSlug", "orderSlug", "familySlug", "genusSlug"]) {
    if (!SLUG_RE.test(row[key])) {
      throw new Error(`${REQUIRED_FIELDS[key]}“${row[key]}”只能使用小写英文、数字和 -`);
    }
  }

  const index = rows.findIndex((r) => r.slug === row.slug);
  if (isNew && index >= 0) throw new Error(`网址标识 ${row.slug} 已被${rows[index].nameCn}使用`);
  if (!isNew && index < 0) throw new Error(`找不到植物 ${row.slug}`);

  const others = rows.filter((r) => r.slug !== row.slug);
  const sameName = others.find((r) => r.nameCn === row.nameCn);
  if (sameName) {
    throw new Error(`中文名“${row.nameCn}”已被 ${sameName.slug} 使用（相似植物按中文名匹配，不能重名）`);
  }
  checkTaxonomy(row, others);

  if (isNew) rows.push(row);
  else rows[index] = row;
  writePlantRows(rows);

  // 相似植物写的是中文名，不存在的只提示不报错
  const names = new Set(rows.map((r) => r.nameCn));
  const warnings = (row.similar || "")
    .split("|")
    .filter((n) => n && !names.has(n))
    .map((n) => `相似植物“${n}”还没有收录，暂时不会生成对比页`);

  return { row, warnings };
}

// 有图片或手写对比引用的植物不能删除
export function deletePlant(slug: string) {
  const { rows } = readPlantFile();
  const plant = rows.find((r) => r.slug === slug);
  if (!plant) throw new Error(`找不到植物 ${slug}`);
  const photos = readPhotoRows().filter((r) => r.plant === slug).length;
  if (photos > 0) throw new Error(`${plant.nameCn}还有 ${photos} 张图片，请先在图片库中删除或移走`);
  if (readCompareRows().some((r) => r.plantA === slug || r.plantB === slug)) {
    throw new Error(`${plant.nameCn}在对比要点中被引用，请先删除相关对比`);
  }
  writePlantRows(rows.filter((r) => r.slug !== slug));
}

// ---------- 标签管理 ----------

export function getTagUsage() {
  const photos = readPhotoRows();
  const { rows: plants } = readPlantFile();
  const count = (list: { tags?: string }[]) => {
    const map = new Map<string, number>();
    list.forEach((r) =>
      (r.tags || "")
        .split("|")
        .filter(Boolean)
        .forEach((t) => map.set(t, (map.get(t) ?? 0) + 1))
    );
    return map;
  };
  const photoCount = count(photos);
  const plantCount = count(plants);
  const known = new Set(readTagGroups().flatMap((g) => g.tags));
  const all = new Set([...known, ...photoCount.keys(), ...plantCount.keys()]);

  return [...all].map((tag) => ({
    tag,
    inVocabulary: known.has(tag),
    photos: photoCount.get(tag) ?? 0,
    plants: plantCount.get(tag) ?? 0,
  }));
}

function replaceInTags(value: string, from: string, to: string | null) {
  const list = value.split("|").filter(Boolean);
  if (!list.includes(from)) return value;
  return Array.from(new Set(list.flatMap((t) => (t === from ? (to ? [to] : []) : [t])))).join("|");
}

function applyTagChange(from: string, to: string | null) {
  const photos = readPhotoRows();
  let photoChanges = 0;
  photos.forEach((r) => {
    const next = replaceInTags(r.tags, from, to);
    if (next !== r.tags) {
      r.tags = next;
      r.updated = today();
      photoChanges++;
    }
  });
  if (photoChanges > 0) writePhotoRows(photos);

  const { rows: plants } = readPlantFile();
  let plantChanges = 0;
  plants.forEach((r) => {
    const next = replaceInTags(r.tags || "", from, to);
    if (next !== (r.tags || "")) {
      r.tags = next;
      plantChanges++;
    }
  });
  if (plantChanges > 0) writePlantRows(plants);

  return { photos: photoChanges, plants: plantChanges };
}

// 重命名或合并：to 已在词表中时为合并（从词表删除 from），否则就地改名。
// 同时更新所有图片和植物资料中的标签
export function renameTag(from: string, toInput: string) {
  const to = validateTagName(toInput);
  if (from === to) return { photos: 0, plants: 0 };
  const known = new Set(readTagGroups().flatMap((g) => g.tags));

  editTagsMd((lines) => {
    const i = lines.findIndex((l) => l.trim() === `- ${from}`);
    if (i < 0) return; // from 只出现在数据中，不在词表里
    if (known.has(to)) lines.splice(i, 1);
    else lines[i] = `- ${to}`;
  });
  // from 不在词表、to 也是新标签时，把 to 加入“自定义”分组
  if (!known.has(from) && !known.has(to)) addTag(to);

  return applyTagChange(from, to);
}

// 从词表、图片和植物资料中删除标签
export function deleteTag(tag: string) {
  editTagsMd((lines) => {
    const i = lines.findIndex((l) => l.trim() === `- ${tag}`);
    if (i >= 0) lines.splice(i, 1);
  });
  return applyTagChange(tag, null);
}

// ---------- 发布（git） ----------

const run = promisify(execFile);
const PUBLISH_PATHS = [
  "data/plants.csv",
  "data/photos.csv",
  "data/compare.csv",
  "tags.md",
  "public/photos",
];

async function git(args: string[]) {
  const { stdout, stderr } = await run("git", args, { cwd: root });
  return `${stdout}${stderr}`.trim();
}

async function gitStdout(args: string[]) {
  const { stdout } = await run("git", args, { cwd: root });
  return stdout;
}

export async function getPublishStatus() {
  const branch = await git(["rev-parse", "--abbrev-ref", "HEAD"]);
  // porcelain 格式每行开头的空格有意义，不能 trim
  const status = await gitStdout([
    "status",
    "--porcelain",
    "--untracked-files=all",
    "--",
    ...PUBLISH_PATHS,
  ]);
  const files = status
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }));
  return { branch, files };
}

// 只提交图片和数据文件（不会提交代码改动），然后推送当前分支
export async function publish(message: string) {
  const { files } = await getPublishStatus();
  if (files.length === 0) return { ok: true, log: "没有需要发布的改动" };

  const log: string[] = [];
  log.push(await git(["add", "-A", "--", ...PUBLISH_PATHS]));
  log.push(
    await git(["commit", "-m", message.trim() || "update photos", "--", ...PUBLISH_PATHS])
  );
  log.push(await git(["push", "origin", "HEAD"]));
  return { ok: true, log: log.filter(Boolean).join("\n") };
}
