"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type AdminData, type TagGroup } from "./types";

type Usage = { tag: string; inVocabulary: boolean; photos: number; plants: number };
type Filter = "all" | "vocab" | "outside" | "unused";

const CUSTOM_GROUP = "自定义 Custom";

// 标签词表管理：查看用量、改名 / 合并、删除、把数据里出现的新标签加入词表
export default function TagsTab({
  data,
  onChanged,
}: {
  data: AdminData;
  onChanged: () => void;
}) {
  const [usage, setUsage] = useState<Usage[]>([]);
  const [groups, setGroups] = useState<TagGroup[]>(data.tagGroups);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [newTag, setNewTag] = useState({ tag: "", group: CUSTOM_GROUP });
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function apply(d: { tagGroups: TagGroup[]; usage: Usage[] }) {
    setGroups(d.tagGroups);
    setUsage(d.usage);
  }

  useEffect(() => {
    api<{ tagGroups: TagGroup[]; usage: Usage[] }>("/api/admin/tags")
      .then(apply)
      .catch((e: Error) => setMessage({ type: "error", text: e.message }));
  }, []);

  async function reload(text: string) {
    apply(await api<{ tagGroups: TagGroup[]; usage: Usage[] }>("/api/admin/tags"));
    setMessage({ type: "ok", text });
    onChanged();
  }

  async function run(action: () => Promise<string>) {
    try {
      await reload(await action());
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    }
  }

  const groupOf = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => g.tags.forEach((t) => map.set(t, g.name)));
    return map;
  }, [groups]);

  const known = useMemo(() => new Set(usage.filter((u) => u.inVocabulary).map((u) => u.tag)), [usage]);

  const rows = useMemo(() => {
    const groupIndex = new Map(groups.map((g, i) => [g.name, i]));
    return usage
      .filter((u) => !query || u.tag.includes(query))
      .filter((u) =>
        filter === "vocab"
          ? u.inVocabulary
          : filter === "outside"
            ? !u.inVocabulary
            : filter === "unused"
              ? u.photos + u.plants === 0
              : true
      )
      .sort(
        (a, b) =>
          (groupIndex.get(groupOf.get(a.tag) ?? "") ?? 99) - (groupIndex.get(groupOf.get(b.tag) ?? "") ?? 99) ||
          b.photos + b.plants - (a.photos + a.plants)
      );
  }, [usage, groups, groupOf, query, filter]);

  const outsideCount = usage.filter((u) => !u.inVocabulary).length;

  function describe(c: { photos: number; plants: number }) {
    return `更新了 ${c.photos} 张图片、${c.plants} 种植物`;
  }

  return (
    <div className="tags-tab">
      <p className="muted">
        改名或合并会同时更新 tags.md、所有图片和植物资料。合并：把标签改成词表中已有的另一个标签（例如把“秋黄”改成“秋天变黄”）。
      </p>

      <div className="filters">
        <input value={query} placeholder="搜索标签" onChange={(e) => setQuery(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">全部（{usage.length}）</option>
          <option value="vocab">词表中的标签</option>
          <option value="outside">不在词表中（{outsideCount}）</option>
          <option value="unused">没有使用</option>
        </select>
        <span className="filters-spacer" />
        <input
          value={newTag.tag}
          placeholder="新标签"
          onChange={(e) => setNewTag({ ...newTag, tag: e.target.value })}
        />
        <select value={newTag.group} onChange={(e) => setNewTag({ ...newTag, group: e.target.value })}>
          {[...groups.map((g) => g.name), ...(groups.some((g) => g.name === CUSTOM_GROUP) ? [] : [CUSTOM_GROUP])].map(
            (name) => (
              <option key={name}>{name}</option>
            )
          )}
        </select>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!newTag.tag.trim()}
          onClick={() =>
            run(async () => {
              await api("/api/admin/tags", { method: "POST", json: newTag });
              setNewTag({ ...newTag, tag: "" });
              return `已添加“${newTag.tag.trim()}”`;
            })
          }
        >
          添加到词表
        </button>
      </div>

      {message && <p className={message.type === "error" ? "error" : "muted"}>{message.text}</p>}

      <div className="matrix-wrap">
        <table className="matrix tag-table">
          <thead>
            <tr>
              <th>标签</th>
              <th>分组</th>
              <th>图片</th>
              <th>植物</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.tag}>
                <th>{u.tag}</th>
                <td>
                  {u.inVocabulary ? (
                    <span className="muted">{groupOf.get(u.tag)}</span>
                  ) : (
                    <span className="badge badge-warn">不在词表</span>
                  )}
                </td>
                <td>{u.photos || ""}</td>
                <td>{u.plants || ""}</td>
                <td className="tag-actions">
                  {renaming?.from === u.tag ? (
                    <>
                      <input
                        list="tag-vocab"
                        value={renaming.to}
                        autoFocus
                        onChange={(e) => setRenaming({ ...renaming, to: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        disabled={!renaming.to.trim() || renaming.to.trim() === u.tag}
                        onClick={() =>
                          run(async () => {
                            const to = renaming.to.trim();
                            const { changed } = await api<{ changed: { photos: number; plants: number } }>(
                              "/api/admin/tags",
                              { method: "PATCH", json: { from: u.tag, to } }
                            );
                            setRenaming(null);
                            return `${known.has(to) ? "已合并到" : "已改名为"}“${to}”，${describe(changed)}`;
                          })
                        }
                      >
                        {known.has(renaming.to.trim()) ? "合并" : "改名"}
                      </button>
                      <button type="button" className="btn btn-small btn-ghost" onClick={() => setRenaming(null)}>
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => setRenaming({ from: u.tag, to: u.tag })}
                      >
                        改名 / 合并
                      </button>
                      {!u.inVocabulary && (
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() =>
                            run(async () => {
                              await api("/api/admin/tags", { method: "POST", json: { tag: u.tag } });
                              return `已把“${u.tag}”加入“${CUSTOM_GROUP}”分组`;
                            })
                          }
                        >
                          加入词表
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => {
                          const used = u.photos + u.plants;
                          if (
                            !confirm(
                              used > 0
                                ? `“${u.tag}”正在被 ${u.photos} 张图片、${u.plants} 种植物使用，删除后会从它们中移除。确定删除？`
                                : `删除“${u.tag}”？`
                            )
                          )
                            return;
                          run(async () => {
                            const { changed } = await api<{ changed: { photos: number; plants: number } }>(
                              "/api/admin/tags",
                              { method: "DELETE", json: { tag: u.tag } }
                            );
                            return `已删除“${u.tag}”，${describe(changed)}`;
                          });
                        }}
                      >
                        删除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <datalist id="tag-vocab">
        {[...known].map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}
