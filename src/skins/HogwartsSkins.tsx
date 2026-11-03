import { useState } from "react";
import type { SkinProps } from "../AppSkins";

const panel: React.CSSProperties = { padding: 16, display: "grid", gap: 12, color: "#3d3126" };
const tile: React.CSSProperties = { padding: 14, borderRadius: 12, background: "#f4ebd9", border: "1px solid #d7c4a1" };
function Entries({p, title}: {p:SkinProps;title:string}) {
 return <div style={panel}><h2>{title}</h2>{p.items.length ? p.items.map(i=><button key={i.id} style={{...tile,textAlign:"left",color:"inherit"}} onClick={()=>{p.onRead(i.id);p.onItem(i)}}><strong>{i.title}</strong><p>{i.body}</p><small>{i.time}</small></button>) : <p style={tile}>暂时没有新的内容。</p>}</div>;
}
export function SchoolbookSkin(p:SkinProps) {
 const [tab,setTab]=useState("课程与作业");
 const tabs=["课程与作业","日历与活动","学院积分"];
 const entries=p.items.filter(i=>tab==="课程与作业"?/课程|作业/.test(i.title):tab==="学院积分"?/学院|积分/.test(i.title):/十二月|活动|日历/.test(i.title));
 return <div style={panel}><h2>📜 霍格沃茨校园手册</h2><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{...tile,background:t===tab?"#dfcba6":"#f4ebd9",padding:10}}>{t}</button>)}</div>{entries.length?entries.map(i=><button key={i.id} style={{...tile,textAlign:"left"}} onClick={()=>{p.onRead(i.id);p.onItem(i)}}><strong>{i.title}</strong><p>{i.body}</p></button>):<p style={tile}>暂无安排</p>}</div>;
}
export function OwlPostSkin(p:SkinProps){return <Entries p={p} title="🦉 猫头鹰信箱"/>}
export function MagicShopSkin(p:SkinProps){return <Entries p={p} title="🛍️ 魔法商店"/>}
export function GringottsSkin(p:SkinProps){return <Entries p={p} title="🏦 古灵阁"/>}
export function MaraudersMapSkin(p:SkinProps){return <Entries p={p} title="🗺️ 活点地图"/>}
export function WizardJournalSkin(p:SkinProps){return <Entries p={p} title="📖 巫师手札"/>}
export function MagicPhotosSkin(p:SkinProps){return <Entries p={p} title="📷 魔法相册"/>}
export function ProphetDailySkin(p:SkinProps){return <Entries p={p} title="📰 预言家日报"/>}
export function HeartArchiveSkin(p:SkinProps){return <Entries p={p} title="💌 心动档案"/>}
export function MusicSkin(p:SkinProps){return <Entries p={p} title="🎵 音乐"/>}
