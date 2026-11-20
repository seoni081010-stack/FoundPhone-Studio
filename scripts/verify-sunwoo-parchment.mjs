import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true });
const base = process.env.BASE_URL || 'http://127.0.0.1:4180/';
const errors=[];
for (const branch of [0,1]) {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const key=`hogwarts-sunwoo-v1:parchment-${branch}`;
 await page.goto(base);
 await page.evaluate(({key,branch})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'sunwoo',runId:`parchment-${branch}`}));
  localStorage.setItem(key,JSON.stringify({day:5,beat:1,option:branch,cursor:{position:0,accepted:true},clues:[],affinity:17,open:true}));
 },{key,branch});
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();
 assert.equal(await page.locator('.truth-parchment').count(),0);
 for(let i=0;i<100&&!await page.locator('.truth-parchment').count();i++){
  const b=page.locator('.scene-current-step button,.scene-fixed-reply button').first();
  await b.click();
 }
 const modal=page.locator('.truth-parchment');await modal.waitFor();
 const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 const deadline=(await saved()).truthParchmentUntil;
 assert.ok(deadline>Date.now());
 assert.equal(await modal.locator('p').textContent(),'请勿直接接触墨迹。');
 assert.equal(await modal.locator('button,.hogwarts-message').count(),0);
 await page.keyboard.press('Escape');assert.ok(await modal.evaluate(el=>el.open));
 await page.waitForTimeout(700);
 assert.ok(await modal.evaluate(el=>el.open));
 assert.ok(await modal.locator('img').evaluate(el=>el.complete&&el.naturalWidth>0));
 await page.screenshot({path:`work/parchment-branch-${branch}.png`});
 if(branch===1){
  await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();
  assert.ok([0,deadline].includes((await saved()).truthParchmentUntil));

 }
 await page.locator('.truth-parchment').waitFor({state:'detached',timeout:3500});
 assert.ok(Date.now()>=deadline-50);if(branch===0)assert.ok(Date.now()<deadline+1500);
 assert.equal((await saved()).cursor.position,1);assert.equal((await saved()).affinity,17);
 await page.locator('.scene-current-step').getByText('看见没？',{exact:true}).waitFor();
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();
 assert.equal(await page.locator('.truth-parchment').count(),0);
 assert.equal((await saved()).cursor.position,1);
 console.log(`PASS Day5 branch ${branch}: 2.5s, animated image, Escape blocked, auto-resume, score and refresh saved`);
 await context.close();
}
assert.deepEqual(errors,[]);await browser.close();
