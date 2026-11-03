import { useState } from "react";
import catalog from "../../stories/template/hogwarts-gift-catalog.json";
import economy from "../../stories/template/hogwarts-economy.json";
import preferences from "../../stories/template/hogwarts-gift-preferences.json";

type Item = (typeof catalog.items)[number];
type Save = { wallet: number; vault: number; inventory: Record<string,number>; gifts: Record<string,number> };
const storeKey = "foundphone-hogwarts-shopping-v1";
const start = (): Save => ({wallet:economy.initial.wallet.galleons,vault:economy.initial.gringottsVault.galleons,inventory:{},gifts:{}});
function load(key:string):Save { try { const saved=JSON.parse(localStorage.getItem(key)||"null"); return saved && typeof saved.wallet==="number" && typeof saved.vault==="number" && saved.inventory && saved.gifts ? saved : start(); } catch { return start(); } }
const fmt=(v:number)=>v.toLocaleString("zh-CN")+" 加隆";
export function MagicalShops({identityKey,leadId}:{identityKey:string;leadId:string}) {
 const key=storeKey+"-"+identityKey;
 const [save,setSave]=useState<Save>(()=>load(key));
 const [place,setPlace]=useState<"对角巷"|"霍格莫德">("霍格莫德");
 const [shop,setShop]=useState("");
 const [amount,setAmount]=useState(100);
 const [message,setMessage]=useState("前往霍格莫德的商店，或到对角巷古灵阁办理金库业务。");
 const currentShops=catalog.shops.filter(s=>s.location===place);
 const activeShop=currentShops.some(s=>s.id===shop)?shop:currentShops[0]?.id;
 const items=catalog.items.filter(x=>x.storeId===activeShop && x.giftable);
 const update=(next:Save)=>{setSave(next);localStorage.setItem(key,JSON.stringify(next));};
 const transfer=(direction:"withdraw"|"deposit")=>{const n=Math.floor(amount);if(!Number.isFinite(n)||n<=0){setMessage("请输入正确的加隆数额。");return;}if(direction==="withdraw"){if(save.vault<n){setMessage("金库余额不足。");return;}update({...save,vault:save.vault-n,wallet:save.wallet+n});setMessage("从古灵阁取出了 "+fmt(n));}else{if(save.wallet<n){setMessage("钱包余额不足。");return;}update({...save,vault:save.vault+n,wallet:save.wallet-n});setMessage("已存入古灵阁 "+fmt(n));}};
 const buy=(item:Item)=>{const price=item.displayPrice.galleons;if(save.wallet<price){setMessage("随身零钱不足，请先去古灵阁提款。");return;}update({...save,wallet:save.wallet-price,inventory:{...save.inventory,[item.id]:(save.inventory[item.id]||0)+1}});setMessage("买到了「"+item.name+"」，已放进背包。");};
 const give=(item:Item)=>{if(!save.inventory[item.id])return;const pref=preferences.preferences.find(p=>p.id===leadId);const count=save.gifts[item.id+"-"+leadId]||0;const liked=pref?.preferredStores.includes(item.storeId);const reaction=count>0?"对方感谢了你，不过似乎记得你以前送过同样的东西。":liked?"对方很喜欢这份礼物，认真地收下了。":"对方礼貌地收下了你的礼物。";update({...save,inventory:{...save.inventory,[item.id]:save.inventory[item.id]-1},gifts:{...save.gifts,[item.id+"-"+leadId]:count+1}});setMessage("已赠送「"+item.name+"」。"+reaction);};
 return <section className="hogwarts-market" aria-label="魔法商店与古灵阁" style={{padding:"16px",margin:"16px auto",maxWidth:600,border:"1px solid #bda980",borderRadius:16,background:"#faf3e6",color:"#30271e"}}>
  <h2 style={{margin:"0 0 8px"}}>✦ 魔法商店与古灵阁</h2>
  <p>钱包：<strong>{fmt(save.wallet)}</strong> · 金库：<strong>{fmt(save.vault)}</strong></p>
  <div style={{display:"flex",gap:8,marginBottom:12}}>{(["霍格莫德","对角巷"] as const).map(p=><button type="button" key={p} onClick={()=>{setPlace(p);setShop("");}} aria-pressed={place===p}>{p}</button>)}</div>
  <h3>{place}</h3>
  {place==="对角巷" && <div style={{padding:12,border:"1px solid #c4b18e",borderRadius:8,marginBottom:12}}><strong>古灵阁巫师银行</strong><p>提取或存入加隆</p><input aria-label="交易加隆数量" type="number" min={1} step={1} value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{maxWidth:110}}/> <button type="button" onClick={()=>transfer("withdraw")}>提款</button> <button type="button" onClick={()=>transfer("deposit")}>存款</button></div>}
  <label>选择店铺 <select value={activeShop} onChange={e=>setShop(e.target.value)}>{currentShops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  <ul style={{listStyle:"none",padding:0}}>{items.map(item=><li key={item.id} style={{padding:"9px 0",borderBottom:"1px solid #dfd3bf",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span>{item.name}<small style={{display:"block"}}>{fmt(item.displayPrice.galleons)}</small></span><button type="button" onClick={()=>buy(item)}>购买</button></li>)}</ul>
  <h3>背包 · 可赠送给当前心动男主</h3>
  {catalog.items.filter(x=>(save.inventory[x.id]||0)>0 && x.giftable).length===0?<p>购买一件礼物后，可以在这里把它送给当前角色。</p>:<ul style={{listStyle:"none",padding:0}}>{catalog.items.filter(x=>(save.inventory[x.id]||0)>0 && x.giftable).map(item=><li key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>{item.name} × {save.inventory[item.id]} <button type="button" onClick={()=>give(item)}>赠送</button></li>)}</ul>}
  <p role="status" aria-live="polite">{message}</p>
 </section>;
}
