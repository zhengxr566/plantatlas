import type { Metadata } from "next";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import JsonLd from "@/app/components/JsonLd";
import { about, isAboutReady } from "@/data/about";
import { generateComparePairs } from "@/lib/generateComparePairs";
import { loadPhotos } from "@/lib/loadPhotos";
import { loadPlants } from "@/lib/loadPlants";
import { SITE_NAME, SITE_URL } from "@/lib/structuredData";

const title = "关于本站｜Plant Atlas World";
const description = `Plant Atlas World 是由${isAboutReady() ? about.authorName : "植物爱好者"}维护的实拍植物图鉴，用同一部位并排对比的照片帮助区分容易混淆的植物。`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  // data/about.ts 还有未填写的【…】时不收录
  ...(isAboutReady() ? {} : { robots: { index: false, follow: true } }),
};

export default function AboutPage() {
  const plants = loadPlants();
  const photos = loadPhotos();
  const plantsWithPhotos = new Set(photos.map((p) => p.plant)).size;
  const indexablePairs = generateComparePairs().filter((p) => p.indexable).length;
  const ready = isAboutReady();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: title,
    url: `${SITE_URL}/about`,
    description,
    about: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    ...(ready
      ? {
          author: {
            "@type": "Person",
            name: about.authorName,
            homeLocation: about.location,
          },
        }
      : {}),
  };

  return (
    <AtlasLayout>
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "首页", href: "/" }, { name: "关于本站" }]} />

      {!ready && process.env.NODE_ENV !== "production" && (
        <p className="about-draft-note">
          草稿：请在 <code>data/about.ts</code> 中把所有【…】替换成你的内容。填完之前，本页不会被搜索引擎收录，也不会出现在页脚和
          sitemap 中。
        </p>
      )}

      <h1>关于本站</h1>

      <p>
        Plant Atlas World（植物谱系世界）是一个以实拍照片为主的植物图鉴。
        网站按“纲、目、科、属、种”整理常见树木和观赏植物，并把容易混淆的植物按叶片、花、果实、树皮、树形等部位并排对比，
        帮助你在公园、街道或山里看到一棵树时，能自己判断它是什么。
      </p>

      <h2>谁在维护这个网站</h2>
      <p>
        本站由 <strong>{about.authorName}</strong> 个人维护。{about.background}
      </p>
      <p>
        从 {about.startedYear} 年开始拍摄植物，照片主要来自{about.location}。
      </p>

      <h2>为什么做这个网站</h2>
      <p>{about.why}</p>

      <h2>照片从哪里来</h2>
      <ul>
        <li>
          除特别注明外，网站上的植物照片都是本站实拍，每张照片记录了拍摄季节、地点或日期。
        </li>
        <li>
          同一种植物会尽量拍齐叶片、树皮、树形、花和果实，并在不同季节补拍，所以很多页面会随着时间更新。
        </li>
        <li>
          上传前会去除照片中的 GPS 等位置信息。
        </li>
        <li>
          还没有实拍图的部位会显示“实拍图整理中”，而不是用来源不明的网络图片代替。
        </li>
      </ul>

      <h2>内容是怎么整理的</h2>
      <ul>
        <li>分类采用目前通用的 APG 被子植物分类系统（例如槭属归入无患子科）。</li>
        <li>识别特征来自实地观察，并参考了{about.references}。</li>
        <li>
          每张照片都标注了可以看到的识别特征（如“扇形叶”“纵裂树皮”）。对比页里的“共同特征”和“各自独有的特征”就是根据这些标注整理的，
          重点对比还会附上手写的“核心区别”。
        </li>
        <li>
          如果发现鉴定或描述有误，欢迎联系指正，确认后会尽快修改。
        </li>
      </ul>

      <h2>目前收录</h2>
      <ul>
        <li>{plants.length} 种植物，其中 {plantsWithPhotos} 种已有实拍图</li>
        <li>{photos.length} 张实拍照片</li>
        {indexablePairs > 0 && <li>{indexablePairs} 组带实拍对比或核心区别的植物对比</li>}
      </ul>
      <p>
        可以从<Link href="/lineage" className="link">谱系地图</Link>浏览全部植物，或查看
        <Link href="/compare" className="link">植物对比</Link>。
      </p>

      <h2>联系方式</h2>
      <p>
        纠错、合作或图片授权：{about.contact}
        。图片使用规则见
        <Link href="/image-license" className="link">
          图片授权
        </Link>
        。
      </p>
    </AtlasLayout>
  );
}
