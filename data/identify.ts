type IdentifyPage = {
  slug: string;
  title: string;
  description: string;
  match: (p: any) => boolean;
};

export const identifyPages: IdentifyPage[] = [
  // 🔥 高价值（优先做流量）
  {
    slug: "fan-shaped-leaf",
    title: "叶子像扇子的树有哪些",
    description: "叶片呈扇形的树种较为特殊，常见的有银杏等。",
    match: (p) =>
      p.leaf?.includes("扇形") || p.tags?.includes("扇形叶"),
  },

  {
    slug: "white-flowers-spring",
    title: "春天开白花的树有哪些",
    description: "春季开白花的树在园林中十分常见。",
    match: (p) =>
      p.flower?.includes("白") || p.tags?.includes("白花"),
  },

  {
    slug: "yellow-flowers",
    title: "开黄花的树有哪些",
    description: "开黄色花的树种在城市绿化中较常见。",
    match: (p) =>
      p.flower?.includes("黄") || p.tags?.includes("黄花"),
  },

  {
    slug: "red-leaves-autumn",
    title: "秋天变红的树有哪些",
    description: "秋季叶片变红的树具有很高观赏价值。",
    match: (p) =>
      p.tags?.includes("红叶") || p.tags?.includes("秋天变红"),
  },

  {
    slug: "round-fruit",
    title: "果实像球的树有哪些",
    description: "一些树种的果实呈球形，如悬铃木、栾树等。",
    match: (p) =>
      p.fruit?.includes("球") || p.tags?.includes("球形果实"),
  },

  {
    slug: "smooth-bark",
    title: "树皮光滑的树有哪些",
    description: "树皮光滑是部分树种的重要识别特征。",
    match: (p) =>
      p.bark?.includes("光滑") || p.tags?.includes("光滑树皮"),
  },

  {
    slug: "fragrant-flowers",
    title: "花香明显的树有哪些",
    description: "一些树种开花时具有明显香味，如桂花等。",
    match: (p) =>
      p.tags?.includes("花香") || p.tags?.includes("香味"),
  },

  // 🌳 用途类（强SEO）
  {
    slug: "street-trees",
    title: "常见行道树有哪些",
    description: "行道树通常具有抗污染、耐修剪等特点。",
    match: (p) => p.usage?.includes("行道树"),
  },

  {
    slug: "ornamental-trees",
    title: "常见观赏树有哪些",
    description: "观赏树主要用于园林景观。",
    match: (p) => p.usage?.includes("观赏"),
  },

  // 🌲 类型
  {
    slug: "evergreen-trees",
    title: "常见常绿树有哪些",
    description: "常绿树全年保持叶片。",
    match: (p) => p.evergreen === true,
  },

  {
    slug: "deciduous-trees",
    title: "常见落叶树有哪些",
    description: "落叶树在秋冬季会落叶。",
    match: (p) => p.evergreen === false,
  },

  {
    slug: "trees",
    title: "常见乔木有哪些",
    description: "乔木是园林中最常见的树形。",
    match: (p) => p.habit === "乔木",
  },

  {
    slug: "shrubs",
    title: "常见灌木有哪些",
    description: "灌木通常高度较低，分枝较多。",
    match: (p) => p.habit === "灌木",
  },

  // 🌍 环境类
  {
    slug: "cold-resistant",
    title: "耐寒的树有哪些",
    description: "耐寒树种适合寒冷地区种植。",
    match: (p) =>
      p.environment?.includes("耐寒") || p.tags?.includes("耐寒"),
  },

  {
    slug: "shade-tolerant",
    title: "耐阴的树有哪些",
    description: "耐阴植物可以在弱光环境中生长。",
    match: (p) =>
      p.environment?.includes("耐阴") || p.tags?.includes("耐阴"),
  },

  // 🌆 地区类（简单版）
  {
    slug: "north-china-trees",
    title: "北方常见树有哪些",
    description: "适合中国北方气候的常见树种。",
    match: (p) =>
      p.tags?.includes("北方常见"),
  },

  {
    slug: "south-china-trees",
    title: "南方常见树有哪些",
    description: "适合中国南方气候的常见树种。",
    match: (p) =>
      p.tags?.includes("南方常见"),
  },
];