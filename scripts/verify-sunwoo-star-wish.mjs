import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true });
const base = process.env.BASE_URL || 'http://127.0.0.1:4180/';
const errors=[];
for (const branch of [0,1]) {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const key=`hogwarts-sunwoo-v1:star-wish-${branch}`;
 await page.goto(base);
 await page.evaluate(({key,branch})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'sunwoo',runId:`star-wish-${branch}`}));
  localStorage.setItem(key,JSON.stringify({day:19,beat:4,option:branch,cursor:{position:0,accepted:true},clues:[],affinity:17,open:true,starWishEntry:{draft:"",done:true}}));
 },{key,branch});
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();
 assert.equal(await page.locator('.star-wish-paper').count(),0);
 for(let i=0;i<100&&!await page.locator('.star-wish-paper').count();i++){
  const b=page.locator('.scene-current-step button,.scene-fixed-reply button').first();
  await b.click();
 }
 const modal=page.locator('.star-wish-paper');await modal.waitFor();
 const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 const deadline=(await saved()).starWishUntil;
 assert.ok(deadline>Date.now());
 assert.equal(await modal.locator('p').textContent(),'我希望有一天，能勇敢一点。');
 assert.equal(await modal.locator('button,.hogwarts-message').count(),0);
 await page.keyboard.press('Escape');assert.ok(await modal.evaluate(el=>el.open));
 await page.waitForTimeout(300);
 const opacity = selector => modal.locator(selector).evaluate(el=>Number(getComputedStyle(el).opacity));
 assert.ok(await opacity('.star-wish-folded')>.8);
 await page.screenshot({path:`work/star-wish-folded-${branch}.png`});
 await page.waitForTimeout(2100);
 assert.ok(await opacity('.star-wish-strip')>.95);
 assert.ok(await opacity('.star-wish-strip p')>.95);
 assert.ok(await opacity('.star-wish-folded')<.05);
 await page.screenshot({path:`work/star-wish-open-${branch}.png`});
 if(branch===1){
  await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();
  assert.ok([0,deadline].includes((await saved()).starWishUntil));

 }
 if(branch===0){
  await page.waitForTimeout(Math.max(0,deadline-Date.now()-400));
  assert.ok(await opacity('.star-wish-folded')>.95);
  assert.ok(await opacity('.star-wish-strip')<.05);
  await page.screenshot({path:'work/star-wish-refolded.png'});
 }
 await page.locator('.star-wish-paper').waitFor({state:'detached',timeout:7500});
 assert.ok(Date.now()>=deadline-50);if(branch===0)assert.ok(Date.now()<deadline+1500);
 assert.equal((await saved()).cursor.position,13);assert.equal((await saved()).affinity,17);
 await page.locator('.scene-current-step').getByText('你那个写了什么？',{exact:true}).waitFor();
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();
 assert.equal(await page.locator('.star-wish-paper').count(),0);
 assert.equal((await saved()).cursor.position,13);
 console.log(`PASS Day19 branch ${branch}: folded blue star, open paper, exact wish, refold, 7s auto-resume and refresh saved`);
 await context.close();
}
assert.deepEqual(errors,[]);await browser.close();
