"use client";

import { useMemo, useState } from "react";
import CropDialog, { type CropRect } from "./CropDialog";
import PhotoForm from "./PhotoForm";
import PlantPicker from "./PlantPicker";
import { api, splitTags, type AdminData, type PhotoMeta, type PhotoRow } from "./types";

function toMeta(row: PhotoRow): PhotoMeta {
  return {
    plant: row.plant,
    part: row.part,
    tags: splitTags(row.tags),
    caption: row.caption,
    season: row.season,
    location: row.location,
    date: row.date,
  };
}

export default function LibraryTab({
  data,
  onChanged,
  onAddTag,
  onCreatePlant,
}: {
  data: AdminData;
  onChanged: () => void;
  onAddTag: (tag: string) => Promise<void>;
  onCreatePlant?: (name: string) => Promise<string | null>;
}) {
  const [plant, setPlant] = useState("");
  const [part, setPart] = useState("");
  const [onlyTodo, setOnlyTodo] = useState(false);
  const [editing, setEditing] = useState<{ file: string; meta: PhotoMeta } | null>(null);
  const [message, setMessage] = useState("");
  const [cropping, setCropping] = useState(false);
  // 裁剪后图片地址不变，用版本号刷新浏览器缓存
  const [versions, setVersions] = useState<Record<string, number>>({});
  const src = (file: string) => `/photos/${file}${versions[file] ? `?v=${versions[file]}` : ""}`;

  const plantName = (slug: string) => data.plants.find((p) => p.slug === slug)?.nameCn ?? slug;
  const partName = (slug: string) => data.parts.find((p) => p.slug === slug)?.nameCn ?? slug;

  const photos = useMemo(
    () =>
      data.photos.filter(
        (p) =>
          (!plant || p.plant === plant) &&
          (!part || p.part === part) &&
          (!onlyTodo || splitTags(p.tags).length < 2 || !p.caption)
      ),
    [data.photos, plant, part, onlyTodo]
  );

  async function save() {
    if (!editing) return;
    try {
      const { row } = await api<{ row: PhotoRow }>("/api/admin/photos", {
        method: "PATCH",
        json: { file: editing.file, ...editing.meta },
      });
      setEditing({ file: row.file, meta: toMeta(row) });
      setMessage("已保存");
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function applyCrop(crop: CropRect) {
    if (!editing) return;
    setCropping(false);
    try {
      const { row } = await api<{ row: PhotoRow }>("/api/admin/photos", {
        method: "PATCH",
        json: { file: editing.file, crop },
      });
      setVersions((v) => ({ ...v, [row.file]: Date.now() }));
      setMessage(`已裁剪，保存为 ${row.width}×${row.height}`);
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function remove() {
    if (!editing || !confirm(`删除 ${editing.file}？图片文件也会被删除。`)) return;
    try {
      await api("/api/admin/photos", { method: "DELETE", json: { file: editing.file } });
      setEditing(null);
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="library-tab">
      <div className="filters">
        <PlantPicker plants={data.plants} value={plant} onChange={setPlant} placeholder="按植物筛选" />
        {plant && (
          <button type="button" className="btn btn-ghost" onClick={() => setPlant("")}>
            清除
          </button>
        )}
        <select value={part} onChange={(e) => setPart(e.target.value)}>
          <option value="">全部部位</option>
          {data.parts.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.nameCn}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} />
          只看待完善（标签少于 2 个或没有说明）
        </label>
        <span className="muted">{photos.length} 张</span>
      </div>

      <div className="library-layout">
        <div className="library-grid">
          {photos.length === 0 && <p className="muted">没有图片。去“上传图片”添加吧。</p>}
          {photos.map((p) => {
            const tagCount = splitTags(p.tags).length;
            return (
              <button
                key={p.file}
                type="button"
                className={editing?.file === p.file ? "library-card library-card-on" : "library-card"}
                onClick={() => {
                  setEditing({ file: p.file, meta: toMeta(p) });
                  setMessage("");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(p.file)} alt="" loading="lazy" />
                <span className="library-card-title">
                  {plantName(p.plant)} · {partName(p.part)}
                </span>
                <span className={tagCount < 2 ? "badge badge-warn" : "badge"}>{tagCount} 个标签</span>
              </button>
            );
          })}
        </div>

        {editing && (
          <aside className="panel library-editor">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(editing.file)} alt="" className="library-editor-image" />
            <p className="muted">{editing.file}</p>
            <PhotoForm
              meta={editing.meta}
              onChange={(meta) => setEditing({ ...editing, meta })}
              data={data}
              onAddTag={onAddTag}
            onCreatePlant={onCreatePlant}
            />
            <div className="queue-item-actions">
              <button type="button" className="btn btn-primary" onClick={save}>
                保存
              </button>
              <button type="button" className="btn" onClick={() => setCropping(true)}>
                裁剪
              </button>
              <a
                className="btn"
                href={`/plant/${editing.meta.plant}/${editing.meta.part}`}
                target="_blank"
                rel="noopener"
              >
                查看页面
              </a>
              <button type="button" className="btn btn-danger" onClick={remove}>
                删除
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                关闭
              </button>
            </div>
            {message && <p className="muted">{message}</p>}
          </aside>
        )}
      </div>

      {cropping && editing && (
        <CropDialog
          src={src(editing.file)}
          onCancel={() => setCropping(false)}
          onApply={(crop) => applyCrop(crop)}
        />
      )}
    </div>
  );
}
