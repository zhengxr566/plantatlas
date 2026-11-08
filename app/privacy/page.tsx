import type { Metadata } from "next";
import AtlasLayout from "@/app/components/AtlasLayout";

export const metadata: Metadata = {
  title: "隐私政策与图片版权｜Plant Atlas World",
  description: "Plant Atlas World 的隐私政策、Cookie 与广告说明以及图片版权声明。",
  alternates: { canonical: "https://plantatlasworld.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <AtlasLayout>
      <h1>隐私政策与图片版权</h1>

      <h2>收集的信息</h2>
      <p>
        Plant Atlas World（plantatlasworld.com）不要求注册，也不会主动收集姓名、邮箱等个人信息。
        服务器和统计工具可能会记录访问时间、页面地址、浏览器类型等匿名访问数据，用于改进网站内容。
      </p>

      <h2>标签建议</h2>
      <p>
        访客可以为图片建议补充或纠正识别标签，无需注册。我们会保存所选标签、可选的补充说明和提交时间，
        并保存经过单向哈希处理的 IP 地址（无法还原为原始 IP），仅用于限制频繁提交。
        建议经人工审核后才会显示在网站上，审核完成后即删除；请不要在补充说明中填写个人信息。
      </p>

      <h2>访问统计（Google Analytics）</h2>
      <p>
        本网站使用 Google Analytics 4 了解访问情况，例如浏览了哪些页面、站内搜索了哪些词、
        是否使用了谱系地图等。Google Analytics 会使用 Cookie 收集匿名的统计数据，
        不会收集姓名、邮箱等可以直接识别个人的信息。数据由 Google 处理，详见
        <a
          href="https://policies.google.com/technologies/partner-sites"
          className="link"
          rel="noopener"
        >
          Google 合作伙伴网站数据使用说明
        </a>
        。如果不希望被统计，可以安装
        <a href="https://tools.google.com/dlpage/gaoptout" className="link" rel="noopener">
          Google Analytics 停用浏览器插件
        </a>
        ，或在浏览器中禁用 Cookie。
      </p>

      <h2>Cookie 与广告</h2>
      <p>
        本网站使用 Google AdSense 展示广告。Google 及其合作伙伴可能使用 Cookie，
        根据您访问本网站和其他网站的记录投放广告。您可以在
        <a href="https://adssettings.google.com" className="link" rel="noopener">
          Google 广告设置
        </a>
        中关闭个性化广告，或访问
        <a href="https://www.aboutads.info" className="link" rel="noopener">
          aboutads.info
        </a>
        了解如何停用第三方 Cookie。关于 Google 如何使用数据，请参阅
        <a
          href="https://policies.google.com/technologies/partner-sites"
          className="link"
          rel="noopener"
        >
          Google 合作伙伴网站数据使用说明
        </a>
        。
      </p>

      <h2 id="image-license">图片版权</h2>
      <p>
        除特别注明外，本站植物照片均为 Plant Atlas World 实拍，版权归作者所有。
        个人学习和非商业用途可以引用，但需注明出处并链接到对应页面；
        商业使用或转载请先联系我们获得授权。
        部分页面在暂无实拍图时会显示来自维基百科的图片，其版权归原作者，并遵循原始授权协议。
      </p>

      <h2>政策更新</h2>
      <p>本政策可能会随网站功能调整而更新，更新后将在本页面发布。</p>
    </AtlasLayout>
  );
}
