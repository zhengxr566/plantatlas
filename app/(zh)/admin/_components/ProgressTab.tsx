"use client";

import { useMemo, useState } from "react";
import type { AdminData } from "./types";

// 植物 × 部位的图片数量表，点击格子跳到上传页并预填
export default function ProgressTab({
  data,
  onPick,
}: {
  data: AdminData;
  onPick: (plant: string, part: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    data.photos.forEach((p) => {
      const key = `${p.plant}/${p.part}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [data.photos]);

  const plantsWithPhotos = new Set(data.photos.map((p) => p.plant));
  const indexable = data.pairs.filter((p) => p.indexable).length;

  const rows = data.plants.filter(
    (p) =>
      (!query || p.nameCn.includes(query) || p.nameLatin.toLowerCase().includes(query.toLowerCase())) &&
      (!onlyWithPhotos || plantsWithPhotos.has(p.slug))
  );

  return (
    <div className="progress-tab">
      <div className="stats">
        <div className="stat">
          <strong>{data.photos.length}</strong>
          <span>张图片</span>
        </div>
        <div className="stat">
          <strong>
            {plantsWithPhotos.size} / {data.plants.length}
          </strong>
          <span>种植物有实拍图</span>
        </div>
        <div className="stat">
          <strong>
            {indexable} / {data.pairs.length}
          </strong>
          <span>个对比页可被收录</span>
        </div>
        <div className="stat">
          <strong>{data.photos.filter((p) => p.tags.split("|").filter(Boolean).length < 2).length}</strong>
          <span>张图片标签不足 2 个</span>
        </div>
      </div>

      <div className="filters">
        <input value={query} placeholder="搜索植物" onChange={(e) => setQuery(e.target.value)} />
        <label className="checkbox">
          <input type="checkbox" checked={onlyWithPhotos} onChange={(e) => setOnlyWithPhotos(e.target.checked)} />
          只看已有图片的植物
        </label>
        <span className="muted">点击格子即可为该植物的该部位上传图片</span>
      </div>

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th>植物</th>
              {data.parts.map((part) => (
                <th key={part.slug}>{part.nameCn}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((plant) => (
              <tr key={plant.slug}>
                <th>
                  <a href={`/plant/${plant.slug}`} target="_blank" rel="noopener">
                    {plant.nameCn}
                  </a>
                  <span className="muted"> {plant.family}</span>
                </th>
                {data.parts.map((part) => {
                  const n = counts.get(`${plant.slug}/${part.slug}`) ?? 0;
                  return (
                    <td key={part.slug}>
                      <button
                        type="button"
                        className={n > 0 ? "cell cell-on" : "cell"}
                        title={`为${plant.nameCn}上传${part.nameCn}图片`}
                        onClick={() => onPick(plant.slug, part.slug)}
                      >
                        {n > 0 ? n : "+"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
