import fs from "fs";
import path from "path";

// tags.md 中的标签词表（按 “## 分组” 解析）
export const tagsMdPath = path.join(process.cwd(), "tags.md");

export type TagGroup = { name: string; tags: string[] };

export function readTagGroups(): TagGroup[] {
  const groups: TagGroup[] = [];
  let current: TagGroup | null = null;

  for (const line of fs.readFileSync(tagsMdPath, "utf8").split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      current = { name: line.slice(3).trim(), tags: [] };
      groups.push(current);
    } else if (current && line.startsWith("- ")) {
      current.tags.push(line.slice(2).trim());
    }
  }

  return groups.filter((g) => g.tags.length > 0);
}

export function getKnownTags() {
  return new Set(readTagGroups().flatMap((g) => g.tags));
}
