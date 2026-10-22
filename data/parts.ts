// 植物部位词表：photos.csv 的 part 列只能使用这里的 slug。
// 新增部位时在这里加一行即可，部位页和对比页会自动生成。
export type PlantPart = {
  slug: string;
  nameCn: string;
  // 用于标题，例如“银杏叶子图片”“银杏和鹅掌楸叶子的区别”
  noun: string;
  // 对比页里提示用户重点看什么
  lookFor: string;
};

export const plantParts: PlantPart[] = [
  {
    slug: "leaf",
    nameCn: "叶片",
    noun: "叶子",
    lookFor: "叶形、叶缘、叶脉走向、叶序以及叶片质地",
  },
  {
    slug: "flower",
    nameCn: "花",
    noun: "花",
    lookFor: "花色、花瓣数量、花序形态以及开花时是否有叶",
  },
  {
    slug: "fruit",
    nameCn: "果实",
    noun: "果实",
    lookFor: "果实形状、大小、颜色以及着生方式",
  },
  {
    slug: "cone",
    nameCn: "球果",
    noun: "球果",
    lookFor: "球果形状、鳞片排列以及成熟后的颜色",
  },
  {
    slug: "seed",
    nameCn: "种子",
    noun: "种子",
    lookFor: "种子形状、是否有翅以及表面纹理",
  },
  {
    slug: "bark",
    nameCn: "树皮",
    noun: "树皮",
    lookFor: "树皮颜色、开裂方向、是否斑驳或片状剥落",
  },
  {
    slug: "branch",
    nameCn: "枝条",
    noun: "枝条",
    lookFor: "枝条颜色、皮孔、是否下垂以及小枝排列",
  },
  {
    slug: "bud",
    nameCn: "芽",
    noun: "芽",
    lookFor: "冬芽形状、芽鳞以及着生位置",
  },
  {
    slug: "habit",
    nameCn: "树形",
    noun: "树形",
    lookFor: "树冠轮廓、主干是否明显以及分枝角度",
  },
  {
    slug: "autumn",
    nameCn: "秋色",
    noun: "秋叶",
    lookFor: "秋季叶色、变色时间以及落叶前的整体色调",
  },
];

export function getPart(slug: string) {
  return plantParts.find((part) => part.slug === slug);
}
