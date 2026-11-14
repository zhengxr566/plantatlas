"use client";

import { useEffect, useRef, useState } from "react";
import type { CropRect } from "./CropDialog";

const MIN_SIZE = 12;

// 打码：在图片上拖动框选人脸、车牌等，框内在上传时变成马赛克。坐标以原图像素保存。
export default function RedactDialog({
  src,
  initial,
  crop,
  onApply,
  onCancel,
}: {
  src: string;
  initial?: CropRect[];
  // 已设置的裁剪区域：框外部分不会出现在网站上，只做提示
  crop?: CropRect | null;
  onApply: (regions: CropRect[]) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [regions, setRegions] = useState<CropRect[]>(initial ?? []);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  function onLoad() {
    const img = imgRef.current!;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setScale(img.clientWidth / img.naturalWidth);
  }

  useEffect(() => {
    const onResize = () => {
      const img = imgRef.current;
      if (img?.naturalWidth) setScale(img.clientWidth / img.naturalWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 拖动中：坐标换算成原图像素，限制在图片范围内
  function toImage(e: React.PointerEvent) {
    const box = imgRef.current!.getBoundingClientRect();
    const clampX = Math.min(Math.max(0, e.clientX - box.left), box.width);
    const clampY = Math.min(Math.max(0, e.clientY - box.top), box.height);
    return { x: clampX / scale, y: clampY / scale };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!natural || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = toImage(e);
    setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draft) return;
    const p = toImage(e);
    setDraft({ ...draft, x1: p.x, y1: p.y });
  }

  function onPointerUp() {
    if (!draft) return;
    const rect = {
      x: Math.round(Math.min(draft.x0, draft.x1)),
      y: Math.round(Math.min(draft.y0, draft.y1)),
      width: Math.round(Math.abs(draft.x1 - draft.x0)),
      height: Math.round(Math.abs(draft.y1 - draft.y0)),
    };
    setDraft(null);
    // 太小的框当作误点
    if (rect.width * scale >= MIN_SIZE && rect.height * scale >= MIN_SIZE) setRegions((r) => [...r, rect]);
  }

  const draftRect = draft && {
    x: Math.min(draft.x0, draft.x1),
    y: Math.min(draft.y0, draft.y1),
    width: Math.abs(draft.x1 - draft.x0),
    height: Math.abs(draft.y1 - draft.y0),
  };
  const box = (r: CropRect) => ({
    left: r.x * scale,
    top: r.y * scale,
    width: r.width * scale,
    height: r.height * scale,
  });

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal panel crop-modal" onClick={(e) => e.stopPropagation()}>
        <h2>隐私打码</h2>
        <p className="muted">
          拖动框选人脸、车牌、门牌、名牌、证件等个人信息，框内会变成马赛克（网站上的图片无法还原；本地原图不公开，保持不变）。
          点击框右上角的 × 删除。
        </p>

        <div
          className="crop-stage redact-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDraft(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={src} alt="" onLoad={onLoad} draggable={false} />
          {crop && natural && <div className="redact-crop" style={box(crop)} aria-hidden="true" />}
          {regions.map((r, i) => (
            <div key={`${r.x}-${r.y}-${i}`} className="redact-box" style={box(r)}>
              <button
                type="button"
                className="redact-remove"
                aria-label="删除这个打码区域"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setRegions((all) => all.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
          {draftRect && <div className="redact-box redact-draft" style={box(draftRect)} />}
        </div>

        <p className="muted">
          {regions.length ? `共 ${regions.length} 个打码区域` : "还没有打码区域"}
          {crop && " · 虚线框是裁剪后保留的范围"}
        </p>

        <div className="queue-item-actions">
          <button type="button" className="btn btn-primary" disabled={!natural} onClick={() => onApply(regions)}>
            确定
          </button>
          {regions.length > 0 && (
            <button type="button" className="btn" onClick={() => setRegions([])}>
              清除全部
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
