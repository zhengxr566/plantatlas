# Plant Atlas World（plantatlasworld.com）

植物谱系 + 实拍图鉴网站。植物资料来自 `data/plants.csv`，实拍图片来自 `public/photos/`，
图片标签会自动生成「植物对比」「部位对比」「部位图片」等 SEO 页面。

```bash
npm run dev      # 本地预览 http://localhost:3000
npm run photos   # 同步新图片到 data/photos.csv，检查标签和 compare.csv
npm run build
```

## 添加图片的流程

1. **放图片**：按植物 slug（与 `plants.csv` 的 `slug` 列一致）建文件夹，文件名以部位开头：

   ```
   public/photos/ginkgo-biloba/leaf-01.jpg
   public/photos/ginkgo-biloba/leaf-autumn.jpg
   public/photos/ginkgo-biloba/bark-01.jpg
   public/photos/liriodendron-chinense/leaf-01.jpg
   ```

   可用部位（见 `data/parts.ts`）：`leaf` 叶片、`flower` 花、`fruit` 果实、`cone` 球果、`seed` 种子、
   `bark` 树皮、`branch` 枝条、`bud` 芽、`habit` 树形、`autumn` 秋色。

   建议导出为长边 1600–2000px、1.5MB 以内的 JPG/WebP。文件名只用英文、数字和 `-`。

2. **同步**：运行 `npm run photos`。新图片会自动追加到 `data/photos.csv`，并填好 `plant`、`part`、`width`、`height`。

3. **打标签**：在 `data/photos.csv` 中填写：

   | 列 | 说明 | 示例 |
   | --- | --- | --- |
   | `tags` | 这张图能看到的识别特征，`\|` 分隔，从 `tags.md` 里选 | `扇形叶\|放射状叶脉\|单叶` |
   | `caption` | 图片说明，会用作 alt 文本（对 Google 图片最重要） | `银杏短枝上簇生的扇形叶` |
   | `season` / `location` / `date` | 拍摄季节、地点、日期（可选） | `秋季` / `北京` / `2026-10-12` |
   | `author` / `license` | 留空默认 `Plant Atlas World` / 保留所有权利 | |

   再运行一次 `npm run photos`，它会提示没有标签或不在 `tags.md` 里的标签。新标签请先加进 `tags.md`，
   **同一个特征只用一种写法**，否则两张图不会被识别为相似。

4. **提交并部署**。页面会自动生成，不需要改代码。

## 手写对比要点（data/compare.csv）

模板生成的文字对搜索引擎价值有限，**给重点对比写几句真正有用的区别**是提升排名最有效的方式。

```csv
plantA,plantB,keyPoints,intro
ginkgo-biloba,liriodendron-chinense,看叶尖：银杏叶顶端波状或有缺刻，鹅掌楸叶顶端平截|看叶脉：银杏为二叉分枝的放射状脉，鹅掌楸为羽状网脉,
```

- `plantA` / `plantB`：plants.csv 中的 slug，页面 URL 为 `/compare/plantA-vs-plantB`（已有的对比沿用原 URL）
- `keyPoints`：核心区别，`|` 分隔，显示在对比页顶部的「核心区别」框中
- `intro`：可选，替换模板生成的开头段落
- 这里写的对比即使不在 `similar` 列中也会生成页面

## 收录规则（noindex）

对比页满足以下任一条件才会被收录、并出现在 sitemap 中：

1. 两种植物在同一部位都有实拍图（会显示逐部位照片对比）
2. 在 compare.csv 中写了 `keyPoints` 或 `intro`

其他对比页仍可访问、内部链接仍可跟踪，但带有 `noindex`，等补充内容后会自动变为可收录。

## 页面是怎么自动生成的

| 页面 | 生成条件 | 目标搜索词 |
| --- | --- | --- |
| `/plant/[slug]` | plants.csv 每一行；有实拍图时用实拍图做首图并显示图库 | 银杏 |
| `/plant/[slug]/[part]` | 这种植物有该部位的图片 | 银杏叶子图片 |
| `/compare/[a]-vs-[b]` | ① plants.csv 的 `similar` 列；② **同一部位的图片共享 ≥2 个标签**（每种植物最多自动 8 组，按相似度排序） | 银杏和鹅掌楸的区别 |
| `/compare/[a]-vs-[b]/[part]` | 两种植物都有该部位的图片 | 银杏叶和鹅掌楸叶的区别 |

规则在 `lib/generateComparePairs.ts` 顶部可以调整：`MIN_SHARED_PHOTO_TAGS`、`MAX_AUTO_PAIRS_PER_PLANT`。

对比页中会按部位并排展示两种植物的照片，并列出「共同特征 / 各自独有特征」——这些都来自图片标签。
所以标签打得越细（例如叶片打上 `掌状叶`、`叶缘锯齿`、`三裂`），对比文字就越具体。

## SEO 与 Google 图片

- 所有图片用 `next/image` 输出 AVIF/WebP，并带有由「植物名 + 部位 + caption」组成的 alt。
- 每个页面输出 `ImageObject` 结构化数据（作者、版权、授权页），可在 Google 图片中显示「可授权」标记。
- `sitemap.xml` 包含图片站点地图（`<image:image>`），新图片部署后会自动出现在其中。
- 反向对比 URL（`b-vs-a`）会 308 永久跳转到规范 URL，避免重复内容。

## 广告（Google AdSense）

在 Vercel 项目的环境变量（或本地 `.env.local`）中设置：

```
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT=1234567890
```

- 设置 `CLIENT` 后：自动加载 AdSense 脚本、输出 `google-adsense-account` 验证标签，并生成 `/ads.txt`。
- 设置 `SLOT` 后：对比页、部位页、植物图库下方会显示展示广告位。只设置 `CLIENT` 时可以在 AdSense 后台开启「自动广告」。
- 申请前确认 `/privacy`（隐私政策与图片版权）页面可访问；建议先积累一定数量带原创图片的页面再申请。
