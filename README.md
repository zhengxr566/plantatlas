# Plant Atlas World（plantatlasworld.com）

植物谱系 + 实拍图鉴网站。植物资料来自 `data/plants.csv`，实拍图片来自 `public/photos/`，
图片标签会自动生成「植物对比」「部位对比」「部位图片」等 SEO 页面。

```bash
npm run dev      # 本地预览 http://localhost:3000，图片管理后台 http://localhost:3000/admin
npm run photos   # （手动方式）同步新图片到 data/photos.csv，检查标签和 compare.csv
npm run build
```

## 图片管理后台（推荐）

**双击项目根目录的 `open-admin.cmd`**（Windows）即可：它会在后台启动本地服务（最小化的 “Plant Atlas dev server” 窗口），
并用浏览器打开 **http://localhost:3000/admin**；服务已在运行时直接打开页面。关闭那个窗口即停止服务。
想放在桌面：右键 `open-admin.cmd` →“发送到”→“桌面快捷方式”。

也可以手动运行 `npm run dev` 后打开上面的地址。后台只在本地开发模式下可用，线上访问是 404。

| 页签 | 用途 |
| --- | --- |
| 上传图片 | 拖入图片 → 选植物、部位 → 点选标签、写图片说明 → 上传。可设置默认植物/部位/季节/地点，批量拍摄时只需改标签。“标签应用到其他待上传图片”可一键复制标签 |
| 图片库 | 按植物、部位筛选；“只看待完善”列出标签不足 2 个或没有说明的图片；可修改、换植物、删除 |
| 拍摄进度 | 植物 × 部位的图片数量表，一眼看出还缺什么；点格子直接跳到上传并预填 |
| 对比要点 | 所有对比页及收录状态（可收录 / noindex）；编辑手写“核心区别”，也可新建对比 |
| 植物资料 | 搜索、编辑 `plants.csv` 中每种植物的全部字段；新增植物（根据学名自动生成网址标识，选择已有的属/科自动填写上级分类）；“复制为新植物”方便添加同属植物；删除没有图片的植物 |
| 标签管理 | 每个标签被多少图片和植物使用；改名、合并（例如把“秋黄”合并到“秋天变黄”）、删除，会同时更新 `tags.md`、所有图片和植物；把数据中出现但不在词表里的标签加入词表 |
| 发布到网站 | 只提交图片、`plants.csv`、`photos.csv`、`compare.csv`、`tags.md`（不提交代码），推送到 GitHub，Vercel 自动部署 |

上传时会自动：压缩到长边 1600px 的 JPEG（质量 82）、按 EXIF 自动旋转、**去除 GPS 等 EXIF 信息**、
读取拍摄日期、命名为 `<部位>-<序号>.jpg`。在搜索框输入 `tags.md` 里没有的标签并回车，会写入 `tags.md` 的「自定义」分组。

后台改动保存后，本地网站页面立刻更新，可以先在 http://localhost:3000 确认，再点“发布到网站”。

> iPhone 的 HEIC 照片需要先导出为 JPG（或在“设置 › 相机 › 格式”中选择“兼容性最佳”）。

## 访客补充标签（需要 Upstash Redis）

图片部位页（`/plant/[slug]/[part]`）和部位对比页（`/compare/[a]-vs-[b]/[part]`）的每张图下方有“补充 / 纠正标签”。
访客只能从 `tags.md` 中选择标签（也可以在说明里写列表外的特征），提交后进入后台「待审核」页签，
勾选要采纳的改动并接受后写入 `photos.csv`，再点“发布到网站”。

开启方法：

1. Vercel 项目 → Storage（或 Marketplace）→ 添加 **Upstash for Redis**（免费额度足够），连接到本项目。
   环境变量 `KV_REST_API_URL`、`KV_REST_API_TOKEN` 会自动配置，重新部署后功能生效。
2. 本地审核：运行 `npx vercel env pull .env.local`（或手动把这两个变量写入 `.env.local`），重启 `npm run dev`。
3. 可选：设置 `SUGGESTION_SALT`（任意随机字符串），用于对访客 IP 做哈希。

未配置时，按钮不会显示。防滥用措施：只接受词表内的标签、隐藏的防机器人字段、每个 IP 每小时最多 20 次、待审核上限 2000 条。

植物资料的保存规则：网址标识创建后不能修改（避免已被收录的网址失效）；中文名不能重复（相似植物按中文名匹配）；
同一个属/科/目/纲的标识必须对应同一个名称。`plants.csv` 会保持原来的格式（UTF-8 BOM + Windows 换行），仍可用 Excel 打开编辑。

## 还没有图片时

植物页的「各部位图片」始终显示核心部位（被子植物：树形、叶、花、果实、树皮；裸子植物：树形、叶、球果、树皮；银杏：树形、叶、种子、树皮），
没有实拍图的部位显示“实拍图整理中”占位卡片；对比页首图同理。占位卡片是内联 SVG，不会被当作图片收录。
已不再使用维基百科图片。

## 手动添加图片的流程（不用后台时）

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
   | `updated` | 最后添加或修改的日期，后台和 `npm run photos` 会自动填写，用于 sitemap 的更新日期 | `2026-11-08` |

   再运行一次 `npm run photos`，它会提示没有标签或不在 `tags.md` 里的标签。新标签请先加进 `tags.md`，
   **同一个特征只用一种写法**，否则两张图不会被识别为相似。

4. **提交并部署**。页面会自动生成，不需要改代码。

图片放在 Git 仓库中。按每张约 200–400KB 估算，几千张以内没有问题；如果以后达到上万张，建议改用对象存储（如 Cloudflare R2）。

## 手写对比要点（data/compare.csv）

模板生成的文字对搜索引擎价值有限，**给重点对比写几句真正有用的区别**是提升排名最有效的方式。

```csv
plantA,plantB,keyPoints,intro
ginkgo-biloba,liriodendron-chinense,看叶尖：银杏叶顶端波状或有缺刻，鹅掌楸叶顶端平截|看叶脉：银杏为二叉分枝的放射状脉，鹅掌楸为羽状网脉,
```

- `plantA` / `plantB`：plants.csv 中的 slug，页面 URL 为 `/compare/plantA-vs-plantB`（已有的对比沿用原 URL）
- `keyPoints`：核心区别，`|` 分隔，显示在对比页顶部的「核心区别」框中
- `intro`：可选，替换模板生成的开头段落
- `updated`：最后修改日期（后台保存时自动填写）
- 这里写的对比即使不在 `similar` 列中也会生成页面

## 收录规则（noindex）

对比页满足以下任一条件才会被收录、并出现在 sitemap 中：

1. 两种植物在同一部位都有实拍图（会显示逐部位照片对比）
2. 在 compare.csv 中写了 `keyPoints` 或 `intro`

其他对比页仍可访问、内部链接仍可跟踪，但带有 `noindex`，等补充内容后会自动变为可收录。

纲、目、科、属页面同理：只包含 1 种植物时设为 `noindex` 且不进 sitemap（内容和植物页几乎重复），收录到第 2 种植物后自动恢复。阈值见 `lib/taxonomy.ts` 的 `MIN_PLANTS_TO_INDEX`。

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
