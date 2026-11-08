"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { LineageNode, LineageLevel } from "@/lib/lineage";
import { track } from "@/lib/analytics";
import { variantPath } from "@/lib/imageVariants";

// ---------- 布局常量（画布坐标，缩放 k=1 时等于像素） ----------
const BOX_H = 34; // 上层（从上往下排列）节点的方框高度
const LEVEL_GAP = 40; // 上下两层方框之间的距离（直角连线在中间转折）
const COL_GAP = 24; // 左右相邻分支的间距
const INDENT = 20; // 下层列表每一级的缩进
const LIST_TOP = 10; // 方框到列表第一行的距离
const GROUP_H = 26; // 列表中的分类行（目、科、属）高度
const PLANT_H = 58; // 列表中的植物名片高度
const PLANT_W = 236;
const ROW_GAP = 4;
const MIN_K = 0.15;
const MAX_K = 2.2;
const FIT_MAX_K = 1.6; // 点击定位时最多放大到这个比例

// 从这一层开始改为纵向缩进列表（之前的层级从上往下、左右展开）
const COLUMN_DEPTH: Record<LineageLevel, number> = {
  root: 2, // 植物界 › 类群 › 纲（纲为列，下面是目、科、属、种的列表）
  division: 1,
  class: 0,
  order: 1,
  family: 1, // 科页面：每个属一列
  genus: 0,
  plant: 0,
};

type Transform = { x: number; y: number; k: number };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Vis = { id: string; node: LineageNode; depth: number; open: boolean; species: number; children?: Vis[] };
type Item = {
  id: string;
  node: LineageNode;
  kind: "box" | "group" | "plant";
  x: number;
  y: number;
  w: number;
  h: number;
  open: boolean;
  species: number;
  hasChildren: boolean;
  depth: number;
};
// 连线段：起点、终点，以及它属于哪个节点（用于高亮当前分支）
type Seg = [number, number, number, number, string];
type Block = { w: number; h: number; anchor: number; items: Item[]; segs: Seg[] };

function countSpecies(node: LineageNode): number {
  return node.children ? node.children.reduce((n, c) => n + countSpecies(c), 0) : 1;
}

function toVisible(node: LineageNode, id: string, depth: number, expanded: Set<string>): Vis {
  const open = Boolean(node.children) && expanded.has(id);
  return {
    id,
    node,
    depth,
    open,
    species: countSpecies(node),
    children: open
      ? node.children!.map((c) => toVisible(c, `${id}/${c.name}`, depth + 1, expanded))
      : undefined,
  };
}

// 粗略估算文字宽度（中文按 1 个字号，英文数字按 0.6 个字号）
function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += /[\x00-\xff]/.test(ch) ? size * 0.6 : size;
  return w;
}

function boxWidth(v: Vis) {
  return Math.max(72, textWidth(v.node.name, 14) + textWidth(` ${v.species}`, 12) + 28);
}

function groupWidth(v: Vis) {
  return textWidth(v.node.name, 13) + textWidth(` ${v.species}`, 11) + 26;
}

function shift(block: Block, dx: number, dy: number): Block {
  return {
    ...block,
    items: block.items.map((it) => ({ ...it, x: it.x + dx, y: it.y + dy })),
    segs: block.segs.map(([a, b, c, d, id]) => [a + dx, b + dy, c + dx, d + dy, id] as Seg),
  };
}

function item(v: Vis, kind: Item["kind"], x: number, y: number, w: number, h: number): Item {
  return {
    id: v.id,
    node: v.node,
    kind,
    x,
    y,
    w,
    h,
    open: v.open,
    species: v.species,
    hasChildren: Boolean(v.node.children),
    depth: v.depth,
  };
}

// 列：方框在上，下面是缩进列表；每个展开的节点有一条竖线，竖线向子项伸出短横线
function buildColumn(v: Vis): Block {
  const head = item(v, "box", 0, 0, boxWidth(v), BOX_H);
  const items: Item[] = [head];
  const segs: Seg[] = [];
  let y = BOX_H + LIST_TOP;

  function addChildren(parent: Item, children: Vis[], level: number) {
    const spineX = parent.x + 12;
    let lastCenter = parent.y + parent.h;
    for (const child of children) {
      const isPlant = child.node.level === "plant";
      const h = isPlant ? PLANT_H : GROUP_H;
      const x = level * INDENT + 12;
      const row = item(child, isPlant ? "plant" : "group", x, y, isPlant ? PLANT_W : groupWidth(child), h);
      items.push(row);
      const cy = y + h / 2;
      segs.push([spineX, cy, x, cy, child.id]);
      lastCenter = cy;
      y += h + ROW_GAP;
      if (child.open && child.children) addChildren(row, child.children, level + 1);
    }
    segs.push([spineX, parent.y + parent.h, spineX, lastCenter, parent.id]);
  }

  if (v.open && v.children) addChildren(head, v.children, 1);

  const w = Math.max(...items.map((it) => it.x + it.w));
  return { w, h: Math.max(BOX_H, y - ROW_GAP), anchor: head.w / 2, items, segs };
}

// 上层：方框从上往下，子分支左右排列，用直角折线连接
function buildTree(v: Vis, columnDepth: number): Block {
  if (v.depth >= columnDepth) return buildColumn(v);

  const w = boxWidth(v);
  if (!v.open || !v.children) {
    return { w, h: BOX_H, anchor: w / 2, items: [item(v, "box", 0, 0, w, BOX_H)], segs: [] };
  }

  const blocks = v.children.map((c) => buildTree(c, columnDepth));
  const offsets: number[] = [];
  let cursor = 0;
  blocks.forEach((b) => {
    offsets.push(cursor);
    cursor += b.w + COL_GAP;
  });
  const anchors = blocks.map((b, i) => offsets[i] + b.anchor);
  let center = (anchors[0] + anchors[anchors.length - 1]) / 2;
  const dx = Math.max(0, w / 2 - center);
  center += dx;

  const childTop = BOX_H + LEVEL_GAP;
  const midY = BOX_H + LEVEL_GAP / 2;
  const items: Item[] = [item(v, "box", center - w / 2, 0, w, BOX_H)];
  const segs: Seg[] = [[center, BOX_H, center, midY, v.id]];
  if (anchors.length > 1) segs.push([anchors[0] + dx, midY, anchors[anchors.length - 1] + dx, midY, v.id]);
  blocks.forEach((b, i) => {
    const moved = shift(b, offsets[i] + dx, childTop);
    items.push(...moved.items);
    segs.push(...moved.segs);
    segs.push([anchors[i] + dx, midY, anchors[i] + dx, childTop, v.children![i].id]);
  });

  return {
    w: Math.max(cursor - COL_GAP + dx, center + w / 2),
    h: childTop + Math.max(...blocks.map((b) => b.h)),
    anchor: center,
    items,
    segs,
  };
}

// 窄屏（手机）时整棵树改为一列缩进列表，避免横向排开后缩得太小
const NARROW_WIDTH = 600;

function computeLayout(data: LineageNode, expanded: Set<string>, narrow = false) {
  const columnDepth = narrow ? 0 : (COLUMN_DEPTH[data.level] ?? 0);
  return buildTree(toVisible(data, data.name, 0, expanded), columnDepth);
}

// 节点及其所有下级占据的范围（用于“定位”时适应画面）
function branchBounds(items: Item[], id: string): Box | null {
  const own = items.filter((it) => it.id === id || it.id.startsWith(`${id}/`));
  if (own.length === 0) return null;
  return {
    x0: Math.min(...own.map((it) => it.x)),
    y0: Math.min(...own.map((it) => it.y)),
    x1: Math.max(...own.map((it) => it.x + it.w)),
    y1: Math.max(...own.map((it) => it.y + it.h)),
  };
}

function allInnerIds(node: LineageNode, id: string, out = new Set<string>()) {
  if (!node.children) return out;
  out.add(id);
  node.children.forEach((c) => allInnerIds(c, `${id}/${c.name}`, out));
  return out;
}

function idsToDepth(node: LineageNode, id: string, depth: number, out = new Set<string>()) {
  if (!node.children || depth <= 0) return out;
  out.add(id);
  node.children.forEach((c) => idsToDepth(c, `${id}/${c.name}`, depth - 1, out));
  return out;
}

// 按名称查找植物或分类（先找完全一致，再找包含），返回从根到该节点的 id 路径
function findPath(root: LineageNode, query: string): { path: string[]; node: LineageNode } | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const names = (n: LineageNode) => [n.name.toLowerCase(), (n.card?.latin ?? "").toLowerCase()];
  const tests = [
    (n: LineageNode) => names(n).includes(q),
    (n: LineageNode) => names(n).some((s) => s.length > 0 && s.includes(q)),
  ];
  for (const test of tests) {
    const walk = (n: LineageNode, id: string, path: string[]): { path: string[]; node: LineageNode } | null => {
      const here = [...path, id];
      if (n !== root && test(n)) return { path: here, node: n };
      for (const c of n.children ?? []) {
        const found = walk(c, `${id}/${c.name}`, here);
        if (found) return found;
      }
      return null;
    };
    const found = walk(root, root.name, []);
    if (found) return found;
  }
  return null;
}

function parentId(id: string) {
  return id.includes("/") ? id.slice(0, id.lastIndexOf("/")) : id;
}

// 当前分支（自身、下级）或它的上级
function inBranch(id: string, focus: string) {
  return id === focus || id.startsWith(`${focus}/`) || focus.startsWith(`${id}/`);
}

const LEVEL_LABEL: Record<LineageLevel, string> = {
  root: "",
  division: "类群",
  class: "纲",
  order: "目",
  family: "科",
  genus: "属",
  plant: "种",
};

function subscribeFullscreen(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
}
const noopSubscribe = () => () => {};

function fitTransform(b: Box, width: number, height: number, maxK: number, narrow = false): Transform {
  // 上方留给位置栏，右侧留给缩放按钮
  const pad = { top: 52, right: 56, bottom: 20, left: 20 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  // 窄屏只按宽度适应（列表较长时从顶部开始，拖动查看下面）
  const k = Math.max(
    MIN_K,
    narrow
      ? Math.min(maxK, w / (b.x1 - b.x0))
      : Math.min(maxK, w / (b.x1 - b.x0), h / (b.y1 - b.y0))
  );
  const spareY = h - (b.y1 - b.y0) * k;
  return {
    k,
    x: pad.left + (w - (b.x1 - b.x0) * k) / 2 - b.x0 * k,
    y: pad.top + Math.max(0, spareY / 2) - b.y0 * k,
  };
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// 默认展开到列这一层（主页：植物界 › 类群 › 纲，纲下列出各个目）
function defaultExpanded(data: LineageNode, compact: boolean) {
  return compact
    ? allInnerIds(data, data.name)
    : idsToDepth(data, data.name, (COLUMN_DEPTH[data.level] ?? 0) + 1);
}

// 谱系树：上层从上往下分支，下层为缩进列表；点击节点展开并自动缩放到这一分支
export default function LineageTree({
  data,
  compact = false,
}: {
  data: LineageNode;
  // 嵌入科、属页面：全部展开、不显示搜索
  compact?: boolean;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [expanded, setExpanded] = useState<Set<string>>(() => defaultExpanded(data, compact));
  const [transform, setTransform] = useState<Transform>({ x: 20, y: 20, k: 0.8 });
  const [highlight, setHighlight] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);

  const fullscreenEnabled = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(document.fullscreenEnabled),
    () => false
  );
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(wrapperRef.current) && document.fullscreenElement === wrapperRef.current,
    () => false
  );

  const [narrow, setNarrow] = useState(false);
  const layout = useMemo(() => computeLayout(data, expanded, narrow), [data, expanded, narrow]);
  // 搜索候选：植物和各级分类
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    const walk = (n: LineageNode) => {
      if (n !== data) names.add(n.name);
      n.children?.forEach(walk);
    };
    walk(data);
    return [...names];
  }, [data]);

  // 当前定位节点的路径（面包屑）
  const focusItem = focusId ? layout.items.find((it) => it.id === focusId) : undefined;
  const crumbs = focusId
    ? focusId.split("/").map((name, i, parts) => ({ name, id: parts.slice(0, i + 1).join("/") }))
    : [];

  const transformRef = useRef(transform);
  const sizeRef = useRef({ width: 0, height: 0 });
  const frame = useRef(0);
  const fitted = useRef(false);
  const moved = useRef(false);
  const refitPending = useRef(false);
  const latest = useRef({ layout, focusId });

  useEffect(() => {
    latest.current = { layout, focusId };
  }, [layout, focusId]);

  function apply(next: Transform) {
    transformRef.current = next;
    setTransform(next);
  }

  function animateTo(target: Transform, duration = 450) {
    const from = transformRef.current;
    let start = -1;
    cancelAnimationFrame(frame.current);
    const step = (now: number) => {
      if (start < 0) start = now;
      const p = Math.min(1, (now - start) / duration);
      const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      apply({
        x: from.x + (target.x - from.x) * t,
        y: from.y + (target.y - from.y) * t,
        k: from.k + (target.k - from.k) * t,
      });
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }

  function fitBox(b: Box | null, maxK = FIT_MAX_K) {
    const { width, height } = sizeRef.current;
    if (b && width > 0) animateTo(fitTransform(b, width, height, maxK, width < NARROW_WIDTH));
  }

  function wholeBox(block: Block): Box {
    return { x0: 0, y0: 0, x1: block.w, y1: block.h };
  }

  function fitCurrent(l: Block, focus: string | null) {
    fitBox(focus ? branchBounds(l.items, focus) : wholeBox(l), focus ? FIT_MAX_K : 1);
  }

  function zoomAt(cx: number, cy: number, factor: number) {
    const t = transformRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
    apply({ k, x: cx - (cx - t.x) * (k / t.k), y: cy - (cy - t.y) * (k / t.k) });
  }

  function zoomButton(factor: number) {
    const { width, height } = sizeRef.current;
    const t = transformRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
    animateTo({ k, x: width / 2 - (width / 2 - t.x) * (k / t.k), y: height / 2 - (height / 2 - t.y) * (k / t.k) }, 250);
  }

  // 首次得到容器尺寸时适应整个画面；进入、退出全屏后重新适应
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      sizeRef.current = { width, height };
      const isNarrow = width < NARROW_WIDTH;
      setNarrow(isNarrow);
      if (!fitted.current && width > 0) {
        fitted.current = true;
        apply(fitTransform(wholeBox(computeLayout(data, expanded, isNarrow)), width, height, 1, isNarrow));
      } else if (refitPending.current && width > 0) {
        refitPending.current = false;
        fitCurrent(latest.current.layout, latest.current.focusId);
      }
    });
    observer.observe(el);
    const onFullscreen = () => {
      refitPending.current = true;
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
    // 只在挂载时注册
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滚轮缩放（非 passive 才能阻止页面滚动）
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(frame.current);
      const rect = el.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 宽窄布局切换（如手机旋转）后重新适应
  useEffect(() => {
    if (fitted.current) fitCurrent(layout, focusId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // 拖动平移、双指缩放
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    cancelAnimationFrame(frame.current);
    moved.current = false;
    const pointers = new Map<number, { x: number; y: number }>();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    let last = { x: e.clientX, y: e.clientY };
    let lastDistance = 0;
    const rect = svgRef.current!.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      if (!pointers.has(ev.pointerId) && pointers.size >= 2) return;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDistance > 0) {
          zoomAt((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, distance / lastDistance);
        }
        lastDistance = distance;
        moved.current = true;
        return;
      }
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - last.y;
      if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 4) moved.current = true;
      const t = transformRef.current;
      apply({ ...t, x: t.x + dx, y: t.y + dy });
      last = { x: ev.clientX, y: ev.clientY };
    };
    const onUp = (ev: PointerEvent) => {
      pointers.delete(ev.pointerId);
      lastDistance = 0;
      if (pointers.size === 0) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      } else {
        last = [...pointers.values()][0];
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // 定位到某个节点（null = 整体）
  function focusOn(id: string | null) {
    const target = id === data.name ? null : id;
    setFocusId(target);
    fitCurrent(layout, target);
  }

  // 点击分类节点：未展开 → 展开并缩放到这一分支；已展开 → 缩放到这一分支；
  // 已经定位在这一分支时再点 → 收起，回到上一级
  function onGroupClick(it: Item) {
    if (moved.current || !it.hasChildren) return;
    const next = new Set(expanded);
    let target: string | null = it.id;
    if (!it.open) {
      next.add(it.id);
      track("lineage_expand", { name: it.node.name, level: it.node.level });
    } else if (focusId === it.id) {
      [...next].forEach((id) => (id === it.id || id.startsWith(`${it.id}/`)) && next.delete(id));
      target = parentId(it.id);
    }
    if (target === data.name) target = null;
    const nextLayout = computeLayout(data, next, narrow);
    setExpanded(next);
    setFocusId(target);
    fitCurrent(nextLayout, target);
  }

  function openPlant(e: React.MouseEvent, it: Item) {
    e.preventDefault();
    if (moved.current || !it.node.href) return;
    track("lineage_plant_click", { plant: it.node.name, view: "card" });
    router.push(it.node.href);
  }

  function setAll(open: boolean) {
    const next = open ? allInnerIds(data, data.name) : defaultExpanded(data, compact);
    setExpanded(next);
    setFocusId(null);
    setHighlight(null);
    fitBox(wholeBox(computeLayout(data, next, narrow)), 1);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const found = findPath(data, q);
    track("search", { search_term: q, source: "lineage", results: found ? 1 : 0 });
    setNotFound(!found);
    if (!found) return;
    const { path, node } = found;
    const isPlant = !node.children;
    const next = new Set(expanded);
    (isPlant ? path.slice(0, -1) : path).forEach((id) => next.add(id));
    const nextLayout = computeLayout(data, next, narrow);
    const targetId = path[path.length - 1];
    // 植物：定位到所在的属（同属植物一起显示）；分类：定位到这个分类
    const fitId = isPlant ? (path[path.length - 2] ?? targetId) : targetId;
    setExpanded(next);
    setHighlight(isPlant ? targetId : null);
    setFocusId(fitId === data.name ? null : fitId);
    fitBox(branchBounds(nextLayout.items, fitId), isPlant ? 1.4 : FIT_MAX_K);
  }

  // 键盘：Esc 返回上一级，+ / - 缩放，0 适应窗口
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === "Escape" && focusId) {
      e.preventDefault();
      focusOn(parentId(focusId));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomButton(1.4);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomButton(1 / 1.4);
    } else if (e.key === "0") {
      e.preventDefault();
      focusOn(null);
    }
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }

  const { x, y, k } = transform;
  const activeSegs = focusId ? layout.segs.filter((s) => inBranch(s[4], focusId)) : [];
  const restSegs = focusId ? layout.segs.filter((s) => !inBranch(s[4], focusId)) : layout.segs;
  const segPath = (segs: Seg[]) => segs.map(([x1, y1, x2, y2]) => `M${x1},${y1}L${x2},${y2}`).join("");
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={wrapperRef}
      className={["lineage-tree", compact ? "lineage-tree-compact" : "", isFullscreen ? "is-fullscreen" : ""]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={onKeyDown}
    >
      {!compact && (
        <div className="lineage-tree-toolbar">
          <form className="lineage-tree-search" onSubmit={search} role="search">
            <input
              value={query}
              list="lineage-tree-names"
              placeholder="搜索植物或科属，例如 白皮松、蔷薇科"
              aria-label="在谱系中搜索植物或分类"
              onChange={(e) => {
                setQuery(e.target.value);
                setNotFound(false);
              }}
            />
            <button type="submit">定位</button>
            <datalist id="lineage-tree-names">
              {suggestions.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </form>
          <div className="lineage-tree-buttons">
            <button type="button" onClick={() => setAll(true)}>
              全部展开
            </button>
            <button type="button" onClick={() => setAll(false)}>
              收起
            </button>
          </div>
          {notFound && <span className="lineage-tree-error">没有找到“{query}”</span>}
        </div>
      )}

      <div
        ref={containerRef}
        className="lineage-tree-canvas"
        onPointerDown={onPointerDown}
        tabIndex={-1}
      >
        {/* 当前位置：点击上级返回 */}
        <nav className="lineage-tree-crumbs" aria-label="当前位置" onPointerDown={stop}>
          <button type="button" className={focusId ? "" : "is-current"} onClick={() => focusOn(null)}>
            {data.name}
          </button>
          {narrow && crumbs.length > 3 && (
            <span>
              <span className="lineage-tree-crumb-sep">›</span>
              <button type="button" onClick={() => focusOn(crumbs[crumbs.length - 3].id)} aria-label="上一级">
                …
              </button>
            </span>
          )}
          {crumbs.slice(narrow ? Math.max(1, crumbs.length - 2) : 1).map((c, i, list) => (
            <span key={c.id}>
              <span className="lineage-tree-crumb-sep">›</span>
              <button
                type="button"
                className={i === list.length - 1 ? "is-current" : ""}
                onClick={() => focusOn(c.id)}
              >
                {c.name}
              </button>
            </span>
          ))}
          {focusItem?.node.href && (
            <a className="lineage-tree-crumb-link" href={focusItem.node.href}>
              {LEVEL_LABEL[focusItem.node.level]}页 →
            </a>
          )}
        </nav>

        <div className="lineage-tree-zoom" onPointerDown={stop}>
          <button type="button" onClick={() => zoomButton(1.4)} aria-label="放大" title="放大（+）">
            ＋
          </button>
          <span className="lineage-tree-zoom-level" aria-live="polite">
            {Math.round(k * 100)}%
          </span>
          <button type="button" onClick={() => zoomButton(1 / 1.4)} aria-label="缩小" title="缩小（-）">
            －
          </button>
          <button type="button" onClick={() => focusOn(null)} aria-label="适应窗口" title="适应窗口（0）">
            ⤢
          </button>
          {fullscreenEnabled && (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "退出全屏" : "全屏"}
              title={isFullscreen ? "退出全屏" : "全屏"}
            >
              {isFullscreen ? "✕" : "⛶"}
            </button>
          )}
        </div>

        <svg ref={svgRef} width="100%" height="100%" aria-label={`${data.name}的谱系树`}>
          <defs>
            <clipPath id="lineage-thumb-clip" clipPathUnits="objectBoundingBox">
              <rect width="1" height="1" rx="0.15" ry="0.15" />
            </clipPath>
            <filter id="lineage-shadow" x="-10%" y="-20%" width="120%" height="160%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#1f3a24" floodOpacity="0.12" />
            </filter>
            <linearGradient id="lineage-root-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3f8a4b" />
              <stop offset="1" stopColor="#2a5f34" />
            </linearGradient>
          </defs>
          <g transform={`translate(${x},${y}) scale(${k})`} className={focusId ? "has-focus" : ""}>
            {/* 直角连线：当前分支加深 */}
            <path className="lineage-tree-link" d={segPath(restSegs)} />
            {activeSegs.length > 0 && <path className="lineage-tree-link is-active" d={segPath(activeSegs)} />}

            {layout.items.map((it) => {
              const dim = focusId !== null && !inBranch(it.id, focusId);
              if (it.kind === "plant") {
                const c = it.node.card;
                // 第三行：生活型 · 叶片要点（没有描述时用标签），都没有时显示实拍张数
                const line3 =
                  [c?.habit, c?.summary || c?.tags.join("、")].filter(Boolean).join(" · ") ||
                  (it.node.photoCount ? `${it.node.photoCount} 张实拍` : "");
                const cls = ["lineage-card", highlight === it.id ? "lineage-card-on" : "", dim ? "is-dim" : ""];
                return (
                  <a
                    key={it.id}
                    href={it.node.href}
                    onClick={(e) => openPlant(e, it)}
                    className={cls.filter(Boolean).join(" ")}
                  >
                    <title>{`${it.node.name} ${c?.latin ?? ""}`.trim()}</title>
                    <g transform={`translate(${it.x},${it.y})`}>
                      <rect width={it.w} height={it.h} rx="9" className="lineage-card-bg" />
                      {it.node.photo ? (
                        <image
                          href={variantPath(it.node.photo, 320)}
                          x="6"
                          y="6"
                          width={it.h - 12}
                          height={it.h - 12}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#lineage-thumb-clip)"
                        />
                      ) : (
                        <>
                          <rect x="6" y="6" width={it.h - 12} height={it.h - 12} rx="7" className="lineage-card-empty" />
                          <text x={it.h / 2} y={it.h / 2} dy="0.36em" textAnchor="middle" className="lineage-card-initial">
                            {it.node.name.slice(0, 1)}
                          </text>
                        </>
                      )}
                      <text x={it.h + 2} y="21" className="lineage-card-name">
                        {it.node.name}
                      </text>
                      <text x={it.h + 2} y="35" className="lineage-card-latin">
                        {truncate(c?.latin ?? "", 26)}
                      </text>
                      <text x={it.h + 2} y="50" className="lineage-card-text">
                        {truncate(line3, 14)}
                      </text>
                      <text x={it.w - 12} y={it.h / 2} dy="0.35em" textAnchor="middle" className="lineage-card-arrow">
                        ›
                      </text>
                    </g>
                  </a>
                );
              }

              const photoSpecies = it.node.photoCount ?? 0;
              const className = [
                it.kind === "box" ? "lineage-box" : "lineage-row",
                `lv-${it.node.level}`,
                it.open ? "is-open" : "",
                it.depth === 0 ? "is-root" : "",
                photoSpecies > 0 ? "has-photo" : "",
                focusId === it.id ? "is-focus" : "",
                dim ? "is-dim" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <g
                  key={it.id}
                  transform={`translate(${it.x},${it.y})`}
                  className={className}
                  role="button"
                  tabIndex={0}
                  aria-expanded={it.open}
                  aria-label={`${it.node.name}，${it.species} 种${photoSpecies ? `，${photoSpecies} 种有实拍图` : ""}，点击${it.open ? "定位" : "展开"}`}
                  onClick={() => onGroupClick(it)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onGroupClick(it);
                    }
                  }}
                >
                  <rect width={it.w} height={it.h} rx={it.kind === "box" ? 9 : 6} />
                  {it.kind === "box" ? (
                    <text x={it.w / 2} y={it.h / 2} dy="0.35em" textAnchor="middle">
                      {it.node.name}
                      <tspan className="lineage-count"> {it.species}</tspan>
                    </text>
                  ) : (
                    <text x="10" y={it.h / 2} dy="0.35em">
                      <tspan className="lineage-caret">{it.open ? "▾" : "▸"}</tspan> {it.node.name}
                      <tspan className="lineage-count"> {it.species}</tspan>
                    </text>
                  )}
                  {photoSpecies > 0 && it.depth > 0 && (
                    <circle cx={it.w - 7} cy="7" r="3" className="lineage-photo-dot" />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="lineage-tree-hint">
        <span className="lineage-photo-legend" aria-hidden="true" /> 有实拍图 · 点击分类展开并定位，再点一次收起 ·
        Esc 返回上一级 · 拖动平移，滚轮或双指缩放
      </p>
    </div>
  );
}
