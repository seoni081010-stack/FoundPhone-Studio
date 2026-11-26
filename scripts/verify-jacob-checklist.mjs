import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('stories/jcode-expanded.json'));
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const items=['确认本院留校名单','节日巡逻安排表','布置圣诞树','完成魔药课论文','把写好的圣诞贺卡寄出去','买一些巧克力和姜饼','睡到自然醒'];
const starts=[];for(const [i]of items.entries())starts.push(i?starts[i-1]+Array.from(items[i-1]).length*95+320:1500);
const writingEnd=starts.at(-1)+Array.from(items.at(-1)).length*95+240,duration=writingEnd+8000;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
try{for(const mobile of [true,false]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block',reducedMotion:'no-preference'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const run='checklist-'+mobile,key='hogwarts-jacob-expanded-v1:'+run;
 await page.goto(base);await page.evaluate(({key,run})=>{localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'清单核验',house:'hufflepuff',year:7,loveInterest:'jacob',runId:run}));localStorage.setItem(key,JSON.stringify({day:16,beat:0,cursor:{position:0},clues:[],affinity:40,open:true}));},{key,run});await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await page.clock.install({time:new Date()});await page.clock.pauseAt(new Date(Date.now()+2000));
 for(let i=0;i<30;i++){if(await page.locator('.jacob-christmas-checklist[open]').count())break;await page.locator('dialog[open] .scene-current-step button,dialog[open] .scene-fixed-reply button').first().evaluate(e=>e.click());}
 const paper=page.getByRole('dialog',{name:'裴俊英的圣诞待办清单'});await paper.waitFor();await page.waitForFunction(()=>document.querySelector('.jacob-christmas-checklist')?.dataset.ready==='true');
 assert.equal(await paper.locator('button').count(),0);assert.equal(await page.getByRole('button',{name:'你还给自己列了清单？',exact:true}).count(),0);
 const start=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).jacobChecklistStartedAt,key);
 async function elapsed(ms){const now=await page.evaluate(()=>Date.now());await page.clock.fastForward(Math.max(0,start+ms-now));}
 await elapsed(1200);assert.equal(await paper.locator('h2').getAttribute('data-visible'),'true');assert.equal(await paper.locator('li[data-visible=true]').count(),0);
 await elapsed(1800);assert.equal(await paper.locator('li[data-visible=true]').count(),1);assert.ok((await paper.locator('li').first().innerText()).length<items[0].length);
 await page.keyboard.press('Escape');assert.equal(await paper.count(),1);
 if(mobile){await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await paper.waitFor();await page.waitForFunction(()=>document.querySelector('.jacob-christmas-checklist')?.dataset.ready==='true');assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).jacobChecklistStartedAt,key),start);assert.equal(await paper.count(),1);}
 await elapsed(writingEnd+80);assert.deepEqual((await paper.locator('li').allTextContents()).map(t=>t.trim()),items);assert.deepEqual(await paper.locator('li').evaluateAll(rows=>rows.map(r=>r.dataset.done)),['true','true','false','false','true','true','false']);
 assert.equal(await paper.locator('li').first().locator('.jacob-checklist-ink').evaluate(e=>getComputedStyle(e).textDecorationLine),'line-through');assert.equal(await paper.locator('li').nth(2).locator('.jacob-checklist-ink').evaluate(e=>getComputedStyle(e).textDecorationLine),'none');
 assert.equal(await paper.evaluate(()=>document.fonts.check('24px "Jacob Checklist Hand"','确认本院留校名单')),true);
 const box=await paper.locator('.jacob-checklist-sheet').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=page.viewportSize().width+1&&box.y+box.height<=page.viewportSize().height+1);
 await page.screenshot({animations:'disabled',path:`work/jacob-checklist-${mobile?'mobile':'desktop'}.png`});await elapsed(duration-120);assert.equal(await paper.count(),1);await elapsed(duration+100);await paper.waitFor({state:'detached'});
 const reply=page.getByRole('button',{name:'你还给自己列了清单？',exact:true});await reply.waitFor();let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved.jacobChecklistRead,true);assert.equal(saved.affinity,40);assert.deepEqual(saved.clues,[]);
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await reply.waitFor();assert.equal(await paper.count(),0);await reply.click();
 saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved.cursor.accepted,true);assert.equal(saved.affinity,40);console.log('PASS checklist',mobile?'mobile':'desktop','precise trigger, seven handwritten rows, four strikes, eight-second reading hold, automatic close, clickable original reply, refresh, unchanged score');await context.close();
}assert.deepEqual(errors,[]);}finally{await browser.close();}
