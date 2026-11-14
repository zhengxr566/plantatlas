"use client";

import { useEffect, useMemo, useState } from "react";
import PlantPicker from "./PlantPicker";
import TagPicker from "./TagPicker";
import TaxonomyFields, { emptyPlantRow as emptyRow, slugify } from "./TaxonomyFields";
import { api, splitTags, type AdminData } from "./types";

type Row = Record<string, string>;

const TEXT_FIELDS: { key: string; label: string; rows?: number }[] = [
  { key: "habit", label: "生活型（如 落叶乔木）" },
  { key: "leaf", label: "叶片", rows: 2 },
  { key: "flower", label: "花", rows: 2 },
  { key: "fruit", label: "果实 / 种子", rows: 2 },
  { key: "bark", label: "树皮", rows: 2 },
  { key: "environment", label: "生长环境", rows: 2 },
];

export default function PlantsTab({
  data,
  onChanged,
  onAddTag,
}: {
  data: AdminData;
  onChanged: () => void;
  onAddTag: (tag: string, group?: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ row: Row; isNew: boolean; autoSlug: boolean } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function load() {
    return api<{ rows: Row[]; columns: string[] }>("/api/admin/plants").then((d) => {
      setRows(d.rows);
      setColumns(d.columns);
    });
  }

  useEffect(() => {
    api<{ rows: Row[]; columns: string[] }>("/api/admin/plants")
      .then((d) => {
        setRows(d.rows);
        setColumns(d.columns);
      })
      .catch((e: Error) => setMessage({ type: "error", text: e.message }));
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        !q ||
        r.nameCn.includes(q) ||
        (r.aliases || "").includes(q) ||
        r.nameLatin.toLowerCase().includes(q) ||
        r.family.includes(q) ||
        r.genus.includes(q) ||
        r.slug.includes(q)
    );
  }, [rows, query]);

  // “相似植物”里写了、但 plants.csv 还没有的植物：值得补充的清单
  const missing = useMemo(() => {
    const names = new Set(rows.map((r) => r.nameCn));
    const map = new Map<string, Row[]>();
    rows.forEach((r) =>
      (r.similar || "")
        .split("|")
        .filter((n) => n && !names.has(n))
        .forEach((n) => map.set(n, [...(map.get(n) ?? []), r]))
    );
    return [...map].sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  // 新建被引用的植物：中文名、相似植物和分类先复制自引用它的植物
  function createMissing(name: string, ref: Row) {
    if (!confirmDiscard()) return;
    const taxonomyKeys = ["division", "className", "classSlug", "order", "orderSlug", "family", "familySlug", "genus", "genusSlug"];
    const row = emptyRow(columns);
    taxonomyKeys.forEach((k) => (row[k] = ref[k]));
    row.nameCn = name;
    row.similar = ref.nameCn;
    setEditing({ row, isNew: true, autoSlug: true });
    setDirty(true);
    setMessage({
      type: "ok",
      text: `分类信息复制自${ref.nameCn}（${ref.genus}），请确认是否正确，并填写学名和描述`,
    });
  }

  const photoCount = (slug: string) => data.photos.filter((p) => p.plant === slug).length;

  function confirmDiscard() {
    return !dirty || confirm("有未保存的修改，确定放弃吗？");
  }

  function open(row: Row, isNew: boolean) {
    if (!confirmDiscard()) return;
    setEditing({ row: { ...row }, isNew, autoSlug: isNew && !row.slug });
    setDirty(false);
    setMessage(null);
  }

  function set(key: string, value: string) {
    if (!editing) return;
    const row = { ...editing.row, [key]: value };
    let autoSlug = editing.autoSlug;
    if (key === "slug") autoSlug = false;
    if (key === "nameLatin" && editing.isNew && autoSlug) row.slug = slugify(value);
    setEditing({ ...editing, row, autoSlug });
    setDirty(true);
  }

  async function save() {
    if (!editing) return;
    try {
      const result = await api<{ row: Row; warnings: string[] }>("/api/admin/plants", {
        method: editing.isNew ? "POST" : "PUT",
        json: { row: editing.row },
      });
      await load();
      setEditing({ row: result.row, isNew: false, autoSlug: false });
      setDirty(false);
      setMessage({
        type: "ok",
        text: ["已保存", ...result.warnings].join("。"),
      });
      onChanged();
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    }
  }

  async function remove() {
    if (!editing || editing.isNew) return;
    if (!confirm(`删除 ${editing.row.nameCn}？这会从 plants.csv 中移除这种植物。`)) return;
    try {
      await api("/api/admin/plants", { method: "DELETE", json: { slug: editing.row.slug } });
      await load();
      setEditing(null);
      setDirty(false);
      onChanged();
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    }
  }

  const row = editing?.row;
  const similar = row ? splitTags((row.similar || "").replace(/[、,，]/g, "|")) : [];

  return (
    <div className="plants-tab">
      <div className="filters">
        <input value={query} placeholder="搜索中文名、学名、科、属" onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => open(emptyRow(columns), true)}>
          新增植物
        </button>
        <span className="muted">{list.length} 种</span>
      </div>

      {missing.length > 0 && (
        <details className="panel missing-plants">
          <summary>
            被引用但还没收录的植物（{missing.length}）
            <span className="muted"> — 出现在其他植物的“相似植物”中，收录后会自动生成对比页</span>
          </summary>
          <div className="missing-list">
            {missing.map(([name, refs]) => (
              <button
                key={name}
                type="button"
                className="chip"
                title={`被 ${refs.map((r) => r.nameCn).join("、")} 引用`}
                onClick={() => createMissing(name, refs[0])}
              >
                + {name}
                <span className="muted"> · {refs.map((r) => r.nameCn).join("、")}</span>
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="library-layout">
        <ul className="pair-list">
          {list.map((r) => (
            <li key={r.slug}>
              <button
                type="button"
                className={editing?.row.slug === r.slug && !editing.isNew ? "pair-row pair-row-on" : "pair-row"}
                onClick={() => open(r, false)}
              >
                <strong>{r.nameCn}</strong>
                <span className="muted">
                  {r.nameLatin} · {r.family} · {r.genus}
                </span>
                {photoCount(r.slug) > 0 && <span className="badge">{photoCount(r.slug)} 张图</span>}
              </button>
            </li>
          ))}
        </ul>

        {editing && row && (
          <aside className="panel library-editor plant-editor">
            <h2>
              {editing.isNew ? "新增植物" : row.nameCn}
              {dirty && <span className="badge badge-warn"> 未保存</span>}
            </h2>

            <h3>基本信息</h3>
            <div className="field-row">
              <label className="field">
                <span>中文名</span>
                <input value={row.nameCn} onChange={(e) => set("nameCn", e.target.value)} />
              </label>
              <label className="field">
                <span>学名</span>
                <input value={row.nameLatin} onChange={(e) => set("nameLatin", e.target.value)} />
              </label>
              <label className="field">
                <span>网址标识{editing.isNew ? "（根据学名生成）" : "（不可修改）"}</span>
                <input value={row.slug} readOnly={!editing.isNew} onChange={(e) => set("slug", e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>别名（俗名、旧名等，用 、 或 | 分隔；会显示在植物页并参与搜索）</span>
              <input
                value={(row.aliases || "").split("|").join("、")}
                placeholder="例如 白果树、公孙树"
                onChange={(e) => set("aliases", e.target.value.replace(/[、,，]/g, "|"))}
              />
            </label>
            {row.slug && <p className="muted">页面地址：/plant/{row.slug}</p>}

            <h3>分类</h3>
            <TaxonomyFields
              row={row}
              rows={rows}
              onChange={(patch) => {
                setEditing({ ...editing, row: { ...row, ...patch } });
                setDirty(true);
              }}
            />

            <h3>形态与生境</h3>
            {TEXT_FIELDS.map((f) => (
              <label key={f.key} className="field">
                <span>{f.label}</span>
                {f.rows ? (
                  <textarea rows={f.rows} value={row[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                ) : (
                  <input value={row[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </label>
            ))}

            <label className="field">
              <span>用途（用 、 分隔）</span>
              <input
                value={(row.usage ?? "").split("|").join("、")}
                onChange={(e) => set("usage", e.target.value.replace(/[、,，]/g, "|"))}
              />
            </label>

            <div className="field">
              <span>植物标签（用于识别页）</span>
              <TagPicker
                value={splitTags(row.tags ?? "")}
                onChange={(tags) => set("tags", tags.join("|"))}
                groups={data.tagGroups}
                part="habit"
                onAddTag={onAddTag}
              />
            </div>

            <div className="field">
              <span>相似植物（会自动生成对比页）</span>
              <div className="tag-picker-selected">
                {similar.length === 0 && <span className="muted">无</span>}
                {similar.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={rows.some((r) => r.nameCn === name) ? "chip chip-on" : "chip"}
                    title={rows.some((r) => r.nameCn === name) ? "" : "还没有收录这种植物"}
                    onClick={() => set("similar", similar.filter((n) => n !== name).join("|"))}
                  >
                    {name} ×
                  </button>
                ))}
              </div>
              <PlantPicker
                plants={data.plants.filter((p) => p.slug !== row.slug)}
                value=""
                placeholder="添加相似植物"
                onChange={(slug) => {
                  const name = data.plants.find((p) => p.slug === slug)?.nameCn;
                  if (name && !similar.includes(name)) set("similar", [...similar, name].join("|"));
                }}
              />
            </div>

            <div className="queue-item-actions">
              <button type="button" className="btn btn-primary" onClick={save}>
                {editing.isNew ? "新增" : "保存"}
              </button>
              {!editing.isNew && (
                <>
                  <a className="btn" href={`/plant/${row.slug}`} target="_blank" rel="noopener">
                    查看页面
                  </a>
                  <button
                    type="button"
                    className="btn"
                    title="复制分类和描述，用于新增同属植物"
                    onClick={() =>
                      open({ ...row, slug: "", nameCn: "", nameLatin: "", similar: "" }, true)
                    }
                  >
                    复制为新植物
                  </button>
                  <button type="button" className="btn btn-danger" onClick={remove}>
                    删除
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (confirmDiscard()) {
                    setEditing(null);
                    setDirty(false);
                  }
                }}
              >
                关闭
              </button>
            </div>
            {message && <p className={message.type === "error" ? "error" : "muted"}>{message.text}</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
