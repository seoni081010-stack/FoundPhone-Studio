import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const day=JSON.parse(readFileSync('stories/eric.json','utf8'))[23];
const beat=day.beats.findIndex(b=>b.kind==='lines'&&b.lines.some(l=>l.body==='卡片里面是他熟悉的字迹。'));
const text='希望你度过一个很幸福的圣诞节，也希望明年后年我们还能一起看初雪。圣诞快乐！';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const errors=[];
for(const branch of [0,1]){
 const context=await browser.newContext({viewport:branch?{width:1366,height:900}:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const key='hogwarts-eric-v1:christmas-check',name=branch?'玩家自行设置的名字':'栀子';
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 async function enter(){await page.goto(base);await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('#eric-scene-title').waitFor();}
 await page.goto(base);await page.evaluate(({key,beat,name})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name,house:'ravenclaw',year:7,loveInterest:'eric',runId:'christmas-check'}));
  localStorage.setItem(key,JSON.stringify({day:24,beat,cursor:{position:8},affinity:30,clues:[],open:true}));
 },{key,beat,name});await enter();
 const popup=page.getByRole('dialog',{name:'Eric Sohn 的圣诞贺卡'});
 assert.equal(await popup.count(),0);
 assert.ok((await page.locator('.scene-current-step').innerText()).includes('卡片里面是他熟悉的字迹。'));
 assert.ok(!(await page.locator('.scene-current-step').innerText()).includes('希望你度过'));
 await page.locator('.scene-current-step button').click();await popup.waitFor();
 assert.equal(await popup.locator('button').count(),0);
 assert.equal(await popup.locator('textPath').textContent(),name);
 assert.equal(await popup.locator('.eric-christmas-wishes').textContent(),text);
 assert.equal(await popup.locator('.eric-christmas-signature').textContent(),'Eric Sohn');
 assert.equal(await popup.locator('.eric-christmas-envelope').isVisible(),true);
 await page.mouse.click(5,5);await page.keyboard.press('Escape');assert.equal(await popup.isVisible(),true);
 await page.waitForTimeout(1000);await page.screenshot({path:`work/eric-christmas-envelope-${branch}.png`});
 await page.waitForTimeout(3500);
 const visible=()=>popup.locator('.eric-christmas-wishes .eric-christmas-glyph').evaluateAll(spans=>spans.filter(s=>Number(getComputedStyle(s).opacity)>.9).length);
 const count=await visible();assert.ok(count>0&&count<text.length);
 await page.screenshot({path:`work/eric-christmas-writing-${branch}.png`});
 const state=await save();assert.equal(state.beat,beat);assert.equal(state.affinity,30);
 await enter();await popup.waitFor();assert.equal((await save()).ericChristmasCard.startedAt,state.ericChristmasCard.startedAt);
 await page.waitForFunction(()=>document.querySelector('.eric-christmas-card')?.getAttribute('data-ready')==='true',{},{timeout:15000});
 assert.equal(await visible(),text.length);
 await page.waitForTimeout(700);assert.equal(await popup.isVisible(),true);
 const bounds=await popup.locator('.eric-christmas-letter').boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<page.viewportSize().height);
 await page.screenshot({path:`work/eric-christmas-readable-${branch}.png`});
 // Full-page backdrop and card content both advance only after all text is written.
 if(branch)await popup.locator('.eric-christmas-wishes').click();else await page.mouse.click(5,5);
 await popup.waitFor({state:'detached'});assert.equal((await save()).beat,beat+1);assert.equal((await save()).affinity,30);
 assert.equal((await save()).ericChristmasCard.done,true);
 const options=page.locator('.hogwarts-device-choices button');
 assert.equal(await options.nth(0).textContent(),'那以后的初雪也一起看吧。');
 assert.equal(await options.nth(1).textContent(),'谢谢，我会好好留着这张贺卡的。');
 await options.nth(branch).evaluate(e=>{e.click();e.click();});assert.equal((await save()).affinity,30+(branch?1:2));
 await enter();assert.equal(await popup.count(),0);assert.equal((await save()).affinity,30+(branch?1:2));
 console.log('PASS Eric Christmas card',branch,'player name/envelope/gradual handwriting/early clicks/refresh/anywhere click/A-B/single scoring');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
