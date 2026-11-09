// 写进图片文件的版权信息（EXIF + XMP/IPTC）。
// 网站图片会去掉相机 EXIF（包括 GPS 位置），只写入作者、版权和授权页地址：
// 图片被转存后仍能看出来源，Google 图片也会据此显示“可授权”标记。
// 不使用 @/ 路径，scripts/sync-photos.mjs 也会直接导入这个文件。
import type { Sharp } from "sharp";

export const IMAGE_LICENSE_URL = "https://plantatlasworld.com/image-license";
export const DEFAULT_PHOTO_AUTHOR = "Plant Atlas World";

type RightsInput = { author?: string; date?: string };

function year(date?: string) {
  const match = (date ?? "").match(/^\d{4}/);
  return match ? match[0] : String(new Date().getFullYear());
}

export function photoAuthor(author?: string) {
  return (author ?? "").trim() || DEFAULT_PHOTO_AUTHOR;
}

export function copyrightNotice({ author, date }: RightsInput) {
  return `© ${year(date)} ${photoAuthor(author)}. All rights reserved.`;
}

function escapeXml(text: string) {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// IPTC Photo Metadata（Google 图片读取的字段：Creator、Copyright Notice、Credit Line、
// Web Statement of Rights、Licensor URL）
function rightsXmp(input: RightsInput) {
  const author = escapeXml(photoAuthor(input.author));
  const notice = escapeXml(copyrightNotice(input));
  return [
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description rdf:about=""',
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"',
    ' xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"',
    ' xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"',
    ' xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/">',
    `<dc:creator><rdf:Seq><rdf:li>${author}</rdf:li></rdf:Seq></dc:creator>`,
    `<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${notice}</rdf:li></rdf:Alt></dc:rights>`,
    `<photoshop:Credit>${author}</photoshop:Credit>`,
    "<xmpRights:Marked>True</xmpRights:Marked>",
    `<xmpRights:WebStatement>${IMAGE_LICENSE_URL}</xmpRights:WebStatement>`,
    `<plus:Licensor><rdf:Seq><rdf:li rdf:parseType="Resource"><plus:LicensorURL>${IMAGE_LICENSE_URL}</plus:LicensorURL></rdf:li></rdf:Seq></plus:Licensor>`,
    "</rdf:Description>",
    "</rdf:RDF>",
    "</x:xmpmeta>",
  ].join("");
}

// EXIF 只能写 ASCII：中文署名时 EXIF 用站名，XMP 里保留原署名
function asciiOr(text: string, fallback: string) {
  return /^[\x20-\x7e]+$/.test(text) ? text : fallback;
}

// 在 sharp 输出前调用：只写入版权字段，不复制原图的 EXIF（不含 GPS）
export function withRights(image: Sharp, input: RightsInput) {
  const author = asciiOr(photoAuthor(input.author), DEFAULT_PHOTO_AUTHOR);
  return image
    .withExif({
      IFD0: {
        Artist: author,
        Copyright: `(c) ${year(input.date)} ${author}. All rights reserved. ${IMAGE_LICENSE_URL}`,
      },
    })
    .withXmp(rightsXmp(input));
}

// 已写入版权信息的图片（用于跳过重复处理）
export function hasRights(xmp?: Buffer) {
  return Boolean(xmp && xmp.toString("utf8").includes(IMAGE_LICENSE_URL));
}
