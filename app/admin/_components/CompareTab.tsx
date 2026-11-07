"use client";

import { useMemo, useState } from "react";
import PlantPicker from "./PlantPicker";
import { api, type AdminData } from "./types";

type Draft = { plantA: string; plantB: string; keyPoints: string; intro: string };

const SOURCE_LABEL: Record<string, string> = {
  similar: "similar 列",
  manual: "手写",
  photo: "图片标签",
};

export default function CompareTab({
  data,
  onChanged,
}: {
  data: AdminData;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "indexable" | "noindex">("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");

  const name = (slug: string) => data.plants.find((p) => p.slug === slug)?.nameCn ?? slug;
  const partName = (slug: string) => data.parts.find((p) => p.slug === slug)?.nameCn ?? slug;

  function noteFor(a: string, b: string) {
    return data.compareNotes.find(
      (n) => (n.plantA === a && n.plantB === b) || (n.plantA === b && n.plantB === a)
    );
  }

  function openDraft(plantA: string, plantB: string) {
    const note = noteFor(plantA, plantB);
    setDraft({
      plantA,
      plantB,
      keyPoints: (note?.keyPoints ?? "").split("|").filter(Boolean).join("\n"),
      intro: note?.intro ?? "",
    });
    setMessage("");
  }

  const pairs = useMemo(
    () =>
      data.pairs.filter(
        (p) =>
          (!query || p.title.includes(query)) &&
          (filter === "all" || (filter === "indexable" ? p.indexable : !p.indexable))
      ),
    [data.pairs, query, filter]
  );

  async function save() {
    if (!draft) return;
    try {
      await api("/api/admin/compare", {
        method: "PUT",
        json: {
          plantA: draft.plantA,
          plantB: draft.plantB,
          keyPoints: draft.keyPoints.split(/\r?\n/),
          intro: draft.intro,
        },
      });
      setMessage(
        draft.keyPoints.trim() || draft.intro.trim()
          ? "已保存，对比页会显示“核心区别”并变为可收录"
          : "已删除这条手写对比"
      );
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  const pairSlug = draft
    ? data.pairs.find(
        (p) =>
          (p.plantA === draft.plantA && p.plantB === draft.plantB) ||
          (p.plantA === draft.plantB && p.plantB === draft.plantA)
      )?.slug ?? `${draft.plantA}-vs-${draft.plantB}`
    : "";

  return (
    <div className="compare-tab">
      <div className="filters">
        <input value={query} placeholder="搜索对比（中文名）" onChange={(e) => setQuery(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">全部</option>
          <option value="indexable">可收录</option>
          <option value="noindex">noindex（待补充）</option>
        </select>
        <button type="button" className="btn" onClick={() => openDraft("", "")}>
          新建对比
        </button>
        <span className="muted">{pairs.length} 组</span>
      </div>

      <div className="library-layout">
        <ul className="pair-list">
          {pairs.map((p) => (
            <li key={p.slug}>
              <button type="button" className="pair-row" onClick={() => openDraft(p.plantA, p.plantB)}>
                <span className={p.indexable ? "badge badge-ok" : "badge badge-warn"}>
                  {p.indexable ? "可收录" : "noindex"}
                </span>
                <strong>{p.title}</strong>
                <span className="muted">
                  {p.sources.map((s) => SOURCE_LABEL[s] ?? s).join(" + ")}
                  {p.parts.length > 0 && ` · 图片对比：${p.parts.map(partName).join("、")}`}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {draft && (
          <aside className="panel library-editor">
            <h2>{draft.plantA && draft.plantB ? `${name(draft.plantA)} vs ${name(draft.plantB)}` : "新建对比"}</h2>
            <label className="field">
              <span>植物 A</span>
              <PlantPicker plants={data.plants} value={draft.plantA} onChange={(v) => setDraft({ ...draft, plantA: v })} />
            </label>
            <label className="field">
              <span>植物 B</span>
              <PlantPicker plants={data.plants} value={draft.plantB} onChange={(v) => setDraft({ ...draft, plantB: v })} />
            </label>
            <label className="field">
              <span>核心区别（每行一条）</span>
              <textarea
                rows={5}
                value={draft.keyPoints}
                placeholder={"看叶尖：银杏叶顶端波状或有缺刻，鹅掌楸叶顶端平截\n看叶脉：银杏为放射状脉，鹅掌楸为羽状网脉"}
                onChange={(e) => setDraft({ ...draft, keyPoints: e.target.value })}
              />
            </label>
            <label className="field">
              <span>开头段落（可选，替换模板文字）</span>
              <textarea rows={4} value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} />
            </label>
            <div className="queue-item-actions">
              <button type="button" className="btn btn-primary" onClick={save} disabled={!draft.plantA || !draft.plantB}>
                保存
              </button>
              {draft.plantA && draft.plantB && (
                <a className="btn" href={`/compare/${pairSlug}`} target="_blank" rel="noopener">
                  查看页面
                </a>
              )}
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
                关闭
              </button>
            </div>
            <p className="muted">清空内容并保存会删除这条手写对比。</p>
            {message && <p className="muted">{message}</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
