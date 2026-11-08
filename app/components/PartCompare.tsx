import Link from "next/link";
import PartPlaceholder from "@/app/components/PartPlaceholder";
import PhotoFigure from "@/app/components/PhotoFigure";
import TrackLink from "@/app/components/TrackLink";
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

  const lookFor = `观察${part.nameCn}时，建议重点比较${part.lookFor}。`;

  // 只有一方或双方都没有照片：不做标签对比，避免误导
  if (photosA.length === 0 || photosB.length === 0) {
    const has = photosA.length > 0 ? plantA : photosB.length > 0 ? plantB : null;
    const missing = has === plantA ? plantB : plantA;
    const text = has
      ? `目前只有${has.nameCn}的${part.noun}实拍图，${missing.nameCn}的${part.noun}照片还在整理中。${lookFor}`
      : `${plantA.nameCn}和${plantB.nameCn}的${part.noun}实拍图还在整理中。${lookFor}`;
    return { shared: [], onlyA: [], onlyB: [], text };
  }

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
    lookFor,
  ];

  return { shared, onlyA, onlyB, text: sentences.filter(Boolean).join("") };
}

// 某一部位的左右对比：每侧第一张大图，其余为小图；没有照片的一侧显示占位卡片
export default function PartCompare({
  partSlug,
  plantA,
  photosA,
  plantB,
  photosB,
  pairSlug,
  maxPhotos = 4,
  excludeIds = [],
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
  // 每侧最多显示几张（超出的在部位对比页查看）
  maxPhotos?: number;
  // 已在页面其他位置展示的图片（如首图），这里不再重复
  excludeIds?: string[];
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
  const bothHavePhotos = listA.length > 0 && listB.length > 0;
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
        ].map(({ plant, list }) => {
          const visible = list.filter((p) => !excludeIds.includes(p.id));
          const [main, ...rest] = visible.slice(0, maxPhotos);
          const hidden = visible.length - Math.min(visible.length, maxPhotos);
          return (
            <div key={plant.slug} className="part-compare-col">
              <div className="part-compare-label">
                <Link href={`/plant/${plant.slug}`} className="link">
                  {plant.nameCn}
                </Link>
                的{part.noun}
                {list.length > 1 && <span className="meta">（{list.length} 张）</span>}
              </div>

              {main ? (
                <PhotoFigure
                  photo={main}
                  plant={plant}
                  preload={preload}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  suggestable={suggestable}
                />
              ) : list.length > 0 ? (
                <p className="meta">见上方首图</p>
              ) : (
                <PartPlaceholder partSlug={part.slug} plantName={plant.nameCn} />
              )}

              {rest.length > 0 && (
                <div className="part-compare-more">
                  {rest.map((photo) => (
                    <PhotoFigure
                      key={photo.id}
                      photo={photo}
                      plant={plant}
                      sizes="(max-width: 768px) 50vw, 20vw"
                      showTags={false}
                      suggestable={suggestable}
                    />
                  ))}
                </div>
              )}

              {hidden > 0 && (
                <TrackLink
                  href={
                    bothHavePhotos
                      ? `/compare/${pairSlug}/${partSlug}`
                      : `/plant/${plant.slug}/${partSlug}`
                  }
                  className="link"
                  event="compare_part_click"
                  params={{ pair: pairSlug, part: partSlug, link: "more_photos" }}
                >
                  还有 {hidden} 张 ›
                </TrackLink>
              )}
            </div>
          );
        })}
      </div>

      <p>{text}</p>

      {bothHavePhotos && (
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
      )}

      {headingLevel === "h3" && bothHavePhotos && (
        <p>
          <TrackLink
            href={`/compare/${pairSlug}/${partSlug}`}
            className="link"
            event="compare_part_click"
            params={{ pair: pairSlug, part: partSlug, link: "all_photos" }}
          >
            查看{plantA.nameCn}和{plantB.nameCn}
            {part.noun}的区别（全部对比图）›
          </TrackLink>
        </p>
      )}
    </section>
  );
}
