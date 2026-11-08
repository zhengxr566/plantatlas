import Link from "next/link";
import PhotoFigure from "@/app/components/PhotoFigure";
import { getPart } from "@/data/parts";
import { getPartTags, type PlantPhoto } from "@/lib/loadPhotos";

type PlantName = { slug: string; nameCn: string; nameLatin?: string };

function joinCn(items: string[], fallback = "暂无") {
  return items.length > 0 ? items.join("、") : fallback;
}

export function describePartDifference(
  partSlug: string,
  plantA: PlantName,
  photosA: PlantPhoto[],
  plantB: PlantName,
  photosB: PlantPhoto[]
) {
  const part = getPart(partSlug);
  if (!part) return { shared: [], onlyA: [], onlyB: [], text: "" };

  const tagsA = getPartTags(photosA, partSlug);
  const tagsB = getPartTags(photosB, partSlug);
  const shared = tagsA.filter((t) => tagsB.includes(t));
  const onlyA = tagsA.filter((t) => !tagsB.includes(t));
  const onlyB = tagsB.filter((t) => !tagsA.includes(t));

  const sentences = [
    shared.length > 0
      ? `从实拍照片看，${plantA.nameCn}和${plantB.nameCn}的${part.noun}都具有${joinCn(shared)}的特征，这是两者容易被混淆的原因。`
      : `从实拍照片看，${plantA.nameCn}和${plantB.nameCn}的${part.noun}没有明显的共同标签，单看${part.nameCn}通常就能区分。`,
    onlyA.length > 0 || onlyB.length > 0
      ? `区别在于：${plantA.nameCn}的${part.noun}表现为${joinCn(onlyA, "无额外特征")}，而${plantB.nameCn}的${part.noun}表现为${joinCn(onlyB, "无额外特征")}。`
      : "",
    `观察${part.nameCn}时，建议重点比较${part.lookFor}。`,
  ];

  return { shared, onlyA, onlyB, text: sentences.filter(Boolean).join("") };
}

export default function PartCompare({
  partSlug,
  plantA,
  photosA,
  plantB,
  photosB,
  pairSlug,
  maxPhotos = 2,
  headingLevel = "h3",
  preload = false,
  suggestable = false,
}: {
  partSlug: string;
  plantA: PlantName;
  photosA: PlantPhoto[];
  plantB: PlantName;
  photosB: PlantPhoto[];
  pairSlug: string;
  maxPhotos?: number;
  headingLevel?: "h2" | "h3";
  preload?: boolean;
  suggestable?: boolean;
}) {
  const part = getPart(partSlug);
  if (!part) return null;

  const listA = photosA.filter((p) => p.part === partSlug);
  const listB = photosB.filter((p) => p.part === partSlug);
  const { shared, onlyA, onlyB, text } = describePartDifference(
    partSlug,
    plantA,
    listA,
    plantB,
    listB
  );
  const Heading = headingLevel;

  return (
    <section className="part-compare">
      <Heading>
        {plantA.nameCn}
        {part.noun} vs {plantB.nameCn}
        {part.noun}
      </Heading>

      <div className="part-compare-grid">
        {[
          { plant: plantA, list: listA },
          { plant: plantB, list: listB },
        ].map(({ plant, list }) => (
          <div key={plant.slug} className="part-compare-col">
            <div className="part-compare-label">
              <Link href={`/plant/${plant.slug}`} className="link">
                {plant.nameCn}
              </Link>
              的{part.noun}
            </div>
            {list.slice(0, maxPhotos).map((photo, i) => (
              <PhotoFigure
                key={photo.id}
                photo={photo}
                plant={plant}
                preload={preload && i === 0}
                sizes="(max-width: 768px) 100vw, 40vw"
                suggestable={suggestable}
              />
            ))}
          </div>
        ))}
      </div>

      <p>{text}</p>

      <ul className="tag-diff">
        <li>
          <strong>共同特征：</strong>
          {joinCn(shared)}
        </li>
        <li>
          <strong>{plantA.nameCn}独有：</strong>
          {joinCn(onlyA)}
        </li>
        <li>
          <strong>{plantB.nameCn}独有：</strong>
          {joinCn(onlyB)}
        </li>
      </ul>

      {headingLevel === "h3" && (
        <p>
          <Link href={`/compare/${pairSlug}/${partSlug}`} className="link">
            查看{plantA.nameCn}和{plantB.nameCn}
            {part.noun}的区别（更多对比图）›
          </Link>
        </p>
      )}
    </section>
  );
}
