"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hierarchy, pack, type HierarchyCircularNode } from "d3-hierarchy";
import type { LineageNode } from "@/lib/lineage";

type PackNode = HierarchyCircularNode<LineageNode>;
type View = [number, number, number];

const SIZE = 640;
const DURATION = 650;
// 各层级的底色（越深层越绿）
const DEPTH_FILLS = ["#f4f8f3", "#eaf3e6", "#dcebd6", "#cde2c4", "#bdd9b1", "#acd09e"];

function thumb(src: string) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=128&q=75`;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 可缩放的谱系地图：点击圆圈进入下一级，点击植物进入植物页，点击空白返回上一级
export default function LineageMap({
  data,
  compact = false,
}: {
  data: LineageNode;
  // 嵌入科、属页面时：不显示搜索框
  compact?: boolean;
}) {
  const router = useRouter();

  const root = useMemo(
    () =>
      pack<LineageNode>()
        .size([SIZE, SIZE])
        .padding((d) => (d.depth < 2 ? 8 : 3))(
        hierarchy(data)
          .count()
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      ),
    [data]
  );
  const nodes = useMemo(() => root.descendants(), [root]);
  const leaves = useMemo(() => root.leaves(), [root]);

  const [focus, setFocus] = useState<PackNode>(root);
  const [view, setView] = useState<View>([root.x, root.y, root.r * 2]);
  const [highlight, setHighlight] = useState<PackNode | null>(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);
  const viewRef = useRef(view);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function zoom(target: PackNode) {
    const from = viewRef.current;
    const to: View = [target.x, target.y, target.r * 2];
    let start = -1;
    cancelAnimationFrame(frame.current);
    setFocus(target);

    const step = (now: number) => {
      if (start < 0) start = now;
      const t = easeInOutCubic(Math.min(1, (now - start) / DURATION));
      const next: View = [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      ];
      viewRef.current = next;
      setView(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }

  function onNodeClick(node: PackNode, e: React.MouseEvent) {
    e.stopPropagation();
    if (!node.children) {
      if (node.data.href) router.push(node.data.href);
      return;
    }
    if (node === focus) {
      zoom(node.parent ?? root);
      return;
    }
    // 只有一个下级的层级（如 被子植物 › 木兰纲）直接跳过，少点一次
    let target = node;
    while (target.children?.length === 1 && target.children[0].children) {
      target = target.children[0];
    }
    zoom(target);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const found =
      leaves.find((l) => l.data.name === q) ?? leaves.find((l) => l.data.name.includes(q));
    setNotFound(!found);
    if (!found) return;
    setHighlight(found);
    zoom(found.parent ?? root);
  }

  const k = SIZE / view[2];
  const pos = (d: PackNode) => [(d.x - view[0]) * k, (d.y - view[1]) * k] as const;
  const photoLeaves = leaves.filter((l) => l.data.photo);
  const path = focus.ancestors().reverse();

  return (
    <div className="lineage-map">
      <div className="lineage-map-bar">
        <nav className="lineage-map-path" aria-label="当前位置">
          {path.map((node, i) => (
            <span key={`${node.data.name}-${i}`}>
              {i > 0 && <span className="lineage-map-sep">›</span>}
              {node === focus ? (
                <strong>{node.data.name}</strong>
              ) : (
                <button type="button" onClick={() => zoom(node)}>
                  {node.data.name}
                </button>
              )}
            </span>
          ))}
        </nav>
        <span className="lineage-map-stats">
          {focus.value} 种
          {(focus.data.photoCount ?? 0) > 0 && ` · ${focus.data.photoCount} 种有实拍图`}
          {focus.data.href && focus !== root && (
            <>
              {" · "}
              <Link href={focus.data.href} className="link">
                查看{focus.data.name}页面 ›
              </Link>
            </>
          )}
        </span>
      </div>

      {!compact && (
        <form className="lineage-map-search" onSubmit={search}>
          <input
            value={query}
            list="lineage-plants"
            placeholder="搜索植物，例如 白皮松"
            onChange={(e) => {
              setQuery(e.target.value);
              setNotFound(false);
            }}
          />
          <button type="submit">定位</button>
          {notFound && <span className="lineage-map-error">没有找到“{query}”</span>}
          <datalist id="lineage-plants">
            {leaves.map((l) => (
              <option key={l.data.href} value={l.data.name} />
            ))}
          </datalist>
        </form>
      )}

      <svg
        viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
        className="lineage-map-svg"
        role="img"
        aria-label={`${data.name}的谱系地图，点击圆圈放大`}
        onClick={() => zoom(focus.parent ?? root)}
      >
        <defs>
          {photoLeaves.map((leaf, i) => (
            <pattern
              key={leaf.data.href}
              id={`lineage-photo-${i}`}
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={thumb(leaf.data.photo!)}
                width="1"
                height="1"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          ))}
        </defs>

        {nodes.map((node) => {
          const [x, y] = pos(node);
          const photoIndex = photoLeaves.indexOf(node);
          const isLeaf = !node.children;
          return (
            <circle
              key={`${node.data.level}-${node.data.href ?? node.data.name}-${node.depth}`}
              cx={x}
              cy={y}
              r={node.r * k}
              className={isLeaf ? "lineage-leaf" : "lineage-group"}
              fill={
                isLeaf
                  ? photoIndex >= 0
                    ? `url(#lineage-photo-${photoIndex})`
                    : "#ffffff"
                  : DEPTH_FILLS[Math.min(node.depth, DEPTH_FILLS.length - 1)]
              }
              stroke={node === highlight ? "#d97706" : isLeaf ? "#97c459" : "none"}
              strokeWidth={node === highlight ? 3 : 1}
              onClick={(e) => onNodeClick(node, e)}
            >
              {/* React 要求 <title> 只有一个文本子节点 */}
              <title>{`${
                node
                  .ancestors()
                  .reverse()
                  .slice(1)
                  .map((a) => a.data.name)
                  .join(" › ") || data.name
              }${isLeaf ? "（点击查看）" : ""}`}</title>
            </circle>
          );
        })}

        {nodes
          .filter(
            (node) =>
              (node.parent === focus && node.r * k > 16) ||
              // 植物名在上一级就显示（空间足够时）
              (!node.children && node.parent?.parent === focus && node.r * k > 24)
          )
          .map((node) => {
            const [x, y] = pos(node);
            const isLeaf = !node.children;
            return (
              <text
                key={`label-${node.data.level}-${node.data.href ?? node.data.name}`}
                x={x}
                y={isLeaf ? y : y - node.r * k + 16}
                className={
                  isLeaf && node.data.photo ? "lineage-label lineage-label-photo" : "lineage-label"
                }
                dominantBaseline={isLeaf ? "middle" : "auto"}
              >
                {node.data.name}
              </text>
            );
          })}
      </svg>

      <p className="lineage-map-legend">
        <span className="lineage-dot lineage-dot-photo" /> 有实拍图
        <span className="lineage-dot" /> 待拍摄
        <span className="meta">点击圆圈放大，点击植物查看详情，点击空白处返回上一级</span>
      </p>
    </div>
  );
}
