// “关于本站”页面（/about）中需要你本人填写的内容。
// 把每个【…】整段替换成你的内容（不要保留【】）。
// 只要还有【…】，页面就不会被搜索引擎收录，也不会出现在页脚和 sitemap 中。
export const about = {
  // 署名：真名或固定使用的笔名都可以，Google 看重的是“有一个持续负责内容的人”
  authorName: "Ray",
  // 照片主要在哪里拍摄
  location: "日本东京的公园、街道和日常生活中",
  // 从哪一年开始拍植物
  startedYear: "2026",
  // 一两句个人背景：为什么懂植物、怎么观察
  background:
    "植物爱好者，平时利用业余时间拍摄生活中遇到的植物。",
  // 做这个网站的原因
  why: "希望建立一个目前还没有的开放植物图片数据库：每张照片都按部位和识别特征打上体系化的标签，并放进植物谱系中，方便查找和比较相近的植物。",
  // 鉴定和描述参考了哪些资料
  references:
    "维基百科和植物图鉴类书籍",
  // 联系方式：建议用专门的邮箱，不要用工作邮箱
  contact: "calmyhealth@hotmail.com",
};

// 只需要联系方式时（例如图片授权页）
export function isContactReady() {
  return !about.contact.includes("【");
}

export function isAboutReady() {
  return !Object.values(about).some((value) => value.includes("【"));
}
