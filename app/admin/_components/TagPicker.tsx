"use client";

import { useMemo, useState } from "react";
import GroupSelect, { CUSTOM_GROUP } from "./GroupSelect";
import { PART_TAG_GROUPS, type TagGroup } from "./types";

// 标签选择：点击切换；搜索框回车可添加；新标签写入 tags.md 的所选分组
export default function TagPicker({
  value,
  onChange,
  groups,
  part,
  onAddTag,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  groups: TagGroup[];
  part: string;
  onAddTag: (tag: string, group?: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  // 用户手动选的分组；没选时按当前部位推荐
  const [chosenGroup, setChosenGroup] = useState<string | null>(null);

  // 当前部位相关的分组排在前面
  const ordered = useMemo(() => {
    const priority = PART_TAG_GROUPS[part] ?? [];
    const rank = (g: TagGroup) => {
      const i = priority.findIndex((p) => g.name.startsWith(p));
      return i < 0 ? priority.length : i;
    };
    return [...groups].sort((a, b) => rank(a) - rank(b));
  }, [groups, part]);

  const allTags = useMemo(() => groups.flatMap((g) => g.tags), [groups]);
  const priority = PART_TAG_GROUPS[part] ?? [];
  const suggestedGroup =
    ordered.find((g) => priority.some((p) => g.name.startsWith(p)))?.name ?? CUSTOM_GROUP;
  const newGroup = chosenGroup ?? suggestedGroup;
  const q = query.trim();
  const isNew = q && !allTags.includes(q);

  function toggle(tag: string) {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  }

  async function addNew() {
    if (!q) return;
    setBusy(true);
    try {
      await onAddTag(q, newGroup);
      if (!value.includes(q)) onChange([...value, q]);
      setQuery("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tag-picker">
      <div className="tag-picker-selected">
        {value.length === 0 && <span className="muted">还没有标签（至少 2 个才会参与自动对比）</span>}
        {value.map((tag) => (
          <button key={tag} type="button" className="chip chip-on" onClick={() => toggle(tag)}>
            {tag} ×
          </button>
        ))}
      </div>

      <div className="tag-picker-search">
        <input
          value={query}
          placeholder="搜索或输入新标签，回车添加"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (!q) return;
            if (allTags.includes(q)) {
              if (!value.includes(q)) onChange([...value, q]);
              setQuery("");
            } else {
              addNew();
            }
          }}
        />
        {isNew && (
          <>
            <GroupSelect
              value={newGroup}
              groups={groups.map((g) => g.name)}
              onChange={setChosenGroup}
              title="新标签放进哪个分组"
            />
            <button type="button" className="btn btn-small" disabled={busy} onClick={addNew}>
              新增「{q}」
            </button>
          </>
        )}
      </div>

      <div className="tag-picker-groups">
        {ordered.map((group) => {
          const tags = group.tags.filter((t) => !q || t.includes(q));
          if (tags.length === 0) return null;
          return (
            <div key={group.name} className="tag-group">
              <span className="tag-group-name">{group.name}</span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={value.includes(tag) ? "chip chip-on" : "chip"}
                  onClick={() => toggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
