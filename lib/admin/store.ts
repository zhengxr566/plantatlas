// 图片管理后台使用的读写工具，只在本地开发环境（npm run dev）下可用。
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { parse } from "csv-parse/sync";
import sharp from "sharp";
import { getPart } from "@/data/parts";
import { loadPlants } from "@/lib/loadPlants";

const root = process.cwd();
const photosDir = path.join(root, "public", "photos");
const photosCsv = path.join(root, "data", "photos.csv");
const compareCsv = path.join(root, "data", "compare.csv");
const tagsMd = path.join(root, "tags.md");

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
] as const;
const COMPARE_COLUMNS = ["plantA", "plantB", "keyPoints", "intro"] as const;

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
  rows: Record<string, string>[]
) {
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((col) => csvCell(row[col])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
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

export async function addPhoto(buffer: Buffer, input: PhotoInput) {
  validatePlantAndPart(input.plant, input.part);

  const meta = await sharp(buffer).metadata();
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

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
          },
        ]
      : others;

  writeCsv(compareCsv, COMPARE_COLUMNS, next);
}

export type TagGroup = { name: string; tags: string[] };

export function readTagGroups(): TagGroup[] {
  const groups: TagGroup[] = [];
  let current: TagGroup | null = null;

  for (const line of fs.readFileSync(tagsMd, "utf8").split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      current = { name: line.slice(3).trim(), tags: [] };
      groups.push(current);
    } else if (current && line.startsWith("- ")) {
      current.tags.push(line.slice(2).trim());
    }
  }

  return groups.filter((g) => g.tags.length > 0);
}

const CUSTOM_GROUP = "自定义 Custom";

// 新标签写入 tags.md 的“自定义”分组（放在“Tag 使用规则”之前）
export function addTag(tag: string) {
  const clean = tag.trim();
  if (!clean || /[|,，、]/.test(clean)) throw new Error("标签不能为空或包含分隔符");
  if (readTagGroups().some((g) => g.tags.includes(clean))) return;

  const text = fs.readFileSync(tagsMd, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const header = lines.findIndex((l) => l.trim() === `## ${CUSTOM_GROUP}`);

  if (header >= 0) {
    let end = header + 1;
    while (end < lines.length && !lines[end].startsWith("## ")) end++;
    while (end > header + 1 && lines[end - 1].trim() === "") end--;
    lines.splice(end, 0, `- ${clean}`);
  } else {
    let at = lines.findIndex((l) => l.startsWith("## Tag 使用规则"));
    if (at < 0) at = lines.length;
    lines.splice(at, 0, `## ${CUSTOM_GROUP}`, "", `- ${clean}`, "");
  }

  fs.writeFileSync(tagsMd, lines.join(eol), "utf8");
}

// ---------- 发布（git） ----------

const run = promisify(execFile);
const PUBLISH_PATHS = [
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
