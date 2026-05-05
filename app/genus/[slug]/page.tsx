import { plants } from "@/data/plants";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";

export default async function GenusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = plants.filter((p) => p.genusSlug === slug);

  if (list.length === 0) notFound();

  const first = list[0];

  return (
    <AtlasLayout>
      <nav className="breadcrumb">
        <Link href="/">首页</Link>
        <span>›</span>
        <span>{first.division}</span>
        <span>›</span>
        <span>{first.className}</span>
        <span>›</span>
        <span>{first.order}</span>
        <span>›</span>
        <Link href={`/family/${first.familySlug}`}>{first.family}</Link>
        <span>›</span>
        <span>{first.genus}</span>
      </nav>

      <h1>{first.genus}</h1>
      <p className="meta">
        本页面展示属于 {first.genus} 的常见木本植物。
      </p>

      <h2>所属植物</h2>
      <ul>
        {list.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta"> · {plant.nameLatin}</span>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}