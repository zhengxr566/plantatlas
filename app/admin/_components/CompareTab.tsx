"use client";

import { useMemo, useState } from "react";
import { getCorePartSlugs } from "@/data/parts";
import PlantPicker from "./PlantPicker";
import { api, type AdminData, type AdminPair } from "./types";

type Draft = { plantA: string; plantB: string; keyPoints: string; intro: string };
type Candidate = {
  plantA: string;
  plantB: string;
  nameA: string;
  nameB: string;
  score: number;
  reasons: string[];
};
type Hint = { plant: string; part: string; label: string };

const SOURCE_LABEL: Record<string, string> = {
  similar: "similar 列",
  manual: "手写",
  photo: "图片标签",
};

// 补拍提示优先推荐的部位顺序
const HINT_PART_ORDER = ["leaf", "bark", "habit", "flower", "fruit", "cone", "seed"];
const IGNORED_KEY = "admin-compare-ignored";

function readIgnored(): string[] {
  try {
    return JSON.parse(localStorage.getItem(IGNORED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function CompareTab({
  data,
  onChanged,
  onPick,
}: {
  data: AdminData;
  onChanged: () => void;
  onPick: (plant: string, part: string) => void;
}) {
  const [view, setView] = useState<"pairs" | "candidates">("pairs");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "indexable" | "noindex">("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [candidateMessage, setCandidateMessage] = useState("");

  const plantOf = (slug: string) => data.plants.find((p) => p.slug === slug);
  const name = (slug: string) => plantOf(slug)?.nameCn ?? slug;
  const partName = (slug: string) => data.parts.find((p) => p.slug === slug)?.nameCn ?? slug;
  const pairKey = (a: string, b: string) => [a, b].sort().join("__");

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

  // 还没被收录的对比：差哪些照片。只差一方的部位优先（补一张就能收录）
  function photoHints(p: AdminPair): Hint[] {
    if (p.indexable) return [];
    const a = plantOf(p.plantA);
    const b = plantOf(p.plantB);
    if (!a || !b) return [];
    const has = (plant: string, part: string) =>
      data.photos.some((ph) => ph.plant === plant && ph.part === part);
    const coreB = getCorePartSlugs(b.division, b.className);
    const parts = HINT_PART_ORDER.filter(
      (part) => getCorePartSlugs(a.division, a.className).includes(part) && coreB.includes(part)
    );

    const oneSide = parts.filter((part) => has(p.plantA, part) !== has(p.plantB, part));
    if (oneSide.length > 0) {
      return oneSide.slice(0, 3).map((part) => {
        const plant = has(p.plantA, part) ? p.plantB : p.plantA;
        return { plant, part, label: `补拍 ${name(plant)}·${partName(part)}` };
      });
    }
    const part = parts[0] ?? "leaf";
    return [p.plantA, p.plantB].map((plant) => ({
      plant,
      part,
      label: `拍 ${name(plant)}·${partName(part)}`,
    }));
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

  const visibleCandidates = (candidates ?? []).filter(
    (c) =>
      !ignored.includes(pairKey(c.plantA, c.plantB)) &&
      (!query || c.nameA.includes(query) || c.nameB.includes(query))
  );

  function loadCandidates() {
    setIgnored(readIgnored());
    api<{ candidates: Candidate[] }>("/api/admin/compare/candidates")
      .then((d) => setCandidates(d.candidates))
      .catch((e: Error) => setCandidateMessage(e.message));
  }

  function switchView(next: "pairs" | "candidates") {
    setView(next);
    if (next === "candidates" && candidates === null) loadCandidates();
  }

  async function acceptCandidate(c: Candidate) {
    try {
      await api("/api/admin/compare/candidates", {
        method: "POST",
        json: { plantA: c.plantA, plantB: c.plantB },
      });
      setCandidates((list) => (list ?? []).filter((x) => x !== c));
      setCandidateMessage(`已把“${c.nameB}”加入${c.nameA}的相似植物，对比页已生成`);
      onChanged();
    } catch (e) {
      setCandidateMessage((e as Error).message);
    }
  }

  function ignoreCandidate(c: Candidate) {
    const next = [...ignored, pairKey(c.plantA, c.plantB)];
    setIgnored(next);
    try {
      localStorage.setItem(IGNORED_KEY, JSON.stringify(next));
    } catch {
      // 浏览器禁止本地存储时只在本次会话中忽略
    }
  }

  async function generateDraft() {
    if (!draft?.plantA || !draft.plantB) return;
    if (draft.keyPoints.trim() && !confirm("用自动草稿替换当前的核心区别？")) return;
    try {
      const result = await api<{ keyPoints: string[] }>(
        `/api/admin/compare/draft?plantA=${encodeURIComponent(draft.plantA)}&plantB=${encodeURIComponent(draft.plantB)}`
      );
      setDraft({ ...draft, keyPoints: result.keyPoints.join("\n") });
      setMessage("已生成草稿：请检查、修改后再保存（草稿来自图片标签和图鉴描述）");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

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
        <div className="segmented">
          <button
            type="button"
            className={view === "pairs" ? "seg seg-on" : "seg"}
            onClick={() => switchView("pairs")}
          >
            已有对比（{data.pairs.length}）
          </button>
          <button
            type="button"
            className={view === "candidates" ? "seg seg-on" : "seg"}
            onClick={() => switchView("candidates")}
          >
            推荐新对比{candidates ? `（${visibleCandidates.length}）` : ""}
          </button>
        </div>
        <input value={query} placeholder="搜索（中文名）" onChange={(e) => setQuery(e.target.value)} />
        {view === "pairs" && (
          <>
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">全部</option>
              <option value="indexable">可收录</option>
              <option value="noindex">noindex（待补充）</option>
            </select>
            <button type="button" className="btn" onClick={() => openDraft("", "")}>
              新建对比
            </button>
            <span className="muted">{pairs.length} 组</span>
          </>
        )}
      </div>

      {view === "candidates" ? (
        <div className="candidates">
          <p className="muted">
            根据同属、相同识别特征（越少见的特征权重越高）和相似的部位照片自动推荐。
            “加入对比”会把它写进植物资料的相似植物，对比页立即生成；“忽略”只在这台电脑上隐藏。
          </p>
          {candidateMessage && <p className="muted">{candidateMessage}</p>}
          {candidates === null && <p className="muted">计算中…</p>}
          <ul className="pair-list">
            {visibleCandidates.map((c) => (
              <li key={pairKey(c.plantA, c.plantB)} className="pair-row candidate-row">
                <span className="badge">{c.score}</span>
                <strong>
                  {c.nameA} vs {c.nameB}
                </strong>
                <span className="muted">{c.reasons.join("；")}</span>
                <span className="candidate-actions">
                  <button type="button" className="btn btn-small btn-primary" onClick={() => acceptCandidate(c)}>
                    加入对比
                  </button>
                  <button type="button" className="btn btn-small btn-ghost" onClick={() => ignoreCandidate(c)}>
                    忽略
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {ignored.length > 0 && (
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => {
                setIgnored([]);
                try {
                  localStorage.removeItem(IGNORED_KEY);
                } catch {}
              }}
            >
              显示已忽略的 {ignored.length} 组
            </button>
          )}
        </div>
      ) : (
        <div className="library-layout">
          <ul className="pair-list">
            {pairs.map((p) => {
              const hints = photoHints(p);
              return (
                <li key={p.slug} className="pair-item">
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
                  {hints.length > 0 && (
                    <div className="pair-hints">
                      <span className="muted">要被收录：</span>
                      {hints.map((h) => (
                        <button
                          key={`${h.plant}-${h.part}`}
                          type="button"
                          className="chip"
                          title="跳到上传页并预填植物和部位"
                          onClick={() => onPick(h.plant, h.part)}
                        >
                          {h.label}
                        </button>
                      ))}
                      <span className="muted">或</span>
                      <button type="button" className="chip" onClick={() => openDraft(p.plantA, p.plantB)}>
                        写核心区别
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
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
              <div className="field">
                <span>
                  核心区别（每行一条）
                  <button
                    type="button"
                    className="btn btn-small draft-btn"
                    disabled={!draft.plantA || !draft.plantB}
                    onClick={generateDraft}
                  >
                    生成草稿
                  </button>
                </span>
                <textarea
                  rows={6}
                  value={draft.keyPoints}
                  placeholder={"看叶尖：银杏叶顶端波状或有缺刻，鹅掌楸叶顶端平截\n看叶脉：银杏为放射状脉，鹅掌楸为羽状网脉"}
                  onChange={(e) => setDraft({ ...draft, keyPoints: e.target.value })}
                />
              </div>
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
      )}
    </div>
  );
}
