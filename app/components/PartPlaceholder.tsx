import { getPart, plantPart } from "@/data/parts";

// 还没有实拍图时显示的占位卡片。用内联 SVG 绘制，不会被当成图片收录。
const ICONS: Record<string, React.ReactNode> = {
  leaf: (
    <>
      <path d="M32 54C14 44 12 22 32 8c20 14 18 36 0 46z" />
      <path d="M32 54V14M32 26l-8-6M32 34l9-7M32 42l-9-6" />
    </>
  ),
  autumn: (
    <>
      <path d="M32 54C14 44 12 22 32 8c20 14 18 36 0 46z" />
      <path d="M32 54V14M32 26l-8-6M32 34l9-7M32 42l-9-6" />
    </>
  ),
  flower: (
    <>
      <circle cx="32" cy="18" r="8" />
      <circle cx="45" cy="28" r="8" />
      <circle cx="40" cy="43" r="8" />
      <circle cx="24" cy="43" r="8" />
      <circle cx="19" cy="28" r="8" />
      <circle cx="32" cy="32" r="4" />
    </>
  ),
  fruit: (
    <>
      <circle cx="32" cy="36" r="16" />
      <path d="M32 20c0-6 2-10 6-12M32 20c-6-6-14-4-16 0 6 4 12 4 16 0z" />
    </>
  ),
  cone: (
    <>
      <ellipse cx="32" cy="34" rx="13" ry="20" />
      <path d="M20 26h24M19 34h26M20 42h24M32 14v40" />
    </>
  ),
  seed: (
    <>
      <ellipse cx="32" cy="34" rx="10" ry="15" />
      <path d="M32 19v30" />
    </>
  ),
  bark: (
    <>
      <rect x="14" y="8" width="36" height="48" rx="4" />
      <path d="M22 12c4 8-4 14 0 22s-2 14 2 18M32 10c-3 10 3 16 0 26s3 12 0 18M42 12c-4 8 3 14 0 22s2 14-2 18" />
    </>
  ),
  branch: (
    <>
      <path d="M10 54L54 10M24 40l-4-16M34 30l14 2M44 20l-2-10" />
    </>
  ),
  bud: (
    <>
      <path d="M32 10c10 10 12 24 0 34-12-10-10-24 0-34z" />
      <path d="M32 44v12" />
    </>
  ),
  habit: (
    <>
      <circle cx="32" cy="24" r="16" />
      <path d="M32 40v16M24 56h16M32 46l-6-6M32 44l6-6" />
    </>
  ),
};

export default function PartPlaceholder({
  partSlug,
  plantName,
}: {
  partSlug: string;
  plantName: string;
}) {
  const part = getPart(partSlug);

  return (
    <div className={`photo-placeholder photo-placeholder-${partSlug}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {ICONS[partSlug] ?? ICONS.habit}
      </svg>
      <span className="photo-placeholder-title">
        {part ? plantPart(plantName, part.noun) : plantName}
      </span>
      <span className="photo-placeholder-note">实拍图整理中</span>
    </div>
  );
}
