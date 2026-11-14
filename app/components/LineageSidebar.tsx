"use client";

import Link from "next/link";
import { useState } from "react";
import { useSidebar } from "./sidebarContext";

// 谱系结构：类群 › 演化支（可多层）/ 纲 › 目 › 科 › 属 › 种；种没有 children
export type SidebarNode = { name: string; href?: string; latin?: string; children?: SidebarNode[] };

function SidebarBranch({ node, open }: { node: SidebarNode; open: boolean }) {
  const children = node.children ?? [];
  const leaves = children.filter((c) => !c.children);
  return (
    <details open={open} className="sidebar-sub">
      <summary>{node.name}</summary>
      {children
        .filter((c) => c.children)
        .map((c) => (
          <SidebarBranch key={c.name} node={c} open={open} />
        ))}
      {leaves.length > 0 && (
        <ul>
          {leaves.map((plant) => (
            <li key={plant.href}>
              <Link href={plant.href ?? "#"}>
                {plant.name}
                <span>{plant.latin}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export default function LineageSidebar({
  featuredPlants,
  featuredCompares,
  identifyLinks,
  tree,
}: {
  featuredPlants: { slug: string; nameCn: string; family: string; genus: string }[];
  featuredCompares: { slug: string; title: string }[];
  identifyLinks: { slug: string; title: string }[];
  tree: SidebarNode[];
}) {
  const [openAll, setOpenAll] = useState(false);
  // 手机上由顶部菜单按钮打开（状态在 AtlasShell 中）
  const { open: mobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={
          mobileOpen
            ? "lineage-sidebar lineage-sidebar-open"
            : "lineage-sidebar"
        }
      >
        {/* 手机上顶部导航隐藏，入口放在抽屉最上方 */}
        <nav className="sidebar-mobile-nav" aria-label="主导航">
          <Link href="/">首页</Link>
          <Link href="/lineage">谱系地图</Link>
          <Link href="/compare">植物对比</Link>
          <Link href="/identify">植物识别</Link>
        </nav>

        <div className="sidebar-section first">
          <h3>常见植物</h3>
          <ul>
            {featuredPlants.map((plant) => (
              <li key={plant.slug}>
                <Link href={`/plant/${plant.slug}`}>
                  {plant.nameCn}
                  <span>
                    {plant.family} · {plant.genus}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {featuredCompares.length > 0 && (
          <div className="sidebar-section">
            <h3>
              <Link href="/compare" className="sidebar-title-link">
                常见植物对比
              </Link>
            </h3>

            <ul>
              {featuredCompares.map((item) => (
                <li key={item.slug}>
                  <Link href={`/compare/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {identifyLinks.length > 0 && (
          <div className="sidebar-section">
            <h3>
              <Link href="/identify" className="sidebar-title-link">
                植物识别
              </Link>
            </h3>

            <ul>
              {identifyLinks.map((page) => (
                <li key={page.slug}>
                  <Link href={`/identify/${page.slug}`}>
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-head">
            <h3>
              <Link href="/lineage" className="sidebar-title-link">
                谱系结构（地图）
              </Link>
            </h3>
            <button type="button" onClick={() => setOpenAll((value) => !value)}>
              {openAll ? "全部折叠" : "全部展开"}
            </button>
          </div>

          {tree.map((division) => (
            <SidebarBranch key={division.name} node={division} open={openAll} />
          ))}
        </div>
      </aside>
    </>
  );
}