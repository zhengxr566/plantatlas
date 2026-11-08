"use client";

import { useRef, useState } from "react";
import CropDialog, { type CropRect } from "./CropDialog";
import PhotoForm from "./PhotoForm";
import { api, partTagsFor, type AdminData, type PhotoMeta, type PhotoRow } from "./types";

type QueueItem = {
  id: string;
  file: File;
  preview: string;
  meta: PhotoMeta;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  saved?: PhotoRow;
  // 裁剪区域（原图像素）和裁剪后的小预览
  crop?: CropRect | null;
  cropPreview?: string;
};

const EMPTY_META: PhotoMeta = {
  plant: "",
  part: "leaf",
  tags: [],
  caption: "",
  season: "",
  location: "",
  date: "",
};

export default function UploadTab({
  data,
  preset,
  onUploaded,
  onAddTag,
  onCreatePlant,
}: {
  data: AdminData;
  preset: { plant: string; part: string } | null;
  onUploaded: () => void;
  onAddTag: (tag: string, group?: string) => Promise<void>;
  onCreatePlant?: (name: string) => Promise<string | null>;
}) {
  const [defaults, setDefaults] = useState<PhotoMeta>(EMPTY_META);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [cropping, setCropping] = useState<QueueItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 从“拍摄进度”点击格子跳转过来时，预填植物和部位
  const [appliedPreset, setAppliedPreset] = useState(preset);
  if (preset !== appliedPreset) {
    setAppliedPreset(preset);
    if (preset) setDefaults((d) => ({ ...d, plant: preset.plant, part: preset.part }));
  }

  function addFiles(files: FileList | File[]) {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setQueue((q) => [
      ...q,
      ...images.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        meta: {
          ...defaults,
          // 按默认的植物和部位预选标签
          tags: partTagsFor(
            data.plants.find((p) => p.slug === defaults.plant),
            defaults.part
          ),
          caption: "",
        },
        status: "pending" as const,
      })),
    ]);
  }

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setQueue((q) => {
      const item = q.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return q.filter((i) => i.id !== id);
    });
  }

  function applyTagsToOthers(source: QueueItem) {
    setQueue((q) =>
      q.map((item) =>
        item.status === "pending" && item.id !== source.id
          ? { ...item, meta: { ...item.meta, tags: [...source.meta.tags] } }
          : item
      )
    );
  }

  async function upload(item: QueueItem) {
    if (!item.meta.plant) {
      updateItem(item.id, { status: "error", error: "请先选择植物" });
      return;
    }
    updateItem(item.id, { status: "uploading", error: undefined });
    try {
      const form = new FormData();
      form.append("file", item.file);
      form.append("meta", JSON.stringify(item.meta));
      if (item.crop) form.append("crop", JSON.stringify(item.crop));
      const result = await api<{ row: PhotoRow }>("/api/admin/photos", {
        method: "POST",
        body: form,
      });
      updateItem(item.id, { status: "done", saved: result.row });
      onUploaded();
    } catch (error) {
      updateItem(item.id, { status: "error", error: (error as Error).message });
    }
  }

  async function uploadAll() {
    // 逐张上传，避免文件名冲突
    for (const item of queue.filter((i) => i.status === "pending" || i.status === "error")) {
      await upload(item);
    }
  }

  const pending = queue.filter((i) => i.status !== "done").length;

  return (
    <div className="upload-tab">
      <section className="panel">
        <h2>默认信息</h2>
        <p className="muted">新加入的图片会使用这里的植物、部位、季节、地点和日期，之后每张图还可以单独修改。日期留空时会自动读取照片的拍摄日期。</p>
        <PhotoForm meta={defaults} onChange={setDefaults} data={data} onAddTag={onAddTag}
            onCreatePlant={onCreatePlant} compact />
      </section>

      <div
        className={dragging ? "dropzone dropzone-active" : "dropzone"}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <strong>拖入图片，或点击选择</strong>
        <span className="muted">
          支持 JPG / PNG / WebP。上传时自动压缩到长边 1600px，并去除 GPS 等 EXIF 信息。
          iPhone 的 HEIC 照片请先导出为 JPG（或在“设置 › 相机 › 格式”中选择“兼容性最佳”）。
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="queue-actions">
          <span>
            共 {queue.length} 张，待上传 {pending} 张
          </span>
          <button type="button" className="btn btn-primary" disabled={pending === 0} onClick={uploadAll}>
            全部上传
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => queue.filter((i) => i.status === "done").forEach((i) => removeItem(i.id))}
          >
            清除已完成
          </button>
        </div>
      )}

      <div className="queue">
        {queue.map((item) => (
          <article key={item.id} className={`queue-item queue-${item.status}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.cropPreview ?? item.preview} alt="" className="queue-preview" />
            <div className="queue-body">
              {item.status === "done" && item.saved ? (
                <div className="queue-saved">
                  <strong>已保存：{item.saved.file}</strong>
                  <span className="muted">
                    {item.saved.width}×{item.saved.height}
                    {item.saved.date && ` · ${item.saved.date}`}
                  </span>
                  <a href={`/plant/${item.saved.plant}/${item.saved.part}`} target="_blank" rel="noopener" className="link">
                    在网站上查看 ›
                  </a>
                </div>
              ) : (
                <>
                  <PhotoForm
                    meta={item.meta}
                    onChange={(meta) => updateItem(item.id, { meta })}
                    data={data}
                    onAddTag={onAddTag}
            onCreatePlant={onCreatePlant}
                  />
                  {item.error && <p className="error">{item.error}</p>}
                  <div className="queue-item-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={item.status === "uploading"}
                      onClick={() => upload(item)}
                    >
                      {item.status === "uploading" ? "上传中…" : "上传"}
                    </button>
                    <button type="button" className="btn" onClick={() => setCropping(item)}>
                      {item.crop ? "重新裁剪" : "裁剪"}
                    </button>
                    {item.crop && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => updateItem(item.id, { crop: null, cropPreview: undefined })}
                      >
                        取消裁剪
                      </button>
                    )}
                    {item.meta.tags.length > 0 && queue.length > 1 && (
                      <button type="button" className="btn" onClick={() => applyTagsToOthers(item)}>
                        标签应用到其他待上传图片
                      </button>
                    )}
                    <button type="button" className="btn btn-ghost" onClick={() => removeItem(item.id)}>
                      移除
                    </button>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {cropping && (
        <CropDialog
          src={cropping.preview}
          initial={cropping.crop}
          onCancel={() => setCropping(null)}
          onApply={(crop, cropPreview) => {
            updateItem(cropping.id, { crop, cropPreview });
            setCropping(null);
          }}
        />
      )}
    </div>
  );
}
