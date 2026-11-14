"use client";

import { useMemo, useState } from "react";
import { plantLabel, type AdminPlant } from "./types";

// 可搜索的植物选择框：支持中文名、学名、slug
export default function PlantPicker({
  plants,
  value,
  onChange,
  placeholder = "搜索植物（中文名 / 学名）",
  onCreate,
}: {
  plants: AdminPlant[];
  value: string;
  onChange: (slug: string) => void;
  placeholder?: string;
  // 提供时，搜索不到会显示“新增植物”
  onCreate?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = plants.find((p) => p.slug === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plants
      .filter(
        (p) =>
          !q ||
          p.nameCn.includes(q) ||
          p.nameLatin.toLowerCase().includes(q) ||
          p.slug.includes(q)
      )
      .slice(0, 40);
  }, [plants, query]);

  return (
    <div className="plant-picker">
      <input
        value={open ? query : plantLabel(selected)}
        placeholder={placeholder}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            e.preventDefault();
            onChange(matches[0].slug);
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {open && (
        <ul className="plant-picker-list">
          {matches.length === 0 && !onCreate && <li className="muted">没有匹配的植物</li>}
          {matches.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p.slug);
                  setOpen(false);
                }}
              >
                <strong>{p.nameCn}</strong>
                <span className="muted">
                  {" "}
                  {p.nameLatin} · {p.family}
                </span>
              </button>
            </li>
          ))}
          {onCreate && query.trim() && !plants.some((p) => p.nameCn === query.trim()) && (
            <li>
              <button
                type="button"
                className="plant-picker-create"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onCreate(query.trim());
                  setOpen(false);
                }}
              >
                + 新增植物「{query.trim()}」
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
