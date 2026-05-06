export const identifyPages = [
  {
    slug: "fan-shaped-leaf",
    title: "叶子像扇子的树有哪些",
    description:
      "叶子像扇子的树最典型的是银杏。识别这类植物时，可以重点观察叶片是否呈扇形、叶脉是否从叶柄处放射展开，以及秋季是否出现明显黄叶。",
    tagRules: ["扇形叶"],
    intent: "leaf-shape",
    observeParts: ["叶片形状", "叶脉", "秋季叶色", "树形"],
    seoKeywords: ["扇形叶植物", "叶子像扇子的树", "银杏叶识别"],
  },
  {
    slug: "needle-leaf-trees",
    title: "叶子像针的树有哪些",
    description:
      "叶子像针的树通常属于针叶类植物，常见于松、柏、杉等类群。识别时要比较针叶长度、叶片排列、枝条形态和是否常绿。",
    tagRules: ["针形叶", "针叶树"],
    intent: "leaf-shape",
    observeParts: ["针叶长度", "叶片排列", "枝条形态", "树冠轮廓"],
    seoKeywords: ["针叶树", "针形叶植物", "松树柏树区别"],
  },
  {
    slug: "street-trees",
    title: "常见行道树有哪些",
    description:
      "常见行道树通常适应城市环境，具有树冠较整齐、耐修剪、观赏性强或遮阴效果好的特点。识别行道树时，可以结合叶片、树皮、树冠和道路绿化场景判断。",
    tagRules: ["行道树"],
    intent: "scene",
    observeParts: ["树冠", "树皮", "叶片", "道路绿化场景"],
    seoKeywords: ["城市行道树", "路边常见树", "道路绿化树种"],
  },
  {
    slug: "yellow-autumn-leaf-trees",
    title: "秋天叶子变黄的树有哪些",
    description:
      "秋天叶子变黄的树常见于银杏、部分槭树、栾树、水杉等植物。识别时要观察叶形、变色时间、树冠颜色是否均匀以及落叶速度。",
    tagRules: ["秋天变黄", "黄叶", "秋色叶"],
    intent: "seasonal-color",
    observeParts: ["秋季叶色", "叶片形状", "树冠颜色", "落叶时间"],
    seoKeywords: ["秋天黄叶树", "黄色秋叶植物", "秋季变黄的树"],
  },
  {
    slug: "evergreen-trees",
    title: "常绿树有哪些",
    description:
      "常绿树并不是冬天完全不落叶，而是全年保持较多绿色叶片。识别常绿树时，可以观察叶片质地、冬季树冠颜色、是否为针叶或革质阔叶。",
    tagRules: ["常绿", "常绿乔木", "常绿灌木"],
    intent: "habit",
    observeParts: ["冬季叶色", "叶片质地", "树冠", "生活型"],
    seoKeywords: ["常绿树", "常绿乔木", "冬天不落叶的树"],
  },
  {
    slug: "spring-flowering-trees",
    title: "春天开花的树有哪些",
    description:
      "春天开花的树包括梅、樱花、桃、海棠、玉兰等。识别时可以比较开花早晚、花色、花瓣形态、是否先花后叶以及花序位置。",
    tagRules: ["春季开花", "早春开花", "观花"],
    intent: "flowering-season",
    observeParts: ["花期", "花色", "花瓣", "是否先花后叶"],
    seoKeywords: ["春天开花的树", "早春开花植物", "观花树木"],
  },
  {
    slug: "red-fruit-trees",
    title: "结红色果实的树有哪些",
    description:
      "结红色果实的树在秋冬季尤其醒目。识别时可以观察果实颜色、大小、是否成串、是否为浆果状，以及叶片和树皮特征。",
    tagRules: ["红色果实", "红果", "冬季观果"],
    intent: "fruit-color",
    observeParts: ["果实颜色", "果实形状", "成熟季节", "叶片"],
    seoKeywords: ["红果树", "结红色果实的植物", "冬季观果植物"],
  },
];
