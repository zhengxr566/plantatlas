import Image from "next/image";
import Link from "next/link";
import { buildPhotoAlt, type PlantPhoto } from "@/lib/loadPhotos";

type PlantName = { slug: string; nameCn: string; nameLatin?: string };

export default function PhotoFigure({
  photo,
  plant,
  preload = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  showTags = true,
}: {
  photo: PlantPhoto;
  plant: PlantName;
  preload?: boolean;
  sizes?: string;
  showTags?: boolean;
}) {
  const alt = buildPhotoAlt(photo, plant);

  return (
    <figure className="photo-figure" id={photo.id}>
      <a href={photo.src} target="_blank" rel="noopener">
        <Image
          src={photo.src}
          alt={alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          preload={preload}
        />
      </a>
      <figcaption>
        <span className="photo-caption">{alt}</span>
        {showTags && photo.tags.length > 0 && (
          <span className="photo-tags">
            {photo.tags.map((tag) => (
              <span key={tag} className="photo-tag">
                {tag}
              </span>
            ))}
          </span>
        )}
        <span className="photo-credit">
          {[photo.season, photo.location, photo.date]
            .filter(Boolean)
            .join(" · ")}
          {(photo.season || photo.location || photo.date) && " · "}©{" "}
          {photo.author}
          {" · "}
          <Link href={`/plant/${plant.slug}/${photo.part}`} className="link">
            更多图片
          </Link>
        </span>
      </figcaption>
    </figure>
  );
}
