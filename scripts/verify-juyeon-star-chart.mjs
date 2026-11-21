import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4181/';
const errors=[];
for(const branch of [0,1]){
 const context=await browser.newContext({viewport:branch===0?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{
  const Original=window.AudioContext;
  window.__chartAudio=[];
  if(Original)window.AudioContext=class extends Original{constructor(...args){super(...args);window.__chartAudio.push(this);}};
 });
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 const key=`hogwarts-juyeon-v1:star-chart-${branch}`;
 await p.goto(base);await p.evaluate(({key,branch})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'juyeon',runId:`star-chart-${branch}`}));
  localStorage.setItem(key,JSON.stringify({day:14,beat:1,option:branch,cursor:{position:0,accepted:true},clues:[],affinity:38,open:true}));
 },{key,branch});
 const enter=async()=>{await p.goto(base);await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('#juyeon-scene-title').waitFor();};
 const saved=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 await enter();assert.equal(await p.locator('.juyeon-star-chart').count(),0);
 for(let i=0;i<300;i++){
  if(await p.evaluate(()=>{if(document.querySelector('.juyeon-star-chart'))return true;document.querySelector('.scene-current-step button,.scene-fixed-reply button')?.click();return false;}))break;
  await p.waitForTimeout(12);
 }
 const chart=p.locator('.juyeon-star-chart');await chart.waitFor();
 const start=(await saved()).juyeonStarChart.startedAt;
 assert.equal((await saved()).beat,3);assert.equal((await saved()).cursor.position,0);
 assert.equal((await saved()).affinity,38);
 assert.equal((await p.locator('body').innerText()).includes('你不由得低头看了一会儿。'),false);
 assert.equal(await chart.innerText(),'继续');assert.equal(await chart.locator('img,.hogwarts-message,p,h2').count(),0);
 assert.equal(await chart.locator('.chart-ink circle').count(),10);assert.equal(await chart.locator('.chart-rising-star').count(),10);
 assert.ok(await chart.getByRole('button',{name:'继续'}).isDisabled());
 await p.keyboard.press('Escape');assert.ok(await chart.evaluate(el=>el.open));
 await p.waitForTimeout(Math.max(0,start+1900-Date.now()));await p.screenshot({path:`work/juyeon-chart-sweep-${branch}.png`});
 if(branch===1){await enter();assert.equal((await saved()).juyeonStarChart.startedAt,start);}
 await p.waitForTimeout(Math.max(0,start+3300-Date.now()));
 assert.ok(await chart.locator('.chart-rising-star').first().evaluate(el=>Number(getComputedStyle(el).opacity)>.8));
 const lastOpacity=await chart.locator('.chart-rising-star').last().evaluate(el=>Number(getComputedStyle(el).opacity));
 if(Date.now()<start+4110)assert.ok(lastOpacity<1,'stars lift at staggered times');
 await p.screenshot({path:`work/juyeon-chart-rising-${branch}.png`});
 await chart.getByRole('button',{name:'继续'}).waitFor();
 await p.waitForFunction(()=>!document.querySelector('.chart-continue').disabled,{timeout:13000});
 assert.ok(Date.now()>=start+10450);
 await p.waitForTimeout(400);await p.screenshot({path:`work/juyeon-chart-final-${branch}.png`});
 assert.ok(await chart.locator('.chart-sky-links').evaluate(el=>Number(getComputedStyle(el).opacity)>.5));
 const point=await chart.locator('.chart-rising-star').first().evaluate(el=>{
  const m=el.ownerSVGElement.getCTM().inverse().multiply(el.getCTM());
  const p=new DOMPoint(100,355).matrixTransform(m);return {x:p.x,y:p.y};
 });
 assert.ok(Math.abs(point.x-85)<8&&Math.abs(point.y-172)<8,'the star completes its curved flight to the upper sky, including after refresh');
 const states=await p.evaluate(()=>window.__chartAudio.map(c=>c.state));
 if(branch===0)assert.ok(states.includes('running'),'soft synthesized audio starts after the story interaction');else assert.equal(states.length,0,'refresh does not replay opening audio');
 await p.waitForTimeout(400);assert.ok(await chart.evaluate(el=>el.open),'the result waits for the player, never auto-closes');
 await chart.getByRole('button',{name:'继续'}).click();
 await chart.waitFor({state:'detached'});
 await p.waitForFunction(()=>window.__chartAudio.every(c=>c.state==='closed'));
 assert.ok((await p.locator('.scene-current-step').innerText()).includes('你不由得低头看了一会儿。'));
 assert.equal((await saved()).juyeonStarChart.done,true);assert.equal((await saved()).affinity,38);assert.equal((await saved()).cursor.position,0);
 await enter();assert.equal(await p.locator('.juyeon-star-chart').count(),0);
 assert.ok((await p.locator('.scene-current-step').innerText()).includes('你不由得低头看了一会儿。'));
 await p.locator('.scene-current-step button').click();await p.getByRole('button',{name:'这是你做的？',exact:true}).waitFor();
 if(branch===0){await p.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));delete s.juyeonStarChart;localStorage.setItem(key,JSON.stringify(s));},key);await enter();assert.equal(await p.locator('.juyeon-star-chart').count(),0);assert.equal((await saved()).cursor.position,1);}
 console.log('PASS Day14 chart',branch,'mobile/desktop, exact trigger, sound, staggered lift, final wait, click-to-resume, refresh and unchanged score');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
