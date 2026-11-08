import Image from "next/image";
import Link from "next/link";
import { buildPhotoAlt, type PlantPhoto } from "@/lib/loadPhotos";

// 带实拍图的卡片；没有图片时显示名称首字作为占位
export default function PhotoCard({
  href,
  title,
  subtitle,
  photo,
  plant,
  badge,
  sizes = "(max-width: 640px) 50vw, 240px",
  preload = false,
}: {
  href: string;
  title: string;
  subtitle?: string;
  photo?: PlantPhoto;
  // 图片所属植物，用于生成 alt 文本
  plant?: { nameCn: string; nameLatin?: string };
  badge?: string;
  sizes?: string;
  preload?: boolean;
}) {
  return (
    <Link href={href} className={photo ? "photo-card" : "photo-card photo-card-empty"}>
      <span className="photo-card-media">
        {photo && plant ? (
          <Image
            src={photo.src}
            alt={buildPhotoAlt(photo, plant)}
            width={photo.width}
            height={photo.height}
            sizes={sizes}
            preload={preload}
          />
        ) : (
          <span className="photo-card-initial" aria-hidden="true">
            {title.slice(0, 1)}
          </span>
        )}
        {badge && <span className="photo-card-badge">{badge}</span>}
      </span>
      <span className="photo-card-body">
        <strong>{title}</strong>
        {subtitle && <span className="photo-card-sub">{subtitle}</span>}
      </span>
    </Link>
  );
}
