"use client";

import { useEffect, useState } from "react";
import TaxonomyFields, { emptyPlantRow, slugify, type PlantRowData } from "./TaxonomyFields";
import { api } from "./types";

// 上传图片时发现植物还没收录：只填名称和分类即可新建，描述以后在“植物资料”补充
export default function QuickPlantDialog({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName: string;
  onCreated: (slug: string) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<PlantRowData[]>([]);
  const [row, setRow] = useState<PlantRowData | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ rows: PlantRowData[]; columns: string[] }>("/api/admin/plants")
      .then((d) => {
        setRows(d.rows);
        // 输入的是学名（英文）时放进学名，否则当作中文名
        const latin = /^[a-z\s.-]+$/i.test(initialName.trim());
        setRow({
          ...emptyPlantRow(d.columns),
          nameCn: latin ? "" : initialName.trim(),
          nameLatin: latin ? initialName.trim() : "",
          slug: latin ? slugify(initialName) : "",
        });
      })
      .catch((e: Error) => setError(e.message));
  }, [initialName]);

  function set(patch: PlantRowData) {
    if (!row) return;
    const next = { ...row, ...patch };
    if ("slug" in patch) setAutoSlug(false);
    if ("nameLatin" in patch && autoSlug) next.slug = slugify(patch.nameLatin);
    setRow(next);
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/plants", { method: "POST", json: { row } });
      onCreated(row.slug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal panel quick-plant" onClick={(e) => e.stopPropagation()}>
        <h2>新增植物</h2>
        <p className="muted">先填写名称和分类就能上传图片；叶、花、果等描述可以之后在“植物资料”页签补充。</p>
        {!row && !error && <p className="muted">加载中…</p>}
        {row && (
          <>
            <div className="field-row">
              <label className="field">
                <span>中文名</span>
                <input value={row.nameCn} autoFocus onChange={(e) => set({ nameCn: e.target.value })} />
              </label>
              <label className="field">
                <span>学名</span>
                <input
                  value={row.nameLatin}
                  placeholder="例如 Acer palmatum"
                  onChange={(e) => set({ nameLatin: e.target.value })}
                />
              </label>
              <label className="field">
                <span>网址标识（根据学名生成）</span>
                <input value={row.slug} onChange={(e) => set({ slug: e.target.value })} />
              </label>
            </div>
            <TaxonomyFields row={row} rows={rows} onChange={set} />
            <label className="field">
              <span>生活型（可选，如 落叶乔木）</span>
              <input value={row.habit ?? ""} onChange={(e) => set({ habit: e.target.value })} />
            </label>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <div className="queue-item-actions">
          <button type="button" className="btn btn-primary" disabled={!row || saving} onClick={save}>
            {saving ? "保存中…" : "新增并选择"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
