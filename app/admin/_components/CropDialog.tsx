"use client";

import { useEffect, useRef, useState } from "react";

export type CropRect = { x: number; y: number; width: number; height: number };

const ASPECTS: { label: string; value: number | null }[] = [
  { label: "自由", value: null },
  { label: "4:3 横", value: 4 / 3 },
  { label: "3:4 竖", value: 3 / 4 },
  { label: "1:1 方", value: 1 },
  { label: "16:9", value: 16 / 9 },
];
// Google 图片建议宽度至少 1200px
const MIN_RECOMMENDED_EDGE = 1200;
const OUTPUT_MAX_EDGE = 1600;
const MIN_SIZE = 40;

type Drag = {
  mode: "move" | "nw" | "ne" | "sw" | "se";
  startX: number;
  startY: number;
  start: CropRect;
};

// 在给定比例下，取居中、尽量大的裁剪框
function centeredRect(w: number, h: number, aspect: number | null): CropRect {
  if (!aspect) return { x: 0, y: 0, width: w, height: h };
  const width = Math.min(w, h * aspect);
  const height = width / aspect;
  return { x: (w - width) / 2, y: (h - height) / 2, width, height };
}

// 拖动框内移动，拖动四角调整大小；坐标以原图像素保存
export default function CropDialog({
  src,
  initial,
  onApply,
  onCancel,
}: {
  src: string;
  initial?: CropRect | null;
  onApply: (crop: CropRect, preview: string) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [aspect, setAspect] = useState<number | null>(null);
  const [rect, setRect] = useState<CropRect | null>(initial ?? null);
  const [drag, setDrag] = useState<Drag | null>(null);

  function onLoad() {
    const img = imgRef.current!;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setScale(img.clientWidth / img.naturalWidth);
    if (!rect) setRect(centeredRect(img.naturalWidth, img.naturalHeight, null));
  }

  // 窗口大小变化时更新显示比例
  useEffect(() => {
    const onResize = () => {
      const img = imgRef.current;
      if (img?.naturalWidth) setScale(img.clientWidth / img.naturalWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!drag || !natural) return;
    const { w, h } = natural;

    function onMove(e: PointerEvent) {
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      const s = drag.start;

      if (drag.mode === "move") {
        setRect({
          ...s,
          x: Math.min(Math.max(0, s.x + dx), w - s.width),
          y: Math.min(Math.max(0, s.y + dy), h - s.height),
        });
        return;
      }

      // 以对角为固定点调整大小
      const right = drag.mode.includes("e");
      const bottom = drag.mode.includes("s");
      const anchorX = right ? s.x : s.x + s.width;
      const anchorY = bottom ? s.y : s.y + s.height;
      let width = Math.max(MIN_SIZE, right ? s.width + dx : s.width - dx);
      let height = Math.max(MIN_SIZE, bottom ? s.height + dy : s.height - dy);
      width = Math.min(width, right ? w - anchorX : anchorX);
      height = Math.min(height, bottom ? h - anchorY : anchorY);
      if (aspect) {
        // 按比例取较小的一边，保证不超出图片
        if (width / height > aspect) width = height * aspect;
        else height = width / aspect;
      }
      setRect({
        x: right ? anchorX : anchorX - width,
        y: bottom ? anchorY : anchorY - height,
        width,
        height,
      });
    }

    function onUp() {
      setDrag(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, natural, scale, aspect]);

  function startDrag(mode: Drag["mode"], e: React.PointerEvent) {
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode, startX: e.clientX, startY: e.clientY, start: rect });
  }

  function chooseAspect(value: number | null) {
    setAspect(value);
    if (natural) setRect(centeredRect(natural.w, natural.h, value));
  }

  function apply() {
    if (!rect || !imgRef.current) return;
    const crop = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
    // 生成小预览图，用于上传队列显示
    const canvas = document.createElement("canvas");
    const previewScale = Math.min(1, 480 / Math.max(crop.width, crop.height));
    canvas.width = Math.round(crop.width * previewScale);
    canvas.height = Math.round(crop.height * previewScale);
    canvas
      .getContext("2d")
      ?.drawImage(imgRef.current, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    onApply(crop, canvas.toDataURL("image/jpeg", 0.85));
  }

  const longEdge = rect ? Math.round(Math.max(rect.width, rect.height)) : 0;
  const outScale = longEdge > OUTPUT_MAX_EDGE ? OUTPUT_MAX_EDGE / longEdge : 1;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal panel crop-modal" onClick={(e) => e.stopPropagation()}>
        <h2>裁剪图片</h2>
        <div className="segmented">
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              type="button"
              className={aspect === a.value ? "seg seg-on" : "seg"}
              onClick={() => chooseAspect(a.value)}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="crop-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={src} alt="" onLoad={onLoad} draggable={false} />
          {rect && (
            <div
              className="crop-box"
              style={{
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
              }}
              onPointerDown={(e) => startDrag("move", e)}
            >
              {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                <span
                  key={corner}
                  className={`crop-handle crop-${corner}`}
                  onPointerDown={(e) => startDrag(corner, e)}
                />
              ))}
            </div>
          )}
        </div>

        {rect && (
          <p className={longEdge < MIN_RECOMMENDED_EDGE ? "error" : "muted"}>
            裁剪区域 {Math.round(rect.width)}×{Math.round(rect.height)}，保存为{" "}
            {Math.round(rect.width * outScale)}×{Math.round(rect.height * outScale)}
            {longEdge < MIN_RECOMMENDED_EDGE && "（长边小于 1200px，Google 图片可能不优先展示）"}
          </p>
        )}

        <div className="queue-item-actions">
          <button type="button" className="btn btn-primary" disabled={!rect} onClick={apply}>
            确定裁剪
          </button>
          {natural && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAspect(null);
                setRect(centeredRect(natural.w, natural.h, null));
              }}
            >
              还原整张
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
