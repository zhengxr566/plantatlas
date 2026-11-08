"use client";

import { useMemo, useRef, useState } from "react";
import { PART_TAG_GROUPS } from "@/data/parts";

type TagGroup = { name: string; tags: string[] };

// 访客为图片建议增加或删除标签。只能从 tags.md 词表中选择，提交后由站长审核。
export default function TagSuggest({
  file,
  part,
  currentTags,
}: {
  file: string;
  part: string;
  currentTags: string[];
}) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<TagGroup[] | null>(null);
  const [add, setAdd] = useState<string[]>([]);
  const [remove, setRemove] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const openedAt = useRef(0);

  // 当前部位相关的分组排在前面
  const ordered = useMemo(() => {
    const priority = PART_TAG_GROUPS[part] ?? [];
    const rank = (g: TagGroup) => {
      const i = priority.findIndex((p) => g.name.startsWith(p));
      return i < 0 ? priority.length : i;
    };
    return [...(groups ?? [])]
      .map((g) => ({ ...g, tags: g.tags.filter((t) => !currentTags.includes(t)) }))
      .filter((g) => g.tags.length > 0)
      .sort((a, b) => rank(a) - rank(b));
  }, [groups, part, currentTags]);

  async function toggleOpen() {
    if (!open && !groups) {
      try {
        const res = await fetch("/api/suggest-tags");
        const data = await res.json();
        if (!data.enabled) {
          setMessage("标签建议功能暂未开放");
          setState("error");
        }
        setGroups(data.tagGroups ?? []);
      } catch {
        setMessage("加载失败，请稍后再试");
        setState("error");
      }
    }
    openedAt.current = Date.now();
    setOpen(!open);
  }

  const toggle = (list: string[], set: (v: string[]) => void, tag: string) =>
    set(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);

  async function submit() {
    setState("sending");
    try {
      const res = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file,
          add,
          remove,
          note,
          website,
          elapsed: Date.now() - openedAt.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "提交失败");
      setState("done");
    } catch (error) {
      setMessage((error as Error).message);
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="tag-suggest-done">感谢补充！审核通过后会更新到网站。</p>;
  }

  return (
    <div className="tag-suggest">
      <button type="button" className="tag-suggest-toggle" onClick={toggleOpen}>
        {open ? "收起" : "补充 / 纠正标签"}
      </button>

      {open && groups && (
        <div className="tag-suggest-panel">
          {currentTags.length > 0 && (
            <div className="tag-suggest-row">
              <span className="tag-suggest-label">现有标签（点击标记为不准确）</span>
              {currentTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={remove.includes(tag) ? "photo-tag tag-remove" : "photo-tag"}
                  onClick={() => toggle(remove, setRemove, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="tag-suggest-groups">
            <span className="tag-suggest-label">这张图还能看到哪些特征？</span>
            {ordered.map((group) => (
              <div key={group.name} className="tag-suggest-row">
                <span className="tag-suggest-group">{group.name}</span>
                {group.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={add.includes(tag) ? "photo-tag tag-add" : "photo-tag tag-option"}
                    onClick={() => toggle(add, setAdd, tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <textarea
            className="tag-suggest-note"
            rows={2}
            maxLength={300}
            placeholder="列表里没有的特征，或其他说明（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* 防机器人的隐藏字段，正常用户看不到 */}
          <input
            className="tag-suggest-hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <div className="tag-suggest-actions">
            <button
              type="button"
              className="tag-suggest-submit"
              disabled={state === "sending" || (add.length === 0 && remove.length === 0 && !note.trim())}
              onClick={submit}
            >
              {state === "sending" ? "提交中…" : "提交建议"}
            </button>
            <span className="tag-suggest-hint">提交后由站长审核，不需要注册</span>
          </div>
        </div>
      )}

      {state === "error" && message && <p className="tag-suggest-error">{message}</p>}
    </div>
  );
}
