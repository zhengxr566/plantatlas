// 繁體中文版（台灣）的補充內容。正文由 data/zh/plants.ts 經 OpenCC（簡→繁台灣用語）轉換，
// 這裡只放台灣讀者需要不同說法的地方：台灣常用名、在台灣哪裡看得到、以及在台灣容易混淆的植物。
// 這個檔案直接用繁體中文撰寫，不會再經過轉換。

export type TwOverride = {
  // 台灣常用名（不填則使用轉換後的中文名）
  name?: string;
  // 額外的別名（加在轉換後的別名前面）
  aliases?: string[];
  // 加在「在哪裡能看到」後面的台灣資訊
  whereTw?: string;
  // 取代同名的相似植物條目，或新增條目
  similar?: { name: string; slug?: string; text: string }[];
  // 額外的小知識
  notes?: string[];
};

export const twOverrides: Record<string, TwOverride> = {
  "ginkgo-biloba": {
    whereTw: "在台灣，南投溪頭（台大實驗林）的銀杏林最有名，秋末冬初可以看到一片金黃。",
  },
  "acer-palmatum": {
    whereTw:
      "台灣平地的雞爪槭多為紅楓等園藝品種；賞楓名所奧萬大、太平山等地的「楓紅」主要是台灣原生的青楓和楓香。",
  },
  "rhododendron-simsii": {
    name: "唐杜鵑",
    aliases: ["映山紅", "杜鵑"],
    whereTw:
      "台灣平地校園、公園裡最常見的是平戶杜鵑（錦繡杜鵑）等園藝品種，3 月台北的台灣大學、陽明山都有杜鵑花季。",
    similar: [
      {
        name: "平戶杜鵑（錦繡杜鵑）",
        text: "台灣平地最常見的大花杜鵑，花大（直徑 5～7 公分），紫紅、粉紅或白色，台大杜鵑花節的主角多半是它。外形和唐杜鵑很像，常統稱為「杜鵑」。",
      },
    ],
  },
  "prunus-jamasakura": {
    name: "日本山櫻",
    whereTw: "台灣沒有野生的日本山櫻；阿里山、武陵等地以吉野櫻、八重櫻等日本櫻花為主。",
    similar: [
      {
        name: "山櫻花（緋寒櫻）",
        text: "在台灣說的「山櫻花」通常是台灣原生的緋寒櫻（Prunus campanulata），1～2 月開出下垂的桃紅色鐘形花，和日本山櫻是不同種。",
      },
      {
        name: "吉野櫻（染井吉野）",
        text: "先開花後長葉，滿樹淡粉色；花梗和萼筒有毛。同一地區的植株幾乎同時開、同時謝。",
      },
    ],
  },
  "quercus-glauca": {
    whereTw: "青剛櫟在台灣全島中、低海拔山區都很常見，秋天林下常能撿到帶環紋殼斗的橡實。",
  },
  "lagerstroemia-indica": {
    whereTw: "台灣各地的公園、校園和行道樹常見；台灣原生的同屬植物九芎（南紫薇）樹皮同樣光滑，常見於山區。",
  },
  "pittosporum-tobira": {
    whereTw: "台灣北部、東北部海岸有野生族群，平地的綠籬和安全島也常見。",
  },
  "ardisia-crenata": {
    name: "硃砂根",
    whereTw: "台灣全島中、低海拔的森林底層常見，冬天林下一叢叢紅果很醒目。",
  },
  "hedera-rhombea": {
    name: "日本常春藤",
    aliases: ["菱葉常春藤"],
    whereTw: "台灣中、高海拔山區有它的變種台灣常春藤（Hedera rhombea var. formosana），攀附在樹幹和岩壁上。",
    similar: [
      {
        name: "台灣常春藤",
        text: "日本常春藤的台灣變種，分布於台灣中、高海拔山區，外形幾乎相同，葉片稍小。",
      },
    ],
  },
  "zelkova-serrata": {
    name: "櫸",
    aliases: ["光葉櫸", "台灣櫸", "櫸木"],
    whereTw: "台灣原生，分布於全島低至中海拔山區，木材堅硬美觀，「台灣櫸」是有名的闊葉樹良材。",
  },
  "chrysanthemum-morifolium": {
    whereTw: "苗栗銅鑼的杭菊花海（11 月前後）和彰化田尾的花卉產區都很有名。",
  },
  "euonymus-japonicus": {
    aliases: ["日本衛矛"],
    whereTw: "台灣的安全島、校園和住宅綠籬中都很常見，金邊、銀邊的品種也很多。",
  },
};
