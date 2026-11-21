import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const catalog=JSON.parse(readFileSync('stories/template/hogwarts-gift-catalog.json','utf8'));
const preferences=JSON.parse(readFileSync('stories/template/hogwarts-gift-preferences.json','utf8')).preferences;
const names={juyeon:'李柱延',hyunjae:'李贤在',jacob:'裴俊英',q:'池昌民',younghoon:'金泳勋'};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const errors=[];
async function openGame(page){await page.goto(base);await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByRole('button',{name:'巫师手札',exact:true}).waitFor();}
async function stats(page,id){
 const journal=page.getByRole('button',{name:'巫师手札',exact:true});
 if(await journal.getAttribute('aria-pressed')!=='true')await journal.click();
 const expand=page.getByRole('button',{name:/人物档案/});
 if(await expand.getAttribute('aria-expanded')==='false')await expand.click();
 await page.getByRole('button',{name:names[id],exact:true}).click();
 const article=page.getByRole('region',{name:'人物状态'}).locator('article');
 const values=await article.locator('progress').evaluateAll(items=>items.map(p=>p.value));
 assert.equal(values.length,2);return values;
}
async function buyAndGive(page,item,recipient){
 await page.getByRole('button',{name:'猫头鹰信箱',exact:true}).click();
 await page.getByRole('button',{name:'魔法商店 · 猫头鹰送礼',exact:true}).click();
 await page.getByRole('button',{name:'魔法商店',exact:true}).click();
 const store=catalog.shops.find(s=>s.id===item.storeId);
 await page.getByRole('button',{name:store.location,exact:true}).click();
 await page.getByLabel('选择店铺').selectOption(store.id);
 await page.locator('li').filter({hasText:item.name}).getByRole('button',{name:'购买',exact:true}).click();
 await page.getByLabel('寄给谁').selectOption(recipient);
 await page.locator('li').filter({hasText:item.name}).getByRole('button',{name:'赠送',exact:true}).click();
}
for (const lead of Object.keys(names).filter(id=>!process.env.GIFT_LEAD||process.env.GIFT_LEAD===id)) for(const high of [false,true,...(lead==='younghoon'?['cap']:[])].filter(mode=>!process.env.GIFT_CASE||process.env.GIFT_CASE===String(mode))){
 const runId=`gift-check-${lead}-${high}`;
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const pref=preferences.find(p=>p.id===lead).preferredStores;
 const liked=catalog.items.find(i=>i.giftable&&pref.includes(i.storeId));
 const ordinary=catalog.items.find(i=>i.giftable&&!pref.includes(i.storeId));
 const other=lead==='jacob'?'younghoon':'jacob';
 await page.goto(base);
 await page.evaluate(({lead,runId,liked,high})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'核验',house:'ravenclaw',year:6,loveInterest:lead,runId}));
  if(high==='cap')localStorage.setItem(`hogwarts-gift-jealousy:${runId}:${lead}`,'98');
  // High-score fixtures represent previously delivered gifts, rather than bypassing the UI's score calculation.
  localStorage.setItem(`foundphone-hogwarts-shopping-v1-${runId}`,JSON.stringify({wallet:20000,vault:100000,inventory:{},gifts:high?{[liked.id+'-'+lead]:high==='cap'?100:14}:{},vaultUpgrade:true}));
 },{lead,runId,liked,high});
 await openGame(page);
 const before=await stats(page,lead);
 await buyAndGive(page,liked,lead);
 const afterLiked=await stats(page,lead);assert.equal(afterLiked[0],Math.min(100,before[0]+5));
 await buyAndGive(page,ordinary,lead);
 const afterOrdinary=await stats(page,lead);assert.equal(afterOrdinary[0],Math.min(100,afterLiked[0]+2));
 const recipientBefore=await stats(page,other);
 await buyAndGive(page,liked,other);
 const afterRival=await stats(page,lead);
 assert.equal(afterRival[0],afterOrdinary[0]);
 assert.equal(afterRival[1],Math.min(100,before[1]+(afterOrdinary[0]>=70?5:3)));
 const recipientAfter=await stats(page,other);
 const recipientLikes=preferences.find(p=>p.id===other).preferredStores.includes(liked.storeId);
 assert.equal(recipientAfter[0],Math.min(100,recipientBefore[0]+(recipientLikes?5:2)));
 // Repeat reload to catch both loss and duplicate reapplication of persisted gifts.
 for(let i=0;i<2;i++){
  await openGame(page);assert.deepEqual(await stats(page,lead),afterRival);
  assert.deepEqual(await stats(page,other),recipientAfter);
 }
 console.log(JSON.stringify({lead,high,before,afterLiked,afterOrdinary,afterRival,recipientAfter,refresh:'stable twice'}));
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
