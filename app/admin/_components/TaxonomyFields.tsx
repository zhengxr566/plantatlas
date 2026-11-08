"use client";

import { useMemo } from "react";

export type PlantRowData = Record<string, string>;

const TAXONOMY_FIELDS: { key: string; label: string }[] = [
  { key: "className", label: "纲" },
  { key: "classSlug", label: "纲标识" },
  { key: "order", label: "目" },
  { key: "orderSlug", label: "目标识" },
  { key: "family", label: "科" },
  { key: "familySlug", label: "科标识" },
  { key: "genus", label: "属" },
  { key: "genusSlug", label: "属标识" },
];

const UPPER_KEYS = ["division", "className", "classSlug", "order", "orderSlug", "family", "familySlug"];

// 学名 → 网址标识，例如 "Pinus bungeana" → "pinus-bungeana"
export function slugify(latin: string) {
  return latin
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function emptyPlantRow(columns: string[]): PlantRowData {
  return Object.fromEntries(columns.map((c) => [c, c === "kingdom" ? "植物界" : ""]));
}

// 分类字段：选择已有的属或科会自动填写上级分类
export default function TaxonomyFields({
  row,
  rows,
  onChange,
}: {
  row: PlantRowData;
  rows: PlantRowData[];
  onChange: (patch: PlantRowData) => void;
}) {
  const genera = useMemo(() => {
    const map = new Map<string, PlantRowData>();
    rows.forEach((r) => map.set(r.genusSlug, r));
    return [...map.values()].sort((a, b) => a.family.localeCompare(b.family, "zh"));
  }, [rows]);
  const families = useMemo(() => {
    const map = new Map<string, PlantRowData>();
    rows.forEach((r) => map.set(r.familySlug, r));
    return [...map.values()].sort((a, b) => a.family.localeCompare(b.family, "zh"));
  }, [rows]);

  const pick = (source: PlantRowData, keys: string[]) =>
    Object.fromEntries(keys.map((k) => [k, source[k]]));

  return (
    <>
      <div className="field-row">
        <label className="field">
          <span>选择已有的属（自动填写上级分类）</span>
          <select
            value=""
            onChange={(e) => {
              const g = genera.find((x) => x.genusSlug === e.target.value);
              if (g) onChange(pick(g, [...UPPER_KEYS, "genus", "genusSlug"]));
            }}
          >
            <option value="">—</option>
            {genera.map((g) => (
              <option key={g.genusSlug} value={g.genusSlug}>
                {g.genus} · {g.family}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>或选择已有的科（新属时用）</span>
          <select
            value=""
            onChange={(e) => {
              const f = families.find((x) => x.familySlug === e.target.value);
              if (f) onChange({ ...pick(f, UPPER_KEYS), genus: "", genusSlug: "" });
            }}
          >
            <option value="">—</option>
            {families.map((f) => (
              <option key={f.familySlug} value={f.familySlug}>
                {f.family} · {f.order}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>类群</span>
          <select value={row.division ?? ""} onChange={(e) => onChange({ division: e.target.value })}>
            <option value="">—</option>
            <option>裸子植物</option>
            <option>被子植物</option>
          </select>
        </label>
      </div>
      <div className="field-grid-4">
        {TAXONOMY_FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input value={row[f.key] ?? ""} onChange={(e) => onChange({ [f.key]: e.target.value })} />
          </label>
        ))}
      </div>
      <p className="muted">标识用小写英文和 -，通常取拉丁名，例如 松科 → pinaceae、松属 → pinus。</p>
    </>
  );
}
