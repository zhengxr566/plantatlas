import type { Metadata } from "next";
import Link from "next/link";
import AtlasLayout from "@/app/components/AtlasLayout";
import Breadcrumb from "@/app/components/Breadcrumb";
import JsonLd from "@/app/components/JsonLd";
import { about, isContactReady } from "@/data/about";
import { DEFAULT_PHOTO_AUTHOR, IMAGE_LICENSE_URL } from "@/lib/imageRights";
import { loadPhotos } from "@/lib/loadPhotos";
import { SITE_NAME } from "@/lib/structuredData";

const title = "图片授权｜Plant Atlas World 植物实拍图片使用说明";
const description =
  "Plant Atlas World 植物实拍图片的版权说明、免费引用规则和商业授权方式，可提供原始分辨率图片和指定物种、部位的拍摄。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: IMAGE_LICENSE_URL },
};

export default function ImageLicensePage() {
  const photos = loadPhotos();
  const plantCount = new Set(photos.map((p) => p.plant)).size;
  const contactReady = isContactReady();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: IMAGE_LICENSE_URL,
    isPartOf: { "@type": "WebSite", name: SITE_NAME },
  };

  return (
    <AtlasLayout>
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "首页", href: "/" }, { name: "图片授权" }]} />

      <h1>图片授权</h1>
      <p>
        本站的植物照片均为实地拍摄，按叶片、花、果实、树皮、树形等部位整理，并标注了中文名、学名和识别特征。
        目前共有 {photos.length} 张实拍图，覆盖 {plantCount} 种植物，并在持续增加。
      </p>

      <h2>版权归属</h2>
      <p>
        除特别注明外，本站照片的版权归 {DEFAULT_PHOTO_AUTHOR} 所有，保留所有权利。
        每张图片文件中都写有作者、版权声明和本页地址（EXIF / IPTC 信息），转存后仍可查到来源。
      </p>

      <h2>可以免费使用的情况</h2>
      <p>以下非商业用途可以直接使用网站上的图片，无需另行申请：</p>
      <ul>
        <li>个人学习、自然观察笔记</li>
        <li>学校课堂和非营利的科普活动</li>
        <li>非商业的个人博客、社交媒体分享</li>
      </ul>
      <p>使用时请遵守：</p>
      <ul>
        <li>
          注明出处并链接到图片所在页面，例如：<code>图片：{DEFAULT_PHOTO_AUTHOR}（plantatlasworld.com）</code>
        </li>
        <li>不要去掉或修改图片中的作者和版权信息</li>
        <li>不要将图片单独转售、上传到图库，或作为自己的作品发布</li>
      </ul>

      <h2>需要授权的情况</h2>
      <p>以下用途请先联系我们获得授权：</p>
      <ul>
        <li>商业网站、广告和营销材料</li>
        <li>书籍、杂志、教材等出版物</li>
        <li>App、软件、游戏和商品包装</li>
        <li>用于 AI 或机器学习的数据集（包括训练、评估）</li>
        <li>需要原始分辨率的图片（网站上为长边 1600 像素的压缩版本）</li>
      </ul>
      <p>
        除单张授权外，也可以提供成套的部位对比图片，或按需要拍摄指定物种、部位和季节的照片。
      </p>

      <h2>申请授权</h2>
      {contactReady ? (
        <p>
          请发送邮件至 <strong>{about.contact}</strong>，并说明：
        </p>
      ) : (
        <p>授权联系方式正在整理中，公布后会更新在本页。申请时请准备以下信息：</p>
      )}
      <ol>
        <li>图片所在页面的链接（可以有多张）</li>
        <li>用途，以及发布的媒介和范围（网站、印刷数量、地区等）</li>
        <li>使用期限，是否需要原始分辨率图片</li>
      </ol>

      {!contactReady && process.env.NODE_ENV !== "production" && (
        <p className="about-draft-note">
          草稿提示：在 <code>data/about.ts</code> 中填写 <code>contact</code>（联系邮箱）后，本页会显示联系方式。
        </p>
      )}

      <p className="meta">
        隐私和 Cookie 相关说明见
        <Link href="/privacy" className="link">
          隐私政策
        </Link>
        。
      </p>
    </AtlasLayout>
  );
}
