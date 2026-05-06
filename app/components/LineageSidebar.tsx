"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { plants } from "@/data/plants";

type Plant = (typeof plants)[number];

type ComparePair = {
  slug: string;
  title: string;
};

type Tree = Record<
  string,
  Record<string, Record<string, Record<string, Record<string, Plant[]>>>>
>;

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[|、,，]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeName(value: unknown): string {
  return String(value || "").trim();
}

function makePairKey(slugA: string, slugB: string) {
  return [slugA, slugB].sort().join("__");
}

function generateClientComparePairs(): ComparePair[] {
  const pairs: ComparePair[] = [];
  const seen = new Set<string>();

  const plantsByName = new Map(
    plants.map((plant) => [normalizeName(plant.nameCn), plant])
  );

  plants.forEach((plant) => {
    const similarList = toList(plant.similar);

    similarList.forEach((similarName) => {
      const target = plantsByName.get(normalizeName(similarName));

      if (!target) return;
      if (target.slug === plant.slug) return;

      const pairKey = makePairKey(plant.slug, target.slug);
      if (seen.has(pairKey)) return;

      seen.add(pairKey);

      pairs.push({
        slug: `${plant.slug}-vs-${target.slug}`,
        title: `${plant.nameCn}和${target.nameCn}的区别`,
      });
    });
  });

  return pairs;
}

function buildTree(): Tree {
  const tree: Tree = {};

  plants.forEach((plant) => {
    const division = plant.division || "未分类类群";
    const className = plant.className || "未分类纲";
    const order = plant.order || "未分类目";
    const family = plant.family || "未分类科";
    const genus = plant.genus || "未分类属";

    tree[division] ??= {};
    tree[division][className] ??= {};
    tree[division][className][order] ??= {};
    tree[division][className][order][family] ??= {};
    tree[division][className][order][family][genus] ??= [];
    tree[division][className][order][family][genus].push(plant);
  });

  return tree;
}

export default function LineageSidebar() {
  const [openAll, setOpenAll] = useState(false);

  const featuredPlants = useMemo(() => plants.slice(0, 6), []);
  const featuredCompares = useMemo(
    () => generateClientComparePairs().slice(0, 5),
    []
  );
  const tree = useMemo(() => buildTree(), []);

  return (
    <aside className="lineage-sidebar">
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
          <h3>常见植物对比</h3>
          <ul>
            {featuredCompares.map((item) => (
              <li key={item.slug}>
                <Link href={`/compare/${item.slug}`}>{item.title}</Link>
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