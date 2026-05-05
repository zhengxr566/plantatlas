"use client";

import Link from "next/link";
import { useState } from "react";
import { plants } from "@/data/plants";
import { comparePairs } from "@/data/comparePairs";

type Tree = Record<
  string,
  Record<string, Record<string, Record<string, Record<string, typeof plants>>>>
>;

export default function LineageSidebar() {
  const [openAll, setOpenAll] = useState(false);

  const featuredPlants = plants.slice(0, 6);
  const featuredCompares = comparePairs.slice(0, 5);

  const tree: Tree = {};

  plants.forEach((plant) => {
    tree[plant.division] ??= {};
    tree[plant.division][plant.className] ??= {};
    tree[plant.division][plant.className][plant.order] ??= {};
    tree[plant.division][plant.className][plant.order][plant.family] ??= {};
    tree[plant.division][plant.className][plant.order][plant.family][
      plant.genus
    ] ??= [];
    tree[plant.division][plant.className][plant.order][plant.family][
      plant.genus
    ].push(plant);
  });

  return (
    <aside className="lineage-sidebar">
      <div className="sidebar-section first">
        <h3>常见植物</h3>
        <ul>
          {featuredPlants.map((plant) => (
            <li key={plant.slug}>
              <Link href={`/plant/${plant.slug}`}>
                {plant.nameCn}
                <span>{plant.family} · {plant.genus}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>常见植物对比</h3>
        <ul>
          {featuredCompares.map((item) => (
            <li key={item.slug}>
              <Link href={`/compare/${item.slug}`}>{item.title}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-head">
          <h3>谱系结构</h3>
          <button onClick={() => setOpenAll(!openAll)}>
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
                      <details key={family} open={openAll} className="level-4">
                        <summary>{family}</summary>

                        {Object.entries(genera).map(([genus, species]) => (
                          <details key={genus} open={openAll} className="level-5">
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
  );
}