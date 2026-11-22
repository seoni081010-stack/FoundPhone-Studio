import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const endings=JSON.parse(readFileSync('stories/juyeon-endings.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4181/';const errors=[];
for(const kind of ['together','friends','unspoken']){
 const context=await browser.newContext({viewport:kind==='friends'?{width:1366,height:900}:{width:390,height:844},serviceWorkers:'block'});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 const gate=endings[kind].beats.findIndex(b=>b.endingGate),expected=endings[kind].beats[gate].lines.slice(1,6).map(l=>l.body.slice(1,-1)),after=endings[kind].beats[gate].lines[6].body;
 const key=`hogwarts-juyeon-v1:ending-letter-${kind}`;
 await p.goto(base);await p.evaluate(({key,kind,gate})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'星遥',house:'slytherin',year:6,loveInterest:'juyeon',runId:`ending-letter-${kind}`}));
  localStorage.setItem(key,JSON.stringify({day:31,beat:gate,cursor:{position:0},ending:kind,clues:['juyeon-31'],affinity:152,open:true}));
 },{key,kind,gate});
 const enter=async()=>{await p.goto(base);await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('.juyeon-ending-letter').waitFor();};
 const saved=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 await enter();const modal=p.locator('.juyeon-ending-letter'),start=(await saved()).juyeonEndingLetter.startedAt;
 assert.equal(await modal.getAttribute('data-ending'),kind);assert.equal(await modal.locator('button,h1,h2,.hogwarts-message').count(),0);
 assert.deepEqual(await modal.locator('.ending-letter-paragraph').allTextContents(),expected);
 assert.equal(await modal.locator('.ending-letter-player').textContent(),'星遥');
 await p.waitForTimeout(Math.max(0,start+700-Date.now()));await p.mouse.click(12,12);assert.ok(await modal.evaluate(el=>el.open));
 await p.keyboard.press('Escape');assert.ok(await modal.evaluate(el=>el.open));
 await p.screenshot({path:`work/juyeon-letter-envelope-${kind}.png`});
 await p.waitForTimeout(Math.max(0,start+2700-Date.now()));
 assert.notEqual(await modal.locator('.ending-envelope-lid').evaluate(el=>getComputedStyle(el).transform),'none');
 await p.screenshot({path:`work/juyeon-letter-opening-${kind}.png`});
 if(kind==='friends'){await enter();assert.equal((await saved()).juyeonEndingLetter.startedAt,start);}
 await p.waitForTimeout(Math.max(0,start+9400-Date.now()));
 const opacity=index=>modal.locator('.ending-letter-paragraph').nth(index).evaluate(el=>Number(getComputedStyle(el).opacity));
 assert.ok(await opacity(0)>.9);if(Date.now()<start+11100)assert.ok(await opacity(2)<.05);
 await p.waitForFunction(()=>document.querySelector('.juyeon-ending-letter')?.dataset.readable==='true');
 await p.waitForTimeout(600);
 for(let i=0;i<5;i++)assert.ok(await opacity(i)>.98);
 assert.equal(await modal.locator('.ending-letter-unwritten').textContent(),'');
 assert.ok(await modal.locator('.ending-letter-unwritten').evaluate(el=>el.getBoundingClientRect().height>=44));
 assert.ok(await modal.evaluate(el=>el.open),'the completed letter waits, never auto-closes');
 await p.screenshot({path:`work/juyeon-letter-open-${kind}.png`});
 await p.mouse.click(12,12);await modal.waitFor({state:'detached'});
 assert.equal((await saved()).juyeonEndingLetter.done,true);assert.equal((await saved()).juyeonEndingLetter.kind,kind);
 assert.equal((await saved()).affinity,152);assert.equal((await saved()).cursor.position,0);
 assert.ok((await p.locator('.scene-current-step').innerText()).includes(after));
 assert.ok(!(await p.locator('.scene-current-step').innerText()).includes(expected[0]),'no duplicated letter before the next narration');
 await p.goto(base);await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('#juyeon-scene-title').waitFor();
 assert.equal(await p.locator('.juyeon-ending-letter').count(),0);
 if(kind==='together'){
  await p.locator('.scene-current-step button').click();await p.getByRole('button',{name:'显示完整台词',exact:true}).click();
  assert.ok((await p.locator('.scene-current-step').innerText()).includes('本来想在信里写完的。'));
 }
 console.log('PASS ending letter',kind,'exact source, seal/flap/extraction, staggered text, blank tail, page tap, no buttons/autoclose, persistence and unchanged score');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
