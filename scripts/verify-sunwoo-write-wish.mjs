import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4180/';
const errors=[];
for(const branch of [0,1]){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const run=`write-wish-${branch}`,key=`hogwarts-sunwoo-v1:${run}`;
 const draft='愿我能勇敢说出真心话。';
 await page.goto(base);
 await page.evaluate(({run,key,branch})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'sunwoo',runId:run}));
  localStorage.setItem(key,JSON.stringify({day:19,beat:4,option:branch,cursor:{position:0,accepted:true},clues:[],affinity:17,open:true}));
 },{run,key,branch});
 const enter=async()=>{await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-device-top').waitFor();};
 const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 await enter();assert.equal(await page.locator('.write-star-wish').count(),0);
 for(let i=0;i<100&&!await page.locator('.write-star-wish').count();i++)await page.locator('.scene-current-step button,.scene-fixed-reply button').first().click();
 const modal=page.locator('.write-star-wish');await modal.waitFor();
 assert.equal(await page.locator('.scene-current-step').count(),0);
 assert.equal(await modal.locator('label').textContent(),'请写下你的愿望');
 const input=modal.getByRole('textbox',{name:'你的愿望'}),submit=modal.getByRole('button',{name:'写好了'});
 assert.ok(await submit.isDisabled());await input.fill('   ');assert.ok(await submit.isDisabled());
 await page.keyboard.press('Escape');assert.ok(await modal.evaluate(el=>el.open));
 await input.fill(draft);assert.equal((await saved()).starWishEntry.draft,draft);
 await page.waitForTimeout(1100);assert.ok(await page.evaluate(()=>document.fonts.check('24px "Wish Calligraphy"')));
 await page.screenshot({path:`work/write-star-input-${branch}.png`});
 await enter();assert.equal(await page.getByRole('textbox',{name:'你的愿望'}).inputValue(),draft);
 await page.waitForTimeout(2300);assert.equal((await saved()).starWishEntry.submitted,undefined);
 await page.getByRole('button',{name:'写好了'}).click();
 const deadline=(await saved()).starWishEntry.foldUntil;
 assert.equal((await saved()).starWishEntry.submitted,draft);
 assert.equal(await page.locator('.write-star-wish textarea').count(),0);
 if(branch===1)await enter();
 else{
  await page.waitForTimeout(Math.max(0,deadline-Date.now()-400));
  assert.ok(await page.locator('.write-star-folded').evaluate(el=>Number(getComputedStyle(el).opacity)>.95));
  await page.screenshot({path:'work/write-star-folded.png'});
 }
 await page.locator('.write-star-wish').waitFor({state:'detached',timeout:4000});
 const after=await saved();assert.equal(after.starWishEntry.done,true);assert.equal(after.affinity,17);
 assert.equal(after.beat,5);assert.equal(after.cursor.position,0);assert.equal(after.starWishEntry.foldUntil,deadline);
 assert.ok((await page.locator('.scene-current-step').innerText()).includes('你们各自写完纸条。'));
 assert.equal(await page.locator('.scene-fixed-reply').count(),0);
 await enter();assert.equal(await page.locator('.write-star-wish').count(),0);
 assert.equal((await saved()).starWishEntry.submitted,draft);
 console.log(`PASS Day19 branch ${branch}: cream input before narration, prompt font, required wish, saved draft/submission, fold and resume at unchanged narration`);
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
