// “关于本站”页面（/about）中需要你本人填写的内容。
// 把每个【…】整段替换成你的内容（不要保留【】）。
// 只要还有【…】，页面就不会被搜索引擎收录，也不会出现在页脚和 sitemap 中。
export const about = {
  // 署名：真名或固定使用的笔名都可以，Google 看重的是“有一个持续负责内容的人”
  authorName: "【姓名或笔名，例如：小郑】",
  // 照片主要在哪里拍摄
  location: "【主要拍摄地区，例如：日本东京及周边的公园、街道和山地】",
  // 从哪一年开始拍植物
  startedYear: "【开始拍摄植物的年份，例如：2020】",
  // 一两句个人背景：为什么懂植物、怎么观察
  background:
    "【一两句个人背景，例如：业余植物爱好者，平时利用周末在公园和山地拍摄树木，习惯同一棵树在不同季节反复去拍。】",
  // 做这个网站的原因
  why: "【为什么做这个网站，例如：很多相似的树在网上只能找到一两张图，很难看清叶片、树皮这些细节的区别，所以想用自己拍的照片把它们并排放在一起。】",
  // 鉴定和描述参考了哪些资料
  references:
    "【主要参考资料，例如：《中国植物志》、Flora of China、Plants of the World Online（POWO）、各地植物园的标牌】",
  // 联系方式：建议用专门的邮箱，不要用工作邮箱
  contact: "【联系邮箱，例如：hello@plantatlasworld.com】",
};

// 只需要联系方式时（例如图片授权页）
export function isContactReady() {
  return !about.contact.includes("【");
}

export function isAboutReady() {
  return !Object.values(about).some((value) => value.includes("【"));
}
