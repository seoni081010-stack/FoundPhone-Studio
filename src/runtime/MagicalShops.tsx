import { useEffect, useState } from "react";
import catalog from "../../stories/template/hogwarts-gift-catalog.json";
import economy from "../../stories/template/hogwarts-economy.json";
import preferences from "../../stories/template/hogwarts-gift-preferences.json";

type Item = (typeof catalog.items)[number];
type Save = { wallet: number; vault: number; inventory: Record<string,number>; gifts: Record<string,number>; paid?: number[]; vaultUpgrade?: boolean };
const storeKey = "foundphone-hogwarts-shopping-v1";
const start = (): Save => ({wallet:economy.initial.wallet.galleons,vault:economy.initial.gringottsVault.galleons,inventory:{},gifts:{},vaultUpgrade:true});
function load(key:string):Save { try { const saved=JSON.parse(localStorage.getItem(key)||"null"); return saved && typeof saved.wallet==="number" && typeof saved.vault==="number" && saved.inventory && saved.gifts ? migrateVault(key, saved) : start(); } catch { return start(); } }
function migrateVault(key: string, save: Save): Save {
 if (save.vaultUpgrade) return save;
 const upgraded = { ...save, vault: Math.max(100000, save.vault), vaultUpgrade: true };
 localStorage.setItem(key, JSON.stringify(upgraded));
 return upgraded;
}
const fmt=(v:number)=>v.toLocaleString("zh-CN")+" 加隆";
export function creditWeeklyAllowance(identityKey: string, day: number) {
 const key = storeKey + "-" + identityKey;
 const save = load(key);
 const paid = save.paid ?? [];
 const due = [7, 14, 21, 28].filter(monday => monday <= day && !paid.includes(monday));
 if (due.length) localStorage.setItem(key, JSON.stringify({
   ...save, wallet: save.wallet + due.length * 2000, paid: [...paid, ...due],
 }));
}
export function useWeeklyAllowance(identityKey: string, day: number) {
 useEffect(() => {
   if (identityKey) creditWeeklyAllowance(identityKey, day);
 }, [identityKey, day]);
}
export function MagicalShops({identityKey,leadId,contacts,onGift}:{identityKey:string;leadId:string;contacts:readonly {id:string;name:string}[];onGift:(recipient:string,item:string,liked:boolean)=>void}) {
 const key=storeKey+"-"+identityKey;
 const [recipient,setRecipient]=useState(leadId);
 const [section, setSection] = useState<"shop" | "bank">();
 const [save,setSave]=useState<Save>(()=>load(key));
 const [place,setPlace]=useState<"对角巷"|"霍格莫德">("霍格莫德");
 const [shop,setShop]=useState("");
 const [amount,setAmount]=useState(100);
 const [message,setMessage]=useState("前往霍格莫德的商店，或到对角巷古灵阁办理金库业务。");
 const currentShops=catalog.shops.filter(s=>s.location===place);
 const activeShop=currentShops.some(s=>s.id===shop)?shop:currentShops[0]?.id;
 const items=catalog.items.filter(x=>x.storeId===activeShop && x.giftable);
 const update=(next:Save)=>{setSave(next);localStorage.setItem(key,JSON.stringify(next));};
 const transfer=(direction:"withdraw"|"deposit")=>{const n=amount;if(!Number.isSafeInteger(n)||n<=0){setMessage("请输入正确的加隆数额。");return;}if(direction==="withdraw"){if(save.vault<n){setMessage("金库余额不足。");return;}update({...save,vault:save.vault-n,wallet:save.wallet+n});setMessage("从古灵阁取出了 "+fmt(n));}else{if(save.wallet<n){setMessage("钱包余额不足。");return;}update({...save,vault:save.vault+n,wallet:save.wallet-n});setMessage("已存入古灵阁 "+fmt(n));}};
 const buy=(item:Item)=>{const price=item.displayPrice.galleons;if(save.wallet<price){setMessage("随身零钱不足，请先去古灵阁提款。");return;}update({...save,wallet:save.wallet-price,inventory:{...save.inventory,[item.id]:(save.inventory[item.id]||0)+1}});setMessage("买到了「"+item.name+"」，已放进背包。");};
 const give=(item:Item)=>{if(!save.inventory[item.id])return;const pref=preferences.preferences.find(p=>p.id===recipient);const count=save.gifts[item.id+"-"+recipient]||0;const liked=pref?.preferredStores.includes(item.storeId);const reaction=count>0?"对方感谢了你，不过似乎记得你以前送过同样的东西。":liked?"对方很喜欢这份礼物，认真地收下了。":"对方礼貌地收下了你的礼物。";update({...save,inventory:{...save.inventory,[item.id]:save.inventory[item.id]-1},gifts:{...save.gifts,[item.id+"-"+recipient]:count+1}});onGift(recipient,item.name,Boolean(liked));setMessage("已赠送「"+item.name+"」。"+reaction);};
 return <section className="hogwarts-market" aria-label="魔法商店与古灵阁" style={{padding:"16px",margin:"16px auto",maxWidth:600,border:"1px solid #bda980",borderRadius:16,background:"#faf3e6",color:"#30271e"}}>
  <h2 style={{margin:"0 0 8px"}}>✦ 魔法商店与古灵阁</h2>
  <div className="hogwarts-balances"><div>钱包<strong>{fmt(save.wallet)}</strong></div><div>金库<strong>{fmt(save.vault)}</strong></div></div>
  {!section ? <div className="hogwarts-economy-menu">
    <button onClick={() => setSection("shop")}>魔法商店</button>
    <button onClick={() => setSection("bank")}>古灵阁</button>
  </div> : section === "bank" && <button onClick={() => { setSection(undefined); setMessage(""); }}>返回送礼服务</button>}
  {section==="bank" && <div style={{padding:12,border:"1px solid #c4b18e",borderRadius:8,marginBottom:12}}><h3>古灵阁巫师银行</h3><p>提取加隆到钱包</p><input aria-label="交易加隆数量" type="number" min={1} max={save.vault} step={1} value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{maxWidth:110}}/> <button type="button" onClick={()=>transfer("withdraw")}>提款</button></div>}
  {section === "shop" && <>
  <div className="hogwarts-shop-nav"><button onClick={() => { setSection(undefined); setMessage(""); }}>返回送礼服务</button>{(["霍格莫德","对角巷"] as const).map(p=><button type="button" key={p} onClick={()=>{setPlace(p);setShop("");}} aria-pressed={place===p}>{p}</button>)}</div>
  <h3>{place}</h3>

  <label className="hogwarts-shop-picker">选择店铺 <select value={activeShop} onChange={e=>setShop(e.target.value)}>{currentShops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  <ul style={{listStyle:"none",padding:0}}>{items.map(item=><li key={item.id} style={{padding:"9px 0",borderBottom:"1px solid #dfd3bf",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span>{item.name}<small style={{display:"block"}}>{fmt(item.displayPrice.galleons)}</small></span><button type="button" onClick={()=>buy(item)}>购买</button></li>)}</ul>
  <h3>待寄的礼物</h3><label>寄给谁 <select value={recipient} onChange={event=>setRecipient(event.target.value)}>{contacts.map(contact=><option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label>
  {catalog.items.filter(x=>(save.inventory[x.id]||0)>0 && x.giftable).length===0?<p>这里还空着。挑好的礼物可以托猫头鹰送出去。</p>:<ul style={{listStyle:"none",padding:0}}>{catalog.items.filter(x=>(save.inventory[x.id]||0)>0 && x.giftable).map(item=><li key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>{item.name} × {save.inventory[item.id]} <button type="button" onClick={()=>give(item)}>赠送</button></li>)}</ul>}
  </>}
  <p role="status" aria-live="polite">{message}</p>
 </section>;
}
