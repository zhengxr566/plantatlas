"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRANCH_LEVELS, type LineageNode, type LineageLevel } from "@/lib/lineage";
import { track } from "@/lib/analytics";
import { variantPath } from "@/lib/imageVariants";

// ---------- 布局常量（画布坐标，缩放 k=1 时等于像素） ----------
const BOX_H = 36; // 顶部（从上往下排列）节点的方框高度
const LEVEL_GAP = 34; // 上下两层方框之间的距离（直角连线在中间转折）
const COL_GAP = 40; // 左右相邻分支的间距
const INDENT = 22; // 纵向树每一级的缩进
const LIST_TOP = 10; // 方框到第一行的距离
const GROUP_H = 28; // 分类行（演化支、目、科、属）高度
const PLANT_H = 58; // 植物名片高度
const PLANT_W = 236;
const ROW_GAP = 5;

// 各大分支的颜色（演化支、纲等），同一分支下的行、连线和数量标签使用同一种颜色
const TONES = ["#2f855a", "#2b7a8c", "#b7791f", "#7c5aa6", "#c05671", "#3b6fb6", "#7a8b2e", "#b4572a"];
const NEUTRAL = "#5f8a63";

// 目以上的分支层级（类群、纲、演化支）
const BRANCH = new Set<LineageLevel>(BRANCH_LEVELS);

// 每行文字的字号（演化支、目更醒目）
const ROW_FONT: Partial<Record<LineageLevel, number>> = { class: 13.5, clade: 13.5, order: 13, family: 12.5, genus: 12.5 };
const MIN_K = 0.15;
const MAX_K = 2.2;
const FIT_MAX_K = 1.6; // 点击定位时最多放大到这个比例

// 纵向树：从这一层开始改为纵向缩进的树（之前的层级从上往下、左右展开）。
// 主页只把“植物界 › 裸子植物 / 被子植物”横向排开，其余页面整棵树纵向排列
const COLUMN_DEPTH: Record<LineageLevel, number> = {
  root: 1,
  division: 0,
  class: 0,
  clade: 0,
  order: 0,
  family: 0,
  genus: 0,
  plant: 0,
};

type Transform = { x: number; y: number; k: number };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Vis = { id: string; node: LineageNode; depth: number; open: boolean; species: number; children?: Vis[] };
type Item = {
  id: string;
  node: LineageNode;
  // box：顶部方框；group：分类行；plant：植物名片（手机列表）；node：系统树的内部节点；tip：系统树末端的植物
  kind: "box" | "group" | "plant" | "node" | "tip";
  tone: string;
  // node：分支点的位置（名称写在通向它的分支上方）
  ax?: number;
  ay?: number;
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
// 色带：某个分支（演化支、纲等）覆盖的范围
type Band = { id: string; x: number; y: number; w: number; h: number; tone: string };
type Block = { w: number; h: number; anchor: number; items: Item[]; segs: Seg[]; bands?: Band[] };

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

function rowFont(v: { node: LineageNode }) {
  return ROW_FONT[v.node.level] ?? 13;
}

// 分类行：箭头 + 中文名 + 学名 + 右侧数量标签
function badgeWidth(species: number) {
  return textWidth(String(species), 10.5) + 12;
}

function groupWidth(v: Vis) {
  const latin = v.node.latin ? textWidth(v.node.latin, 10.5) + 7 : 0;
  // 右侧留出数量标签和“有实拍图”圆点的位置
  return 24 + textWidth(v.node.name, rowFont(v)) + latin + 20 + badgeWidth(v.species) + 6;
}

// 每个节点的颜色：较大的分支继续往下分，较小的分支（或只含目的分支）整体用一种颜色
function toneMap(root: LineageNode) {
  const map = new Map<string, string>();
  let next = 0;
  const paint = (n: LineageNode, id: string, tone: string) => {
    map.set(id, tone);
    n.children?.forEach((c) => paint(c, `${id}/${c.name}`, tone));
  };
  const visit = (n: LineageNode, id: string) => {
    const branches = (n.children ?? []).some((c) => BRANCH.has(c.level));
    if (n === root || (BRANCH.has(n.level) && branches && countSpecies(n) > 24)) {
      map.set(id, NEUTRAL);
      n.children?.forEach((c) => visit(c, `${id}/${c.name}`));
    } else {
      paint(n, id, TONES[next++ % TONES.length]);
    }
  };
  if (!root.children) map.set(root.name, NEUTRAL);
  else visit(root, root.name);
  return map;
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
    tone: NEUTRAL,
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
    // 同一级的分类行等宽，右侧的数量标签对齐
    const rowW = Math.max(0, ...children.filter((c) => c.node.level !== "plant").map(groupWidth));
    for (const child of children) {
      const isPlant = child.node.level === "plant";
      const h = isPlant ? PLANT_H : GROUP_H;
      const x = level * INDENT + 12;
      const row = item(child, isPlant ? "plant" : "group", x, y, isPlant ? PLANT_W : rowW, h);
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

// ---------- 系统树（桌面）：根在左，直角分支向右，所有末端在右侧对齐成一列 ----------
const STEM_MIN = 18; // 末端的最短分支
const LABEL_PAD = 16; // 节点名称写在分支线上方，分支长度 = 名称宽度 + 留白
const TIP_H = 30; // 植物行高度
const LEAF_GAP = 4;
const BAND_GAP = 10; // 不同色带之间的间距
const TOP_PAD = 26;

// 分支上方的节点名称：中文名 + 种数
function nodeLabelWidth(v: Vis) {
  return textWidth(v.node.name, 12.5) + textWidth(` ${v.species}`, 10.5) + 4;
}

function tipWidth(v: Vis) {
  return 36 + textWidth(v.node.name, 13) + (v.node.card?.latin ? textWidth(v.node.card.latin, 10.5) + 8 : 0) + 12;
}

function buildCladogram(root: Vis, tones: Map<string, string>): Block {
  const tone = (id: string) => tones.get(id) ?? NEUTRAL;
  const isLeaf = (v: Vis) => !v.open || !v.children?.length;
  const px = new Map<string, number>(); // 分支起点（上一级节点的 x）
  const nx = new Map<string, number>(); // 节点 x
  const ny = new Map<string, number>(); // 节点 y
  const bandOf = new Map<string, string>(); // 所在色带（换颜色的那一级节点）
  const leaves: Vis[] = [];
  const internals: Vis[] = [];

  const walk = (v: Vis, parentX: number, band: string, parentTone: string) => {
    const t = tone(v.id);
    const b = t !== NEUTRAL && t !== parentTone ? v.id : band;
    bandOf.set(v.id, b);
    px.set(v.id, parentX);
    const x = parentX + (isLeaf(v) ? STEM_MIN : Math.max(STEM_MIN, nodeLabelWidth(v) + LABEL_PAD));
    nx.set(v.id, x);
    if (isLeaf(v)) {
      leaves.push(v);
    } else {
      internals.push(v);
      v.children!.forEach((c) => walk(c, x, b, t));
    }
  };
  walk(root, 0, "", NEUTRAL);

  const leafX = Math.max(...leaves.map((l) => nx.get(l.id)!)) + 8;
  const leafW = Math.max(
    200,
    ...leaves.map((l) => (l.node.level === "plant" ? tipWidth(l) : groupWidth(l)))
  );

  // 末端从上往下排列；换色带时多留一点间距
  const items: Item[] = [];
  const segs: Seg[] = [];
  let y = TOP_PAD;
  leaves.forEach((l, i) => {
    const h = l.node.level === "plant" ? TIP_H : GROUP_H;
    if (i > 0) y += LEAF_GAP + (bandOf.get(l.id) !== bandOf.get(leaves[i - 1].id) ? BAND_GAP : 0);
    ny.set(l.id, y + h / 2);
    items.push(item(l, l.node.level === "plant" ? "tip" : "group", leafX, y, leafW, h));
    // 末端的分支直接连到右侧的名称
    segs.push([px.get(l.id)!, y + h / 2, leafX, y + h / 2, l.id]);
    y += h;
  });

  // 内部节点：位于第一个和最后一个下级之间；名称写在通向它的分支上方
  [...internals].reverse().forEach((v) => {
    const kids = v.children!;
    const first = ny.get(kids[0].id)!;
    const last = ny.get(kids[kids.length - 1].id)!;
    const cy = (first + last) / 2;
    const x = nx.get(v.id)!;
    ny.set(v.id, cy);
    segs.push([x, first, x, last, v.id]);
    segs.push([px.get(v.id)!, cy, x, cy, v.id]);
    const label = item(v, "node", px.get(v.id)! + 4, cy - 20, nodeLabelWidth(v), 18);
    label.ax = x;
    label.ay = cy;
    items.push(label);
  });

  // 色带：从该分支的起点到右侧边缘，覆盖它的全部末端
  const right = leafX + leafW + 8;
  const bands: Band[] = [];
  new Set([...bandOf.values()].filter(Boolean)).forEach((id) => {
    const own = items.filter((it) => it.id === id || it.id.startsWith(`${id}/`));
    const top = Math.min(...own.map((it) => it.y)) - 4;
    const bottom = Math.max(...own.filter((it) => it.kind !== "node").map((it) => it.y + it.h)) + 4;
    const x0 = px.get(id)! + 1;
    bands.push({ id, x: x0, y: top, w: right - x0, h: bottom - top, tone: tone(id) });
  });

  return {
    w: right + 4,
    h: y + 12,
    anchor: nx.get(root.id)!,
    items,
    segs,
    bands,
  };
}

// 窄屏（手机）时整棵树改为一列缩进列表，避免横向排开后缩得太小
const NARROW_WIDTH = 600;

function computeLayout(data: LineageNode, expanded: Set<string>, narrow = false, tones?: Map<string, string>) {
  const vis = toVisible(data, data.name, 0, expanded);
  // 桌面：系统树；手机：一列缩进列表
  const block = narrow ? buildTree(vis, 0) : buildCladogram(vis, tones ?? new Map());
  if (tones) block.items.forEach((it) => (it.tone = tones.get(it.id) ?? NEUTRAL));
  return block;
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
  const names = (n: LineageNode) =>
    [n.name, n.card?.latin ?? "", ...(n.card?.aliases ?? [])].map((s) => s.toLowerCase());
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
  clade: "演化支",
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

// 默认展开类群、纲和演化支，显示到“目”（目先收起）
function branchExpanded(node: LineageNode, id: string, out = new Set<string>()) {
  if (!node.children || !BRANCH.has(node.level)) return out;
  out.add(id);
  node.children.forEach((c) => branchExpanded(c, `${id}/${c.name}`, out));
  return out;
}

// 默认展开到列这一层（主页：植物界 › 类群 › 演化支 / 纲，下面列出各个目）
function defaultExpanded(data: LineageNode, compact: boolean) {
  if (compact) return allInnerIds(data, data.name);
  if (BRANCH.has(data.level)) return branchExpanded(data, data.name);
  return idsToDepth(data, data.name, (COLUMN_DEPTH[data.level] ?? 0) + 1);
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
  // 显示简介框的植物；画布尺寸用于摆放简介框
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
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
  const tones = useMemo(() => toneMap(data), [data]);
  const layout = useMemo(() => computeLayout(data, expanded, narrow, tones), [data, expanded, narrow, tones]);
  // 搜索候选：植物和各级分类
  const suggestions = useMemo(() => {
    const names = new Set<string>();
    const walk = (n: LineageNode) => {
      if (n !== data) names.add(n.name);
      n.card?.aliases.forEach((a) => names.add(a));
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
    if (b && width > 0) animateTo(fitTransform(b, width, height, maxK, true));
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
      setCanvasSize({ width, height });
      const isNarrow = width < NARROW_WIDTH;
      setNarrow(isNarrow);
      if (!fitted.current && width > 0) {
        fitted.current = true;
        apply(fitTransform(wholeBox(computeLayout(data, expanded, isNarrow, tones)), width, height, 1, true));
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

  // 滚轮上下滚动纵向树（Shift 横向）；Ctrl / ⌘ + 滚轮或触控板双指捏合缩放。非 passive 才能阻止页面滚动
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(frame.current);
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.004));
        return;
      }
      const t = transformRef.current;
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      apply({ ...t, x: t.x - dx, y: t.y - dy });
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
    const nextLayout = computeLayout(data, next, narrow, tones);
    setExpanded(next);
    setFocusId(target);
    fitCurrent(nextLayout, target);
  }

  // 第一次点击植物：显示简介框；再点同一种植物：进入植物页面
  function openPlant(e: React.MouseEvent, it: Item) {
    e.preventDefault();
    if (moved.current || !it.node.href) return;
    if (selectedId === it.id) {
      track("lineage_plant_click", { plant: it.node.name, view: "card" });
      router.push(it.node.href);
      return;
    }
    track("lineage_plant_preview", { plant: it.node.name });
    setSelectedId(it.id);
    setHighlight(it.id);
  }

  function closePop() {
    setSelectedId(null);
    setHighlight(null);
  }

  function setAll(open: boolean) {
    const next = open ? allInnerIds(data, data.name) : defaultExpanded(data, compact);
    setExpanded(next);
    setFocusId(null);
    setHighlight(null);
    fitBox(wholeBox(computeLayout(data, next, narrow, tones)), 1);
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
    const nextLayout = computeLayout(data, next, narrow, tones);
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
    if (e.key === "Escape" && selectedId) {
      e.preventDefault();
      closePop();
    } else if (e.key === "Escape" && focusId) {
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
  // 连线按所属分支的颜色分组
  const segsByTone = new Map<string, Seg[]>();
  restSegs.forEach((s) => {
    const tone = tones.get(s[4]) ?? NEUTRAL;
    segsByTone.set(tone, [...(segsByTone.get(tone) ?? []), s]);
  });
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  // 简介框：跟随植物所在位置，放在右侧（放不下时放左侧）；手机上固定在画布底部
  const selItem = selectedId
    ? layout.items.find((i) => i.id === selectedId && (i.kind === "tip" || i.kind === "plant"))
    : undefined;
  const selCard = selItem?.node.card;
  const POP_W = 300;
  const POP_H = 330; // 简介框的大致高度（含图片、要点、标签和按钮）
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, Math.max(lo, hi)));
  let popStyle: React.CSSProperties | undefined;
  if (selItem && !narrow) {
    const sx = selItem.x * k + x;
    const sy = selItem.y * k + y;
    let left = sx + selItem.w * k + 12;
    if (left + POP_W > canvasSize.width - 10) left = sx - POP_W - 12;
    popStyle = {
      left: clamp(left, 10, canvasSize.width - POP_W - 10),
      top: clamp(sy - 10, 52, canvasSize.height - POP_H - 10),
      maxHeight: canvasSize.height - 20,
    };
  }

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

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          aria-label={`${data.name}的谱系树`}
          onClick={(e) => {
            // 点击空白处或分类：关闭简介框
            if (selectedId && !moved.current && !(e.target as Element).closest(".lineage-tip, .lineage-card")) closePop();
          }}
        >
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
            {/* 色带：每个大分支一种颜色 */}
            {(layout.bands ?? []).map((b) => (
              <rect
                key={b.id}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="10"
                className={focusId !== null && !inBranch(b.id, focusId) ? "lineage-band is-dim" : "lineage-band"}
                style={{ fill: b.tone }}
              />
            ))}
            {/* 直角连线：当前分支加深 */}
            {[...segsByTone].map(([tone, segs]) => (
              <path key={tone} className="lineage-tree-link" style={{ stroke: tone }} d={segPath(segs)} />
            ))}
            {activeSegs.length > 0 && <path className="lineage-tree-link is-active" d={segPath(activeSegs)} />}

            {layout.items.map((it) => {
              const dim = focusId !== null && !inBranch(it.id, focusId);
              if (it.kind === "tip") {
                const latin = it.node.card?.latin ?? "";
                const cls = ["lineage-tip", highlight === it.id ? "lineage-tip-on" : "", dim ? "is-dim" : ""];
                return (
                  <a
                    key={it.id}
                    href={it.node.href}
                    onClick={(e) => openPlant(e, it)}
                    className={cls.filter(Boolean).join(" ")}
                    style={{ "--tone": it.tone } as React.CSSProperties}
                  >
                    <title>{`${it.node.name} ${latin}`.trim()}</title>
                    <g transform={`translate(${it.x},${it.y})`}>
                      <rect width={it.w} height={it.h} rx="7" className="lineage-tip-bg" />
                      {it.node.photo ? (
                        <image
                          href={variantPath(it.node.photo, 320)}
                          x="5"
                          y="4"
                          width={it.h - 8}
                          height={it.h - 8}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#lineage-thumb-clip)"
                        />
                      ) : (
                        <>
                          <rect x="5" y="4" width={it.h - 8} height={it.h - 8} rx="5" className="lineage-card-empty" />
                          <text x={5 + (it.h - 8) / 2} y={it.h / 2} dy="0.36em" textAnchor="middle" className="lineage-tip-initial">
                            {it.node.name.slice(0, 1)}
                          </text>
                        </>
                      )}
                      <text x="34" y={it.h / 2} dy="0.35em" className="lineage-tip-name">
                        {it.node.name}
                        {latin && (
                          <tspan className="lineage-tip-latin" dx="8">
                            {latin}
                          </tspan>
                        )}
                      </text>
                    </g>
                  </a>
                );
              }

              if (it.kind === "node") {
                const photoSpecies = it.node.photoCount ?? 0;
                const cls = [
                  "lineage-node",
                  `lv-${it.node.level}`,
                  focusId === it.id ? "is-focus" : "",
                  dim ? "is-dim" : "",
                ];
                return (
                  <g
                    key={it.id}
                    className={cls.filter(Boolean).join(" ")}
                    style={{ "--tone": it.tone } as React.CSSProperties}
                    role="button"
                    tabIndex={0}
                    aria-expanded
                    aria-label={`${it.node.name}，${it.species} 种${photoSpecies ? `，${photoSpecies} 种有实拍图` : ""}，点击定位，再点收起`}
                    onClick={() => onGroupClick(it)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onGroupClick(it);
                      }
                    }}
                  >
                    <title>{it.node.latin ? `${it.node.name} ${it.node.latin}` : it.node.name}</title>
                    <rect x={it.x - 4} y={it.y - 2} width={(it.ax ?? it.x) - it.x + 6} height={it.h + 8} className="lineage-node-hit" />
                    <text x={it.x} y={it.y + 13} className="lineage-node-label">
                      {it.node.name}
                      <tspan className="lineage-node-count"> {it.species}</tspan>
                    </text>
                    <circle cx={it.ax} cy={it.ay} r="3.2" className="lineage-node-dot" />
                  </g>
                );
              }

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
                    style={{ "--tone": it.tone } as React.CSSProperties}
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
                  style={{ "--tone": it.tone } as React.CSSProperties}
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
                  <rect width={it.w} height={it.h} rx={it.kind === "box" ? 10 : 7} className="lineage-node-bg" />
                  {it.kind === "box" ? (
                    <text x={it.w / 2} y={it.h / 2} dy="0.35em" textAnchor="middle">
                      {it.node.name}
                      <tspan className="lineage-count"> {it.species}</tspan>
                    </text>
                  ) : (
                    <>
                      <rect x="0" y="4" width="3" height={it.h - 8} rx="1.5" className="lineage-row-accent" />
                      <text x="11" y={it.h / 2} dy="0.35em" style={{ fontSize: rowFont(it) }}>
                        <tspan className="lineage-caret">{it.open ? "▾" : "▸"}</tspan> {it.node.name}
                        {it.node.latin && <tspan className="lineage-row-latin" dx="6">{it.node.latin}</tspan>}
                      </text>
                      <g transform={`translate(${it.w - badgeWidth(it.species) - 6},${(it.h - 16) / 2})`}>
                        <rect width={badgeWidth(it.species)} height="16" rx="8" className="lineage-badge" />
                        <text x={badgeWidth(it.species) / 2} y="8" dy="0.35em" textAnchor="middle" className="lineage-badge-text">
                          {it.species}
                        </text>
                      </g>
                    </>
                  )}
                  {photoSpecies > 0 && it.depth > 0 && (
                    <circle
                      cx={it.kind === "box" ? it.w - 7 : it.w - badgeWidth(it.species) - 13}
                      cy={it.kind === "box" ? 7 : it.h / 2}
                      r="3"
                      className="lineage-photo-dot"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* 植物简介：第一次点击植物时显示，右下角进入植物页面 */}
        {selItem && (
          <div
            className={narrow ? "lineage-pop is-sheet" : "lineage-pop"}
            style={popStyle}
            role="dialog"
            aria-label={`${selItem.node.name}简介`}
            onPointerDown={stop}
          >
            <button type="button" className="lineage-pop-close" aria-label="关闭" onClick={() => closePop()}>
              ×
            </button>
            <div className="lineage-pop-head">
              {selItem.node.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={variantPath(selItem.node.photo, 320)} alt={selItem.node.name} />
              ) : (
                <span className="lineage-pop-initial" aria-hidden="true">
                  {selItem.node.name.slice(0, 1)}
                </span>
              )}
              <div>
                <strong>{selItem.node.name}</strong>
                {selCard?.latin && <em>{selCard.latin}</em>}
                {selCard && selCard.aliases.length > 0 && <span>又名{selCard.aliases.slice(0, 3).join("、")}</span>}
                {selCard && (
                  <span className="lineage-pop-taxon">
                    {selCard.family} · {selCard.genus}
                  </span>
                )}
              </div>
            </div>
            {selCard && (selCard.habit || selCard.points.length > 0) && (
              <dl className="lineage-pop-points">
                {selCard.habit && (
                  <div>
                    <dt>生活型</dt>
                    <dd>{selCard.habit}</dd>
                  </div>
                )}
                {selCard.points.map((p) => (
                  <div key={p.label}>
                    <dt>{p.label}</dt>
                    <dd>{p.text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {selCard && selCard.tags.length > 0 && (
              <ul className="lineage-pop-tags">
                {selCard.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <div className="lineage-pop-foot">
              <span>{selItem.node.photoCount ? `${selItem.node.photoCount} 张实拍图` : "实拍图整理中"}</span>
              <Link
                href={selItem.node.href ?? "#"}
                className="lineage-pop-go"
                onClick={() => track("lineage_plant_click", { plant: selItem.node.name, view: "popup" })}
              >
                进入页面 →
              </Link>
            </div>
          </div>
        )}
      </div>

      <p className="lineage-tree-hint">
        <span className="lineage-photo-legend" aria-hidden="true" /> 有实拍图 · 点击分类展开并定位，再点一次收起 · 点击植物查看简介 ·
        Esc 返回上一级 · 滚轮上下滚动，Ctrl + 滚轮或双指缩放
      </p>
    </div>
  );
}
