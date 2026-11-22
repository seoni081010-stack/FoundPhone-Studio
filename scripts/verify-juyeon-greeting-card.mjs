import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4181/';
const errors=[];
for(const branch of [0,1]){
 const context=await browser.newContext({viewport:branch===0?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block'});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 const name=branch===0?'林星遥':'Avery Lin';const key=`hogwarts-juyeon-v1:greeting-${branch}`;
 await p.goto(base);await p.evaluate(({key,name,branch})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name,house:'slytherin',year:6,loveInterest:'juyeon',runId:`greeting-${branch}`}));
  localStorage.setItem(key,JSON.stringify({day:25,beat:8,option:branch,cursor:{position:0,accepted:true},clues:['juyeon-6','juyeon-24'],affinity:66,open:true}));
 },{key,name,branch});
 const enter=async()=>{await p.goto(base);await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('#juyeon-scene-title').waitFor();};
 const saved=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 await enter();assert.equal(await p.locator('.juyeon-greeting-modal').count(),0);
 for(let i=0;i<500;i++){
  if(await p.evaluate(()=>{if(document.querySelector('.juyeon-greeting-modal'))return true;document.querySelector('.scene-current-step button,.scene-fixed-reply button')?.click();return false;}))break;
  await p.waitForTimeout(10);
 }
 const modal=p.locator('.juyeon-greeting-modal'),stage=modal.locator('.greeting-card-stage');await modal.waitFor();
 const start=(await saved()).juyeonGreeting.startedAt;
 assert.equal((await saved()).beat,9);assert.equal((await saved()).cursor.position,7);
 assert.equal(await modal.locator('button,img,h1,h2,.hogwarts-message').count(),0);
 assert.equal(await modal.locator('.greeting-player-name').textContent(),name);
 assert.deepEqual(await modal.locator('.greeting-writing p').allTextContents(),['圣诞快乐。','希望以后还有机会','一起去看看不一样的星空。','by Juyeon']);
 await p.waitForTimeout(Math.max(0,start+700-Date.now()));
 assert.equal(await stage.getAttribute('data-readable'),'false');
 await modal.locator('.greeting-cover-front').evaluate(el=>el.click());assert.ok(await modal.evaluate(el=>el.open));
 await p.keyboard.press('Escape');assert.ok(await modal.evaluate(el=>el.open));
 await p.screenshot({path:`work/juyeon-greeting-closed-${branch}.png`});
 await p.waitForTimeout(Math.max(0,start+3500-Date.now()));
 const transform=await modal.locator('.greeting-cover').evaluate(el=>getComputedStyle(el).transform);
 assert.notEqual(transform,'none');await p.screenshot({path:`work/juyeon-greeting-opening-${branch}.png`});
 if(branch===1){await enter();assert.equal((await saved()).juyeonGreeting.startedAt,start);}
 await p.waitForTimeout(Math.max(0,start+7350-Date.now()));
 const opacity=selector=>modal.locator(selector).evaluate(el=>Number(getComputedStyle(el).opacity));
 assert.ok(await opacity('.greeting-line-0')>.9);if(Date.now()<start+8900)assert.ok(await opacity('.greeting-line-2')<.05);
 await p.waitForFunction(()=>document.querySelector('.greeting-card-stage')?.dataset.readable==='true',{timeout:14000});
 await p.waitForTimeout(Math.max(0,start+13600-Date.now()));
 assert.ok(await modal.evaluate(el=>el.open),'no automatic close after the last star is lit');
 for(const selector of ['.greeting-line-0','.greeting-line-1','.greeting-line-2','.greeting-signature'])assert.ok(await opacity(selector)>.98);
 assert.ok(await opacity('.greeting-inner-star')>.65);
 assert.ok(await p.evaluate(()=>document.fonts.check('italic 25px "Greeting Chinese"')&&document.fonts.check('25px "Greeting Latin"')));
 await p.screenshot({path:`work/juyeon-greeting-open-${branch}.png`});
 // Tapping blank space outside the actual card does not advance the story.
 await stage.evaluate(el=>el.click());assert.ok(await modal.evaluate(el=>el.open));
 await modal.locator(branch===0?'.greeting-inner':'.greeting-cover-back').click({position:{x:25,y:25}});await modal.waitFor({state:'detached'});
 const after=await saved();assert.equal(after.juyeonGreeting.done,true);assert.equal(after.affinity,66);assert.equal(after.cursor.position,7);
 assert.ok((await p.locator('.scene-current-step').innerText()).includes('你读完，抬头看向他。'));
 await enter();assert.equal(await p.locator('.juyeon-greeting-modal').count(),0);assert.equal((await saved()).affinity,66);
 await p.locator('.scene-current-step button').click();await p.getByRole('button',{name:'我看到了。',exact:true}).waitFor();
 if(branch===0){await p.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));delete s.juyeonGreeting;localStorage.setItem(key,JSON.stringify(s));},key);await enter();assert.equal(await p.locator('.juyeon-greeting-modal').count(),0);assert.equal((await saved()).cursor.position,8);}
 console.log('PASS Day25 greeting',branch,'Chinese/Latin names, folded/open states, ordered exact text, no buttons, tap-after-text, no auto-close, saved phase/acknowledgement and unchanged score');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
