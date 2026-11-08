"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hierarchy, tree, type HierarchyPointNode } from "d3-hierarchy";
import type { LineageNode } from "@/lib/lineage";
import { track } from "@/lib/analytics";

// ---------- 布局常量（单位：画布坐标，缩放 k=1 时等于像素） ----------
const COL = 200; // 每一层的水平间距
const ROW = 34; // 基础行高
const CARD_W = 260;
const CARD_H = 100;
const CARD_ROWS = (CARD_H + 14) / ROW; // 名片占几行
const CARD_ZOOM = 0.62; // 缩放超过这个值时，植物显示为名片
const MIN_K = 0.12;
const MAX_K = 2.2;

type Transform = { x: number; y: number; k: number };
type VNode = { id: string; node: LineageNode; open: boolean; species: number; children?: VNode[] };
type Point = HierarchyPointNode<VNode>;

function thumb(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=128&q=75`;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function countSpecies(node: LineageNode): number {
  return node.children ? node.children.reduce((n, c) => n + countSpecies(c), 0) : 1;
}

// 只保留展开节点的子节点，得到当前可见的树
function toVisible(node: LineageNode, id: string, expanded: Set<string>): VNode {
  const open = Boolean(node.children) && expanded.has(id);
  return {
    id,
    node,
    open,
    species: countSpecies(node),
    children: open
      ? node.children!.map((c) => toVisible(c, `${id}/${c.name}`, expanded))
      : undefined,
  };
}

function computeLayout(data: LineageNode, expanded: Set<string>) {
  const root = hierarchy(toVisible(data, data.name, expanded), (d) => d.children);
  const size = (n: Point) => (n.data.node.level === "plant" ? CARD_ROWS : 1);
  return tree<VNode>()
    .nodeSize([ROW, COL])
    .separation((a, b) => ((size(a as Point) + size(b as Point)) / 2) * (a.parent === b.parent ? 1 : 1.25))(root);
}

function allInnerIds(node: LineageNode, id: string, out = new Set<string>()) {
  if (!node.children) return out;
  out.add(id);
  node.children.forEach((c) => allInnerIds(c, `${id}/${c.name}`, out));
  return out;
}

// 默认展开到指定深度（0 = 只显示根）
function idsToDepth(node: LineageNode, id: string, depth: number, out = new Set<string>()) {
  if (!node.children || depth <= 0) return out;
  out.add(id);
  node.children.forEach((c) => idsToDepth(c, `${id}/${c.name}`, depth - 1, out));
  return out;
}

// 找到植物，返回它所有祖先的 id
function findPlantPath(node: LineageNode, id: string, query: string): string[] | null {
  if (!node.children) {
    return node.name === query || (query.length > 0 && node.name.includes(query)) ? [id] : null;
  }
  for (const c of node.children) {
    const found = findPlantPath(c, `${id}/${c.name}`, query);
    if (found) return [id, ...found];
  }
  return null;
}

function bounds(layout: Point) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  layout.each((n) => {
    const isPlant = n.data.node.level === "plant";
    // n.y 是水平位置，n.x 是垂直位置
    minX = Math.min(minX, n.y - (n.data.open ? 120 : 10));
    maxX = Math.max(maxX, n.y + (isPlant ? CARD_W : 140));
    minY = Math.min(minY, n.x - (isPlant ? CARD_H / 2 : ROW / 2));
    maxY = Math.max(maxY, n.x + (isPlant ? CARD_H / 2 : ROW / 2));
  });
  return { minX, maxX, minY, maxY };
}

function fitTransform(layout: Point, width: number, height: number, maxK = 1): Transform {
  const b = bounds(layout);
  const k = Math.max(
    MIN_K,
    Math.min(maxK, (width - 32) / (b.maxX - b.minX), (height - 32) / (b.maxY - b.minY))
  );
  return {
    k,
    x: (width - (b.maxX - b.minX) * k) / 2 - b.minX * k,
    y: (height - (b.maxY - b.minY) * k) / 2 - b.minY * k,
  };
}

// 可缩放、可展开的谱系树
export default function LineageTree({
  data,
  compact = false,
  initialDepth = 3,
}: {
  data: LineageNode;
  // 嵌入科、属页面：全部展开、不显示搜索
  compact?: boolean;
  // 默认展开深度（非 compact 时）：3 = 展开到纲，显示各个目
  initialDepth?: number;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    compact ? allInnerIds(data, data.name) : idsToDepth(data, data.name, initialDepth)
  );
  const [transform, setTransform] = useState<Transform>({ x: 40, y: 300, k: 0.8 });
  const [highlight, setHighlight] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);

  const layout = useMemo(() => computeLayout(data, expanded), [data, expanded]);
  const nodes = useMemo(() => layout.descendants(), [layout]);
  const links = useMemo(() => layout.links(), [layout]);
  const plantNames = useMemo(
    () => hierarchy(data).leaves().map((l) => l.data.name),
    [data]
  );

  const transformRef = useRef(transform);
  const sizeRef = useRef({ width: 0, height: 0 });
  const frame = useRef(0);
  const fitted = useRef(false);
  const moved = useRef(false);

  function apply(next: Transform) {
    transformRef.current = next;
    setTransform(next);
  }

  // 平滑移动到目标视图
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

  function zoomAt(cx: number, cy: number, factor: number) {
    const t = transformRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
    apply({ k, x: cx - (cx - t.x) * (k / t.k), y: cy - (cy - t.y) * (k / t.k) });
  }

  function zoomButton(factor: number) {
    const { width, height } = sizeRef.current;
    const t = transformRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor));
    const cx = width / 2;
    const cy = height / 2;
    animateTo({ k, x: cx - (cx - t.x) * (k / t.k), y: cy - (cy - t.y) * (k / t.k) }, 250);
  }

  function fit(target = layout) {
    const { width, height } = sizeRef.current;
    if (width > 0) animateTo(fitTransform(target, width, height));
  }

  // 容器尺寸：首次得到尺寸时自动适应窗口
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      sizeRef.current = { width, height };
      if (!fitted.current && width > 0) {
        fitted.current = true;
        apply(fitTransform(computeLayout(data, expanded), width, height));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
    // 只在挂载时注册；之后的适应窗口由按钮触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滚轮缩放（需要非 passive 监听才能阻止页面滚动）
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
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 4) moved.current = true;
        const t = transformRef.current;
        apply({ ...t, x: t.x + dx, y: t.y + dy });
      }
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

  // 展开 / 收起节点，并保持被点击的节点在屏幕上的位置不变
  function toggle(point: Point) {
    if (moved.current || !point.data.node.children) return;
    const next = new Set(expanded);
    if (next.has(point.data.id)) {
      // 收起时连同所有下级一起收起
      const own = point.data.id;
      [...next].forEach((id) => (id === own || id.startsWith(`${own}/`)) && next.delete(id));
    } else {
      next.add(point.data.id);
      track("lineage_expand", { name: point.data.node.name, level: point.data.node.level });
    }
    const nextLayout = computeLayout(data, next);
    const after = nextLayout.descendants().find((n) => n.data.id === point.data.id);
    const t = transformRef.current;
    if (after) {
      apply({ ...t, x: t.x + (point.y - after.y) * t.k, y: t.y + (point.x - after.x) * t.k });
    }
    setExpanded(next);
  }

  function setAll(open: boolean) {
    const next = open ? allInnerIds(data, data.name) : idsToDepth(data, data.name, initialDepth);
    setExpanded(next);
    fit(computeLayout(data, next));
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const path = findPlantPath(data, data.name, q);
    track("search", { search_term: q, source: "lineage", results: path ? 1 : 0 });
    setNotFound(!path);
    if (!path) return;
    const next = new Set(expanded);
    path.slice(0, -1).forEach((id) => next.add(id));
    const nextLayout = computeLayout(data, next);
    const target = nextLayout.descendants().find((n) => n.data.id === path[path.length - 1]);
    setExpanded(next);
    setHighlight(path[path.length - 1]);
    if (target) {
      const { width, height } = sizeRef.current;
      const k = Math.max(transformRef.current.k, 1);
      animateTo({ k, x: width / 2 - (target.y + CARD_W / 2) * k, y: height / 2 - target.x * k }, 600);
    }
  }

  function openPlant(e: React.MouseEvent, href?: string, name?: string) {
    e.preventDefault();
    if (moved.current || !href) return;
    track("lineage_plant_click", {
      plant: name ?? href,
      view: transformRef.current.k >= CARD_ZOOM ? "card" : "dot",
    });
    router.push(href);
  }

  const { x, y, k } = transform;
  const showCards = k >= CARD_ZOOM;
  // 文字和圆点按屏幕尺寸绘制，缩小时不会变得太小
  const label = Math.min(12 / k, 30);
  const dot = Math.min(6 / k, 16);

  return (
    <div className={compact ? "lineage-tree lineage-tree-compact" : "lineage-tree"}>
      <div className="lineage-tree-toolbar">
        {!compact && (
          <form className="lineage-tree-search" onSubmit={search}>
            <input
              value={query}
              list="lineage-tree-plants"
              placeholder="搜索植物，例如 白皮松"
              onChange={(e) => {
                setQuery(e.target.value);
                setNotFound(false);
              }}
            />
            <button type="submit">定位</button>
            <datalist id="lineage-tree-plants">
              {plantNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </form>
        )}
        <div className="lineage-tree-buttons">
          <button type="button" onClick={() => zoomButton(1.4)} aria-label="放大">
            ＋
          </button>
          <button type="button" onClick={() => zoomButton(1 / 1.4)} aria-label="缩小">
            －
          </button>
          <button type="button" onClick={() => fit()}>
            适应窗口
          </button>
          {!compact && (
            <>
              <button type="button" onClick={() => setAll(true)}>
                全部展开
              </button>
              <button type="button" onClick={() => setAll(false)}>
                收起
              </button>
            </>
          )}
        </div>
        {notFound && <span className="lineage-tree-error">没有找到“{query}”</span>}
      </div>

      <div ref={containerRef} className="lineage-tree-canvas" onPointerDown={onPointerDown}>
        <svg ref={svgRef} width="100%" height="100%" aria-label={`${data.name}的谱系树`}>
          <defs>
            <clipPath id="lineage-thumb-clip" clipPathUnits="objectBoundingBox">
              <rect width="1" height="1" rx="0.12" ry="0.12" />
            </clipPath>
          </defs>
          <g transform={`translate(${x},${y}) scale(${k})`}>
            {links.map((l) => (
              <path
                key={`${l.source.data.id}->${l.target.data.id}`}
                className="lineage-tree-link"
                vectorEffect="non-scaling-stroke"
                d={`M${l.source.y},${l.source.x}C${(l.source.y + l.target.y) / 2},${l.source.x} ${(l.source.y + l.target.y) / 2},${l.target.x} ${l.target.y},${l.target.x}`}
              />
            ))}

            {nodes.map((n) => {
              const { node, open, species, id } = n.data;
              const isPlant = node.level === "plant";

              if (isPlant && showCards && node.card) {
                const c = node.card;
                const meta = [c.habit, node.photoCount ? `${node.photoCount} 张实拍` : ""]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <a
                    key={id}
                    href={node.href}
                    onClick={(e) => openPlant(e, node.href, node.name)}
                    className={highlight === id ? "lineage-card lineage-card-on" : "lineage-card"}
                  >
                    <g transform={`translate(${n.y},${n.x - CARD_H / 2})`}>
                      <rect width={CARD_W} height={CARD_H} rx="10" className="lineage-card-bg" />
                      {node.photo ? (
                        <image
                          href={thumb(node.photo)}
                          x="10"
                          y="10"
                          width="80"
                          height="80"
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#lineage-thumb-clip)"
                        />
                      ) : (
                        <g>
                          <rect x="10" y="10" width="80" height="80" rx="10" className="lineage-card-empty" />
                          <text x="50" y="54" className="lineage-card-empty-text">
                            实拍整理中
                          </text>
                        </g>
                      )}
                      <text x="102" y="28" className="lineage-card-name">
                        {node.name}
                      </text>
                      <text x="102" y="45" className="lineage-card-latin">
                        {truncate(c.latin, 24)}
                      </text>
                      <text x="102" y="63" className="lineage-card-meta">
                        {truncate(meta, 13)}
                      </text>
                      <text x="102" y="80" className="lineage-card-text">
                        {truncate(c.summary || c.tags.join("、"), 12)}
                      </text>
                      {c.tags.length > 0 && c.summary && (
                        <text x="102" y="94" className="lineage-card-tags">
                          {truncate(c.tags.join(" · "), 15)}
                        </text>
                      )}
                    </g>
                  </a>
                );
              }

              if (isPlant) {
                return (
                  <a key={id} href={node.href} onClick={(e) => openPlant(e, node.href, node.name)}>
                    <g transform={`translate(${n.y},${n.x})`} className="lineage-tree-plant">
                      <circle
                        r={dot}
                        className={node.photo ? "lineage-dot-photo" : "lineage-dot-empty"}
                        stroke={highlight === id ? "#d97706" : undefined}
                      />
                      <text x={dot * 1.6} dy="0.35em" fontSize={label} className="lineage-tree-label">
                        {node.name}
                      </text>
                    </g>
                  </a>
                );
              }

              const hasPhotos = (node.photoCount ?? 0) > 0;
              return (
                <g
                  key={id}
                  transform={`translate(${n.y},${n.x})`}
                  className="lineage-tree-node"
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  aria-label={`${node.name}，${species} 种，${open ? "点击收起" : "点击展开"}`}
                  onClick={() => toggle(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(n);
                    }
                  }}
                >
                  <circle
                    r={dot}
                    className={
                      open ? "lineage-node-open" : hasPhotos ? "lineage-node-photo" : "lineage-node-closed"
                    }
                  />
                  <text
                    x={open ? -dot * 1.6 : dot * 1.6}
                    dy="0.35em"
                    fontSize={label}
                    textAnchor={open ? "end" : "start"}
                    className="lineage-tree-label lineage-tree-label-group"
                  >
                    {node.name}
                    {!open && <tspan className="lineage-tree-count"> {species}</tspan>}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="lineage-tree-hint">
        拖动平移 · 滚轮或双指缩放 · 点击节点展开或收起 · 放大后显示植物名片，点击名片查看详情
      </p>
    </div>
  );
}
