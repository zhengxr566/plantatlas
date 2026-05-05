import { plants } from "@/data/plants";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtlasLayout from "@/app/components/AtlasLayout";

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = plants.filter((p) => p.familySlug === slug);

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
        <span>{first.family}</span>
      </nav>

      <h1>{first.family}</h1>
      <p className="meta">
        本页面展示属于 {first.family} 的常见木本植物。
      </p>

      <h2>所属植物</h2>
      <ul>
        {list.map((plant) => (
          <li key={plant.slug}>
            <Link href={`/plant/${plant.slug}`} className="link">
              {plant.nameCn}
            </Link>
            <span className="meta"> · {plant.nameLatin} · {plant.genus}</span>
          </li>
        ))}
      </ul>
    </AtlasLayout>
  );
}