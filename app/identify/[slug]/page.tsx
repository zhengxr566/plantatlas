import { plants } from "@/data/plants";
import { identifyPages } from "@/data/identify";
import { notFound } from "next/navigation";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";

export default async function IdentifyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = identifyPages.find((p) => p.slug === slug);
  if (!page) return notFound();

  const matchedPlants = plants.filter(page.match);

  return (
    <AtlasLayout>
      <h1>{page.title}</h1>
      <p>{page.description}</p>

      <h2>常见植物</h2>

      {matchedPlants.length > 0 ? (
        <ul>
          {matchedPlants.map((plant) => (
            <li key={plant.slug}>
              <Link href={`/plant/${plant.slug}`} className="link">
                {plant.nameCn}
              </Link>
              <span className="meta"> · {plant.nameLatin}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">暂无匹配植物数据。</p>
      )}
    </AtlasLayout>
  );
}

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const page = identifyPages.find((p) => p.slug === slug);

  if (!page) return { title: "植物识别" };

  return {
    title: page.title,
    description: page.description,
  };
}