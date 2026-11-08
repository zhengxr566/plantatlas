"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export type SearchEntry = {
  name: string;
  // 学名或上级分类，显示在名称后面并参与搜索
  sub: string;
  href: string;
  kind: "plant" | "genus" | "family";
};

const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  plant: "植物",
  genus: "属",
  family: "科",
};
const MAX_RESULTS = 8;

// 全站搜索：中文名、学名、科名、属名，输入时即时显示结果
export default function SiteSearch({
  entries,
  autoFocus = false,
  onNavigate,
}: {
  entries: SearchEntry[];
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const score = (e: SearchEntry) => {
      const name = e.name.toLowerCase();
      const sub = e.sub.toLowerCase();
      if (name === q) return 0;
      if (name.startsWith(q)) return 1;
      if (name.includes(q)) return 2;
      if (sub.startsWith(q)) return 3;
      if (sub.includes(q)) return 4;
      return 99;
    };
    return entries
      .map((e) => ({ e, s: score(e) }))
      .filter((r) => r.s < 99)
      // 同分时植物排在科、属前面
      .sort((a, b) => a.s - b.s || (a.e.kind === "plant" ? -1 : 1) - (b.e.kind === "plant" ? -1 : 1))
      .slice(0, MAX_RESULTS)
      .map((r) => r.e);
  }, [entries, query]);

  function go(entry?: SearchEntry) {
    const term = query.trim();
    if (!entry) {
      // 搜不到的词：可以作为下一批收录植物的参考
      if (term) track("search", { search_term: term, source: "header", results: 0 });
      return;
    }
    track("search", {
      search_term: term,
      source: "header",
      results: results.length,
      result_type: entry.kind,
      result_name: entry.name,
    });
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    onNavigate?.();
    router.push(entry.href);
  }

  return (
    <div className="site-search" role="search">
      <input
        ref={inputRef}
        type="search"
        value={query}
        autoFocus={autoFocus}
        placeholder="搜索植物、科、属"
        aria-label="搜索植物、科、属"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && query.trim().length > 0}
        aria-controls="site-search-results"
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      {open && query.trim() && (
        <ul id="site-search-results" className="site-search-results" role="listbox">
          {results.length === 0 && <li className="site-search-empty">没有找到“{query.trim()}”</li>}
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? "site-search-item site-search-item-on" : "site-search-item"}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                <span className="site-search-kind">{KIND_LABEL[r.kind]}</span>
                <strong>{r.name}</strong>
                <span className="site-search-sub">{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
