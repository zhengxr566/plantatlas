"use client";

import PlantPicker from "./PlantPicker";
import TagPicker from "./TagPicker";
import { SEASONS, partTagsFor, type AdminData, type PhotoMeta } from "./types";

// 上传和编辑共用的图片信息表单
export default function PhotoForm({
  meta,
  onChange,
  data,
  onAddTag,
  compact = false,
  onCreatePlant,
}: {
  meta: PhotoMeta;
  onChange: (meta: PhotoMeta) => void;
  data: AdminData;
  onAddTag: (tag: string, group?: string) => Promise<void>;
  compact?: boolean;
  // 打开“新增植物”对话框，返回新植物的 slug（取消时为 null）
  onCreatePlant?: (name: string) => Promise<string | null>;
}) {
  const plant = data.plants.find((p) => p.slug === meta.plant);
  const part = data.parts.find((p) => p.slug === meta.part);
  const autoTags = partTagsFor(plant, meta.part);

  // 换植物或部位时：去掉上一组自动预选的标签，换成新的；手动加的标签保留
  const set = <K extends keyof PhotoMeta>(key: K, value: PhotoMeta[K]) => {
    const next = { ...meta, [key]: value };
    if (key === "plant" || key === "part") {
      const nextPlant = data.plants.find((p) => p.slug === next.plant);
      const nextAuto = partTagsFor(nextPlant, next.part);
      const kept = meta.tags.filter((t) => !autoTags.includes(t));
      next.tags = [...kept, ...nextAuto.filter((t) => !kept.includes(t))];
    }
    onChange(next);
  };

  return (
    <div className="photo-form">
      <label className="field">
        <span>植物</span>
        <PlantPicker
          plants={data.plants}
          value={meta.plant}
          onChange={(v) => set("plant", v)}
          onCreate={
            onCreatePlant
              ? async (name) => {
                  const slug = await onCreatePlant(name);
                  if (slug) set("plant", slug);
                }
              : undefined
          }
        />
      </label>

      <div className="field">
        <span>部位</span>
        <div className="segmented">
          {data.parts.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={meta.part === p.slug ? "seg seg-on" : "seg"}
              onClick={() => set("part", p.slug)}
            >
              {p.nameCn}
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <>
          <div className="field">
            <span>识别标签</span>
            {autoTags.length > 0 && (
              <span className="muted">
                已按植物资料预选{part?.nameCn ?? ""}相关的标签，请去掉这张照片里看不出来的
              </span>
            )}
            <TagPicker
              value={meta.tags}
              onChange={(v) => set("tags", v)}
              groups={data.tagGroups}
              part={meta.part}
              onAddTag={onAddTag}
            />
          </div>

          <label className="field">
            <span>图片说明（alt 文本）</span>
            <input
              value={meta.caption}
              placeholder={
                plant && part
                  ? `例如：${plant.nameCn}秋季短枝上簇生的金黄色${part.noun}`
                  : "描述这张图能看到什么"
              }
              onChange={(e) => set("caption", e.target.value)}
            />
          </label>
        </>
      )}

      <div className="field-row">
        <label className="field">
          <span>季节</span>
          <select value={meta.season} onChange={(e) => set("season", e.target.value)}>
            <option value="">—</option>
            {SEASONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>地点</span>
          <input value={meta.location} placeholder="例如：东京" onChange={(e) => set("location", e.target.value)} />
        </label>
        <label className="field">
          <span>拍摄日期</span>
          <input type="date" value={meta.date} onChange={(e) => set("date", e.target.value)} />
        </label>
      </div>
    </div>
  );
}
