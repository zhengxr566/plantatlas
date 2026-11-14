// 被子植物的演化支（APG IV, 2016）。
// 现代分类不再把被子植物分成若干“纲”，而是按 DNA 研究得到的演化支（clade）组织各个目。
// plants.csv 只需要填写“目”，演化支由下面的 ORDER_CLADE 自动推算；新增植物时如果是表里没有的目，
// 在 ORDER_CLADE 里补一行即可（没有补时仍按 plants.csv 的“纲”显示）。
//
// 裸子植物仍按纲（银杏纲、松柏纲、苏铁纲）显示，与现行裸子植物分类一致。

export type Clade = {
  slug: string;
  name: string;
  latin: string;
  // 上一级演化支；没有时直接位于“被子植物”之下
  parent?: string;
  // 只起连接作用的中间层：只有当某个目直接属于它时才在谱系中显示
  compact?: boolean;
  // 不是单系类群（“级”），只是方便归类的一组早期分支
  grade?: boolean;
  summary: string;
};

export const clades: Clade[] = [
  {
    slug: "ana-grade",
    name: "基部被子植物",
    latin: "ANA grade",
    grade: true,
    summary:
      "被子植物中最早分化出来的几支，包括无油樟目、睡莲目和木兰藤目，常称为“ANA 级”。它们是依次分出的几个小分支，并不构成一个单系类群。",
  },
  {
    slug: "magnoliids",
    name: "木兰类植物",
    latin: "Magnoliids",
    summary:
      "较早分化的一支被子植物，花被片和雄蕊常多数、螺旋排列，许多种类含有芳香油，如木兰、樟树和胡椒。",
  },
  {
    slug: "monocots",
    name: "单子叶植物",
    latin: "Monocots",
    summary:
      "种子只有一片子叶，叶脉多为平行脉，花的各部分常为 3 或 3 的倍数，如百合、兰花、禾草和棕榈。",
  },
  {
    slug: "commelinids",
    name: "鸭跖草类",
    latin: "Commelinids",
    parent: "monocots",
    summary: "单子叶植物中的一大支，包括棕榈目、禾本目、鸭跖草目和姜目。",
  },
  {
    slug: "eudicots",
    name: "真双子叶植物",
    latin: "Eudicots",
    summary:
      "花粉有三条萌发沟（三沟花粉），是被子植物中种类最多的一支，约占全部被子植物的四分之三。",
  },
  {
    slug: "basal-eudicots",
    name: "基部真双子叶植物",
    latin: "Early-diverging eudicots",
    parent: "eudicots",
    grade: true,
    summary:
      "真双子叶植物中较早分化的几支，如毛茛目、山龙眼目和黄杨目。它们依次分出，并不构成一个单系类群。",
  },
  {
    slug: "core-eudicots",
    name: "核心真双子叶植物",
    latin: "Core eudicots",
    parent: "eudicots",
    compact: true,
    summary: "真双子叶植物的主体，花的各部分多为 5 基数，包括超蔷薇类和超菊类两大支。",
  },
  {
    slug: "superrosids",
    name: "超蔷薇类",
    latin: "Superrosids",
    parent: "core-eudicots",
    summary: "包括虎耳草目和蔷薇类。",
  },
  {
    slug: "rosids",
    name: "蔷薇类",
    latin: "Rosids",
    parent: "superrosids",
    summary: "被子植物中最大的分支之一，由葡萄目以及豆类、锦葵类两大支组成。",
  },
  {
    slug: "fabids",
    name: "豆类",
    latin: "Fabids",
    parent: "rosids",
    summary:
      "蔷薇类中的一支，又称“固氮类”：能与根瘤菌或弗兰克氏菌共生固氮的被子植物都在这一支中，如豆科、杨梅和桤木。",
  },
  {
    slug: "malvids",
    name: "锦葵类",
    latin: "Malvids",
    parent: "rosids",
    summary: "蔷薇类中的另一支，包括锦葵目、无患子目、桃金娘目和十字花目等。",
  },
  {
    slug: "superasterids",
    name: "超菊类",
    latin: "Superasterids",
    parent: "core-eudicots",
    compact: true,
    summary: "包括石竹目、檀香目和菊类。",
  },
  {
    slug: "asterids",
    name: "菊类",
    latin: "Asterids",
    parent: "superasterids",
    summary:
      "花瓣常合生成筒状或钟状（合瓣花），由山茱萸目、杜鹃花目以及唇形类、桔梗类两大支组成。",
  },
  {
    slug: "lamiids",
    name: "唇形类",
    latin: "Lamiids",
    parent: "asterids",
    summary: "菊类中的一支，常见叶对生、子房上位，如唇形目（木犀科、唇形科）、龙胆目和茄目。",
  },
  {
    slug: "campanulids",
    name: "桔梗类",
    latin: "Campanulids",
    parent: "asterids",
    summary: "菊类中的另一支，常见子房下位，如菊目、伞形目、川续断目和冬青目。",
  },
];

// 目（plants.csv 的 orderSlug）→ 所属演化支。空字符串表示直接位于“被子植物”之下
export const ORDER_CLADE: Record<string, string> = {
  amborellales: "ana-grade",
  nymphaeales: "ana-grade",
  austrobaileyales: "ana-grade",
  magnoliales: "magnoliids",
  laurales: "magnoliids",
  piperales: "magnoliids",
  canellales: "magnoliids",
  chloranthales: "",
  ceratophyllales: "",
  acorales: "monocots",
  alismatales: "monocots",
  petrosaviales: "monocots",
  dioscoreales: "monocots",
  pandanales: "monocots",
  liliales: "monocots",
  asparagales: "monocots",
  arecales: "commelinids",
  poales: "commelinids",
  commelinales: "commelinids",
  zingiberales: "commelinids",
  ranunculales: "basal-eudicots",
  proteales: "basal-eudicots",
  trochodendrales: "basal-eudicots",
  buxales: "basal-eudicots",
  gunnerales: "core-eudicots",
  dilleniales: "core-eudicots",
  saxifragales: "superrosids",
  vitales: "rosids",
  zygophyllales: "fabids",
  celastrales: "fabids",
  oxalidales: "fabids",
  malpighiales: "fabids",
  fabales: "fabids",
  rosales: "fabids",
  cucurbitales: "fabids",
  fagales: "fabids",
  geraniales: "malvids",
  myrtales: "malvids",
  crossosomatales: "malvids",
  picramniales: "malvids",
  huerteales: "malvids",
  sapindales: "malvids",
  malvales: "malvids",
  brassicales: "malvids",
  berberidopsidales: "superasterids",
  santalales: "superasterids",
  caryophyllales: "superasterids",
  cornales: "asterids",
  ericales: "asterids",
  icacinales: "lamiids",
  metteniusales: "lamiids",
  garryales: "lamiids",
  boraginales: "lamiids",
  gentianales: "lamiids",
  lamiales: "lamiids",
  solanales: "lamiids",
  vahliales: "lamiids",
  aquifoliales: "campanulids",
  asterales: "campanulids",
  escalloniales: "campanulids",
  bruniales: "campanulids",
  paracryphiales: "campanulids",
  dipsacales: "campanulids",
  apiales: "campanulids",
};

export function getClade(slug: string) {
  return clades.find((c) => c.slug === slug);
}

// 从最高一级到该演化支的完整路径
export function cladeAncestry(slug: string): Clade[] {
  const path: Clade[] = [];
  for (let c = getClade(slug); c; c = c.parent ? getClade(c.parent) : undefined) path.unshift(c);
  return path;
}

// 植物在“类群”和“目”之间的分类层级：被子植物为演化支，裸子植物为纲
export type TaxonGroup = { name: string; href?: string; level: "clade" | "class"; slug: string };

// directClades：数据中有目直接归属的演化支（compact 的中间层只有在这里面时才显示）
export function taxonGroups(
  plant: { orderSlug?: string; className: string; classSlug?: string },
  directClades: Set<string>
): TaxonGroup[] {
  const cladeSlug = plant.orderSlug ? ORDER_CLADE[plant.orderSlug] : undefined;
  if (cladeSlug === undefined) {
    return plant.className
      ? [
          {
            name: plant.className,
            href: plant.classSlug ? `/class/${plant.classSlug}` : undefined,
            level: "class",
            slug: plant.classSlug ?? "",
          },
        ]
      : [];
  }
  return cladeAncestry(cladeSlug)
    .filter((c) => !c.compact || directClades.has(c.slug))
    .map((c) => ({ name: c.name, href: `/clade/${c.slug}`, level: "clade", slug: c.slug }));
}

export function directCladesOf(plants: { orderSlug?: string }[]) {
  return new Set(
    plants.map((p) => (p.orderSlug ? ORDER_CLADE[p.orderSlug] : undefined)).filter((s): s is string => Boolean(s))
  );
}

// 是否所有已知的目都在 ORDER_CLADE 中（用于检查新增植物）
export function unknownAngiospermOrders(plants: { division: string; order: string; orderSlug?: string }[]) {
  return [
    ...new Set(
      plants
        .filter((p) => p.division === "被子植物" && p.orderSlug && !(p.orderSlug in ORDER_CLADE))
        .map((p) => `${p.order}（${p.orderSlug}）`)
    ),
  ];
}

// 植物是否属于某个演化支（包括它的下级演化支）
export function inClade(plant: { orderSlug?: string }, slug: string) {
  const own = plant.orderSlug ? ORDER_CLADE[plant.orderSlug] : undefined;
  return Boolean(own) && cladeAncestry(own!).some((c) => c.slug === slug);
}
