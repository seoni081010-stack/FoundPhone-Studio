import { knownMapPoint } from "./mapLocations";

// A four-level reading of the supplied cutaway; high rooms, basement and grounds
// stay separate. These are map coordinates, never story/save migrations.
export type CastleFloorId = "one" | "two" | "three" | "four" | "dungeons" | "towers" | "grounds";
export const castleFloors: { id: CastleFloorId; title: string; rooms: string[] }[] = [
  { id: "towers", title: "高层与塔楼", rooms: ["天文塔", "北塔占卜教室", "格兰芬多公共休息室", "拉文克劳公共休息室", "校长办公室", "有求必应屋", "西塔猫头鹰棚", "旧观测室"] },
  { id: "four", title: "四层", rooms: ["魔咒课教室", "级长浴室", "古代如尼文教室", "算术占卜教室"] },
  { id: "three", title: "三层", rooms: ["变形课教室", "校医院", "麻瓜研究教室", "空教室", "哭泣的桃金娘盥洗室", "独眼女巫通道"] },
  { id: "two", title: "二层", rooms: ["黑魔法防御术教室", "图书馆", "魔法史教室", "公共活动室", "图书馆禁书区"] },
  { id: "one", title: "一层", rooms: ["门厅", "大礼堂", "奖品陈列室", "盔甲走廊"] },
  { id: "dungeons", title: "地窖", rooms: ["魔药课教室", "厨房", "赫奇帕奇公共休息室", "斯莱特林公共休息室"] },
  { id: "grounds", title: "室外", rooms: ["入口庭院", "温室", "海格小屋", "神奇动物课场地", "魁地奇球场", "黑湖", "打人柳", "禁林", "有顶桥", "霍格莫德"] },
];
export const classroomLocations: Record<string,string> = {
  "天文学": "天文塔", "占卜学": "北塔占卜教室", "魔咒学": "魔咒课教室", "变形术": "变形课教室",
  "黑魔法防御术": "黑魔法防御术教室", "魔药学": "魔药课教室", "草药学": "温室", "保护神奇生物": "神奇动物课场地",
  "魔法史": "魔法史教室", "古代如尼文": "古代如尼文教室", "算术占卜": "算术占卜教室", "麻瓜研究": "麻瓜研究教室",
  "自习与作业": "图书馆", "毕业研究": "图书馆", "N.E.W.T.复习": "图书馆", "导师答疑": "图书馆",
};
const aliases: [RegExp,string][] = [
  [/^(?:秘密花园的石亭|第三温室旁小路)$/, "温室"], [/^城堡前小路$/, "入口庭院"],
  [/魁地奇|球场|看台|球员|器材棚/,"魁地奇球场"], [/海格/,"海格小屋"], [/神奇动物|神奇生物/,"神奇动物课场地"],
  [/温室|草药/,"温室"], [/黑湖|湖畔|毛榉/,"黑湖"], [/打人柳/,"打人柳"], [/禁林/,"禁林"], [/有顶桥|石桥/,"有顶桥"],
  [/霍格莫德|蜂蜜公爵|三把扫帚|佐科|村外|村口|古物/,"霍格莫德"],
  [/拉文克劳.*(?:休息室|塔楼)/,"拉文克劳公共休息室"], [/格兰芬多.*(?:休息室|塔楼)/,"格兰芬多公共休息室"],
  [/赫奇帕奇.*休息室/,"赫奇帕奇公共休息室"], [/斯莱特林.*休息室/,"斯莱特林公共休息室"],
  [/猫头鹰棚/,"西塔猫头鹰棚"], [/天文/,"天文塔"], [/^(?!.*算术).*占卜|北塔/,"北塔占卜教室"], [/观测|观景|西塔|露台|塔楼/,"旧观测室"],
  [/校长/,"校长办公室"], [/有求必应/,"有求必应屋"], [/级长.*浴/,"级长浴室"], [/医院|医疗/,"校医院"],
  [/桃金娘|女生.*盥洗|女生.*洗手/,"哭泣的桃金娘盥洗室"], [/独眼女巫/,"独眼女巫通道"],
  [/魔药|地窖/,"魔药课教室"], [/厨房|梨子画像|烘焙/,"厨房"], [/黑魔法防御/,"黑魔法防御术教室"],
  [/魔咒/,"魔咒课教室"], [/变形.*教室|变形术$/, "变形课教室"], [/如尼文|符文/,"古代如尼文教室"],
  [/算术/,"算术占卜教室"], [/魔法史/,"魔法史教室"], [/麻瓜研究/,"麻瓜研究教室"],
  [/禁书区|禁区/,"图书馆禁书区"], [/图书馆|书架|阅览|档案/,"图书馆"], [/奖品|陈列室|展览/,"奖品陈列室"], [/盔甲|骑士画像/,"盔甲走廊"],
  [/礼堂|舞池|圣诞树|集市|摊位|壁炉|茶点/,"大礼堂"], [/活动室|巫师棋|棋桌/,"公共活动室"],
  [/空教室|练习室|音乐|暗房|画像后/,"空教室"], [/庭院|石拱|石板路|城堡外|回城堡|城堡的小路/,"入口庭院"],
  [/^外侧回廊$/,"入口庭院"],
  [/门厅|大厅|楼梯|入口|公告栏/,"门厅"],
];
const namedFloor = (place:string): CastleFloorId | undefined => {
  const n=place.match(/([一二三四五六七八九]|[1-9])(?:楼|层)/)?.[1];
  return n ? ({一:"one",二:"two",三:"three",四:"four","1":"one","2":"two","3":"three","4":"four"} as Record<string,CastleFloorId>)[n] ?? "towers" : undefined;
};
let offset=0;
export const castleFloorLayouts = castleFloors.map(floor=>{
  const height=62+Math.ceil(floor.rooms.length/2)*86;
  const layout={...floor,top:offset,height};offset+=height;return layout;
});
export const castleMapHeight=offset;
export function castleLocation(place:string) {
  const normalized=place.replace(/霍格沃茨|[·\s]/g,"");
  const classroom=classroomLocations[normalized];
  const direct=castleFloors.find(f=>f.rooms.includes(normalized));
  const room=classroom ?? (direct ? normalized : aliases.find(([pattern])=>pattern.test(normalized))?.[1]);
  const home=castleFloorLayouts.find(f=>f.rooms.includes(room??""));
  // Explicit corridor/empty-room floor labels retain the authored story floor.
  const explicit=namedFloor(normalized);
  const floor=castleFloorLayouts.find(f=>f.id===(explicit ?? home?.id ?? "one"))!;
  const slot=floor.rooms.indexOf(room??"");
  const x=slot<0?180:slot%2===0?90:270;
  const y=floor.top+(slot<0?floor.height-22:88+Math.floor(slot/2)*86);
  const doorway=/门口|入口|外|附近|楼梯口/.test(normalized);
  return { floor:floor.id, floorTitle:floor.title, room:slot<0?`${floor.title}走廊`:room!, x:x+(doorway?8:0), y,
    explicit: Boolean(room || explicit || knownMapPoint(place)), key:`${floor.id}:${slot<0?"corridor":room}` };
}

// Each selected floor reuses the original castle drawing's room positions.
export function castleFloorPoint(place:string) {
  const location=castleLocation(place);
  const floor=castleFloors.find(entry=>entry.id===location.floor)!;
  const slot=floor.rooms.indexOf(location.room);
  const rows=[68,123,175,227,301,353];
  return { ...location, x:slot<0?180:slot%2===0?82:276, y:slot<0?280:rows[Math.floor(slot/2)]+17 };
}
