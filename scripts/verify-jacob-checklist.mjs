import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('stories/jcode-expanded.json'));
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const items=['确认本院留校名单','节日巡逻安排表','布置圣诞树','完成魔药课论文','把写好的圣诞贺卡寄出去','买一些巧克力和姜饼','睡到自然醒'];
const starts=[];for(const [i]of items.entries())starts.push(i?starts[i-1]+Array.from(items[i-1]).length*95+320:1500);
const writingEnd=starts.at(-1)+Array.from(items.at(-1)).length*95+240;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
try{for(const day of [16,21])for(const mobile of [true,false]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block',reducedMotion:'no-preference'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const run='checklist-'+day+'-'+mobile,key='hogwarts-jacob-expanded-v1:'+run;
 const startKey=day===21?'jacobChecklist21StartedAt':'jacobChecklistStartedAt',readKey=day===21?'jacobChecklist21Read':'jacobChecklistRead',replyText=day===21?'恭喜你，终于可以放假了。':'你还给自己列了清单？';
 await page.goto(base);await page.evaluate(({key,run,day})=>{localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'清单核验',house:'hufflepuff',year:7,loveInterest:'jacob',runId:run}));localStorage.setItem(key,JSON.stringify({day,beat:0,cursor:{position:0},clues:[],affinity:40,open:true,...(day===21?{jacobChecklistRead:true}:{})}));},{key,run,day});await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await page.clock.install({time:new Date()});await page.clock.pauseAt(new Date(Date.now()+2000));
 for(let i=0;i<30;i++){if(await page.locator('.jacob-christmas-checklist[open]').count())break;await page.locator('dialog[open] .scene-current-step button,dialog[open] .scene-fixed-reply button').first().evaluate(e=>e.click());}
 const paper=page.getByRole('dialog',{name:'裴俊英的圣诞待办清单'});await paper.waitFor();await page.waitForFunction(()=>document.querySelector('.jacob-christmas-checklist')?.dataset.ready==='true');
 assert.equal(await paper.locator('button').count(),0);assert.equal(await page.getByRole('button',{name:replyText,exact:true}).count(),0);
 const start=await page.evaluate(({key,startKey})=>JSON.parse(localStorage.getItem(key))[startKey],{key,startKey});
 async function elapsed(ms){const now=await page.evaluate(()=>Date.now());await page.clock.fastForward(Math.max(0,start+ms-now));}
 await elapsed(1200);assert.equal(await paper.locator('h2').getAttribute('data-visible'),'true');assert.equal(await paper.locator('li[data-visible=true]').count(),0);
 await elapsed(1800);assert.equal(await paper.locator('li[data-visible=true]').count(),1);assert.ok((await paper.locator('li').first().innerText()).length<items[0].length);
 await paper.locator('.jacob-checklist-sheet').evaluate(e=>e.click());assert.equal(await paper.count(),1);assert.equal(await paper.locator('.jacob-checklist-sheet').getAttribute('aria-disabled'),'true');await page.keyboard.press('Escape');assert.equal(await paper.count(),1);
 if(mobile){await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await paper.waitFor();await page.waitForFunction(()=>document.querySelector('.jacob-christmas-checklist')?.dataset.ready==='true');assert.equal(await page.evaluate(({key,startKey})=>JSON.parse(localStorage.getItem(key))[startKey],{key,startKey}),start);assert.equal(await paper.count(),1);}
 await elapsed(writingEnd+80);assert.deepEqual((await paper.locator('li').allTextContents()).map(t=>t.trim()),items);assert.deepEqual(await paper.locator('li').evaluateAll(rows=>rows.map(r=>r.dataset.done)),day===21?['true','true','true','true','true','true','false']:['true','true','false','false','true','true','false']);
 assert.equal(await paper.locator('li').first().locator('.jacob-checklist-ink').evaluate(e=>getComputedStyle(e).textDecorationLine),'line-through');assert.equal(await paper.locator('li').nth(2).locator('.jacob-checklist-ink').evaluate(e=>getComputedStyle(e).textDecorationLine),day===21?'line-through':'none');
 assert.equal(await paper.locator('li').last().locator('.jacob-checklist-ink').evaluate(e=>getComputedStyle(e).textDecorationLine),'none');
 assert.equal(await paper.evaluate(()=>document.fonts.check('24px "Jacob Checklist Hand"','确认本院留校名单')),true);
 const box=await paper.locator('.jacob-checklist-sheet').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=page.viewportSize().width+1&&box.y+box.height<=page.viewportSize().height+1);
 await page.screenshot({animations:'disabled',path:`work/jacob-checklist-day${day}-${mobile?'mobile':'desktop'}.png`});assert.equal(await paper.getAttribute('data-written'),'true');assert.equal(await paper.locator('.jacob-checklist-sheet').getAttribute('aria-disabled'),'false');if(!mobile){await elapsed(writingEnd+60000);assert.equal(await paper.count(),1);await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await paper.waitFor();await page.waitForFunction(()=>document.querySelector('.jacob-christmas-checklist')?.dataset.written==='true');}await page.mouse.click(2,2);assert.equal(await paper.count(),1);const bounds=await paper.boundingBox();const leftCorner=day===16?mobile:!mobile;await page.mouse.click(leftCorner?bounds.x+8:bounds.x+bounds.width-8,mobile?bounds.y+8:bounds.y+bounds.height-8);await paper.waitFor({state:'detached'});
 const reply=page.getByRole('button',{name:replyText,exact:true});await reply.waitFor();let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved[readKey],true);if(day===21)assert.equal(saved.jacobChecklistRead,true);assert.equal(saved.affinity,40);assert.deepEqual(saved.clues,[]);
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await reply.waitFor();assert.equal(await paper.count(),0);await reply.click();
 saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved.cursor.accepted,true);assert.equal(saved.affinity,40);console.log('PASS checklist',day,mobile?'mobile':'desktop','precise trigger, seven handwritten rows, day-specific strikes, early clicks ignored, no automatic close, click anywhere after writing, clickable original reply, refresh, unchanged score');await context.close();
}assert.deepEqual(errors,[]);}finally{await browser.close();}
