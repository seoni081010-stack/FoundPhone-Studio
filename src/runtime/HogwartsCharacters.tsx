import giftPreferences from "../../stories/template/hogwarts-gift-preferences.json";
import { useState } from "react";
import timetable from "../../stories/template/hogwarts-timetables.json";

const houseNames: Record<string,string> = { gryffindor:"Gryffindor", slytherin:"Slytherin", ravenclaw:"Ravenclaw", hufflepuff:"Hufflepuff" };
const houseChinese: Record<string,string> = { gryffindor:"格兰芬多", slytherin:"斯莱特林", ravenclaw:"拉文克劳", hufflepuff:"赫奇帕奇" };
const people = [
  { id:"jacob", name:"裴俊英", house:"hufflepuff", year:7, role:"级长", bio:"温柔耐心，认真对待每一个人。" },
  { id:"younghoon", name:"金泳勋", house:"ravenclaw", year:7, role:"学生", bio:"安静细腻，熟悉以后会显露柔软的一面。" },
  { id:"hyunjae", name:"李贤在", house:"gryffindor", year:7, role:"级长", bio:"爱开玩笑，有责任心，偶尔也有点幼稚。" },
  { id:"juyeon", name:"李柱延", house:"slytherin", year:6, role:"魁地奇击球手", bio:"专注好胜，习惯用行动表达关心。" },
  { id:"q", name:"池昌珉", house:"ravenclaw", year:6, role:"级长", bio:"好奇心旺盛，喜欢研究新奇魔法。" },
  { id:"sunwoo", name:"金善旴", house:"gryffindor", year:5, role:"魁地奇追球手", bio:"直率好胜，嘴上不服输。" },
  { id:"eric", name:"孙英宰", house:"gryffindor", year:5, role:"魁地奇找球手", bio:"活泼热情，喜欢和朋友一起冒险。" },
] as const;
type Status = { affinity:number; jealousy:number };
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export const affinityKey = (id: string) => id + "_affection";
export const jealousyKey = (id: string) => id + "_jealousy";

export function characterStatus(id: string, year: number, house: string, variables: Record<string, unknown>): Status {
 const person = people.find(p => p.id === id);
 return {
  affinity: clamp((person ? initialAffinity(year, house, person) : 0) + Number(variables[affinityKey(id)] ?? variables["friendship_" + id] ?? 0)),
  jealousy: clamp(Number(variables[jealousyKey(id)] ?? 0)),
 };
}
function overlap(year:number,house:string,otherYear:number,otherHouse:string):number {
 if(year!==otherYear) return 0;
 const group=timetable.timetables[String(year) as keyof typeof timetable.timetables];
 const a=group?.[houseNames[house] as keyof typeof group] ?? [];
 const b=group?.[houseNames[otherHouse] as keyof typeof group] ?? [];
 return a.filter(x=>b.some(y=>x.day===y.day&&x.time===y.time&&x.subject===y.subject&&x.subject!=="自习与作业")).length;
}
export function initialAffinity(year:number,house:string,person:{year:number;house:string}):number {
 if(year===person.year&&house===person.house) return 8;
 if(house===person.house) return 5;
 if(year!==person.year) return 0;
 const count=overlap(year,house,person.year,person.house);
 return count>=5?6:count>=1?3:0;
}
export function HogwartsCharacters({year,house,variables}:{year:number;house:string;variables:Record<string,unknown>}) {
 const [active,setActive]=useState<string|null>(null);
 const [expanded,setExpanded]=useState(false);
 const selected=people.find(p=>p.id===active);
 const status = selected ? characterStatus(selected.id, year, house, variables) : undefined;
 return <section className="hogwarts-market" style={{padding:16,maxWidth:600,margin:"16px auto",background:"#faf3e6",color:"#30271e",borderRadius:16}} aria-label="人物状态">
  <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} style={{width:"100%",padding:12,borderRadius:12,border:"1px solid #bda78b",background:"#fff9ed",color:"#30271e",fontWeight:700,cursor:"pointer"}}>♡ 人物档案 · 随时查看 {expanded?"收起 ↑":"展开 ↓"}</button>
  {expanded&&<div>
   <p>选择人物查看简介、好感度与嫉妒值。回复后会短暂显示本次变化。</p>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>{people.map(p=><button key={p.id} type="button" onClick={()=>setActive(p.id)} aria-pressed={active===p.id} style={{padding:"8px 12px",borderRadius:12,border:"1px solid #bda78b",background:active===p.id?"#e8d8c1":"#fff9ed",color:"#30271e",cursor:"pointer"}}>{p.name}</button>)}</div>
   {selected&&status&&<article style={{padding:16,borderRadius:12,background:"#fff9ed"}}>
    <img className="hogwarts-lead-avatar" src={`./portraits/${selected.id}.webp`} alt="" /><h3 style={{marginTop:0}}>{selected.name}</h3>
    <p>{houseChinese[selected.house]} · {selected.year}年级 · {selected.role}</p>
    <p>{selected.bio}</p>
    <p><strong>礼物偏好</strong> {selected.id === "hyunjae"
      ? "蜂蜜公爵的甜糖、厚围巾和手套、好写的羽毛笔和小书签"
      : giftPreferences.preferences.find(person => person.id === selected.id)?.likes.join("、")}</p>
    <label style={{display:"flex",alignItems:"baseline",gap:8,whiteSpace:"nowrap"}}><span>好感度</span><strong>{status.affinity}%</strong></label>
    <progress max={100} value={status.affinity} style={{width:"100%",accentColor:"#d48ba2"}} />
    <label style={{display:"flex",alignItems:"baseline",gap:8,whiteSpace:"nowrap"}}><span>嫉妒值</span><strong>{status.jealousy}%</strong></label>
    <progress max={100} value={status.jealousy} style={{width:"100%",accentColor:"#8d87bb"}} />
   </article>}
  </div>}
 </section>;
}
