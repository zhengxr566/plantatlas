import { plants } from "@/data/plants";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";

export default async function PlantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const plant = plants.find((p) => p.slug === slug);
  if (!plant) return notFound();

  const sameFamilyPlants = plants.filter(
    (p) => p.familySlug === plant.familySlug && p.slug !== plant.slug
  );

  const sameGenusPlants = plants.filter(
    (p) => p.genusSlug === plant.genusSlug && p.slug !== plant.slug
  );

  const comparePlants = plants.filter(
    (p) => plant.similar?.includes(p.nameCn)
  );

  return (
    <AtlasLayout>
      {/* 面包屑 */}
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span>›</span>
        <span>{plant.division}</span>
        <span>›</span>
        <span>{plant.className}</span>
        <span>›</span>
        <span>{plant.order}</span>
        <span>›</span>
        <Link href={`/family/${plant.familySlug}`}>{plant.family}</Link>
        <span>›</span>
        <Link href={`/genus/${plant.genusSlug}`}>{plant.genus}</Link>
      </nav>

      {/* 标题 */}
      <h1>{plant.nameCn}</h1>
      <p className="latin">{plant.nameLatin}</p>

      {/* 简介 */}
      <p>{plant.description}</p>

      {/* 基础信息（并排🔥） */}
      <h2>基础信息</h2>
      <div className="info-inline">
        <div className="info-item">
          <span className="info-label">科：</span>
          <Link href={`/family/${plant.familySlug}`} className="link">
            {plant.family}
          </Link>
        </div>

        <div className="info-item">
          <span className="info-label">属：</span>
          <Link href={`/genus/${plant.genusSlug}`} className="link">
            {plant.genus}
          </Link>
        </div>

        <div className="info-item">
          <span className="info-label">目：</span>
          {plant.order}
        </div>

        <div className="info-item">
          <span className="info-label">纲：</span>
          {plant.className}
        </div>

        <div className="info-item">
          <span className="info-label">类群：</span>
          {plant.division}
        </div>

        {plant.habit && (
          <div className="info-item">
            <span className="info-label">类型：</span>
            {plant.habit}
          </div>
        )}
      </div>

      {/* 谱系（横向🔥） */}
      <h2>谱系位置</h2>
      <div className="lineage-horizontal">
        <span className="lineage-node">{plant.kingdom}</span>
        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{plant.division}</span>
        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{plant.className}</span>
        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{plant.order}</span>
        <span className="lineage-arrow">›</span>

        <Link
          href={`/family/${plant.familySlug}`}
          className="lineage-node link"
        >
          {plant.family}
        </Link>

        <span className="lineage-arrow">›</span>

        <Link
          href={`/genus/${plant.genusSlug}`}
          className="lineage-node link"
        >
          {plant.genus}
        </Link>

        <span className="lineage-arrow">›</span>

        <span className="lineage-node">{plant.nameCn}</span>
      </div>

      {/* 近缘 */}
      <h2>近缘植物</h2>
      <p>{plant.relatives?.join("、") || "暂无数据"}</p>

      {/* 同科 */}
      <h2>同科植物</h2>
      {sameFamilyPlants.length > 0 ? (
        <ul>
          {sameFamilyPlants.map((p) => (
            <li key={p.slug}>
              <Link href={`/plant/${p.slug}`} className="link">
                {p.nameCn}
              </Link>
              <span className="meta"> · {p.nameLatin}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无同科植物数据。</p>
      )}

      {/* 同属 */}
      <h2>同属植物</h2>
      {sameGenusPlants.length > 0 ? (
        <ul>
          {sameGenusPlants.map((p) => (
            <li key={p.slug}>
              <Link href={`/plant/${p.slug}`} className="link">
                {p.nameCn}
              </Link>
              <span className="meta"> · {p.nameLatin}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无同属植物数据。</p>
      )}

      {/* 对比 */}
      <h2>常见对比</h2>
      {comparePlants.length > 0 ? (
        <ul>
          {comparePlants.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/compare/${plant.slug}-vs-${p.slug}`}
                className="link"
              >
                {plant.nameCn}和{p.nameCn}的区别
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无常见对比。</p>
      )}
    </AtlasLayout>
  );
}

/* SEO */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plant = plants.find((p) => p.slug === slug);

  if (!plant) return {};

  return {
    title: `${plant.nameCn}（${plant.nameLatin}）｜谱系位置与分类信息`,
    description: `${plant.nameCn}属于${plant.family}${plant.genus}，查看其谱系位置、近缘植物及分类信息。`,
  };
}