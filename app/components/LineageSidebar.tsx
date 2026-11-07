"use client";

import Link from "next/link";
import { useState } from "react";

type PlantLink = { slug: string; nameCn: string; nameLatin: string };

export type SidebarTree = Record<
  string,
  Record<string, Record<string, Record<string, Record<string, PlantLink[]>>>>
>;

export default function LineageSidebar({
  featuredPlants,
  featuredCompares,
  identifyLinks,
  tree,
}: {
  featuredPlants: { slug: string; nameCn: string; family: string; genus: string }[];
  featuredCompares: { slug: string; title: string }[];
  identifyLinks: { slug: string; title: string }[];
  tree: SidebarTree;
}) {
  const [openAll, setOpenAll] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? "收起谱系导航" : "展开谱系导航"}
      </button>

      <aside
        className={
          mobileOpen
            ? "lineage-sidebar lineage-sidebar-open"
            : "lineage-sidebar"
        }
      >
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
            <h3>谱系结构</h3>
            <button type="button" onClick={() => setOpenAll((value) => !value)}>
              {openAll ? "全部折叠" : "全部展开"}
            </button>
          </div>

          {Object.entries(tree).map(([division, classes]) => (
            <details key={division} open={openAll}>
              <summary>{division}</summary>

              {Object.entries(classes).map(([className, orders]) => (
                <details key={className} open={openAll} className="level-2">
                  <summary>{className}</summary>

                  {Object.entries(orders).map(([order, families]) => (
                    <details key={order} open={openAll} className="level-3">
                      <summary>{order}</summary>

                      {Object.entries(families).map(([family, genera]) => (
                        <details
                          key={family}
                          open={openAll}
                          className="level-4"
                        >
                          <summary>{family}</summary>

                          {Object.entries(genera).map(([genus, species]) => (
                            <details
                              key={genus}
                              open={openAll}
                              className="level-5"
                            >
                              <summary>{genus}</summary>

                              <ul>
                                {species.map((plant) => (
                                  <li key={plant.slug}>
                                    <Link href={`/plant/${plant.slug}`}>
                                      {plant.nameCn}
                                      <span>{plant.nameLatin}</span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ))}
                        </details>
                      ))}
                    </details>
                  ))}
                </details>
              ))}
            </details>
          ))}
        </div>
      </aside>
    </>
  );
}