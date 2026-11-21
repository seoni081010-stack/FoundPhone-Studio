import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const days=JSON.parse(readFileSync('stories/juyeon.json','utf8'));
const mailBeat=days[7].beats.findIndex(b=>b.channel==='mail');
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const p=await b.newPage({serviceWorkers:'block',reducedMotion:'reduce'});const base=process.env.BASE_URL||'http://127.0.0.1:4181/';
const key='hogwarts-juyeon-v1:backlog-check';
await p.goto(base);await p.evaluate(({key,mailBeat})=>{
 localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'juyeon',runId:'backlog-check'}));
 localStorage.setItem(key,JSON.stringify({day:9,beat:0,cursor:{position:0},open:false,clues:['juyeon-6'],affinity:20,mailBacklog:{8:{beat:mailBeat,cursor:{position:0}}}}));
},{key,mailBeat});
await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
await p.getByRole('button',{name:'猫头鹰信箱',exact:true}).click();await p.locator('.hogwarts-contact').filter({hasText:'李柱延'}).click();
await p.getByRole('button',{name:'12月8日 · 未读来信',exact:true}).click();
const section=p.locator('.juyeon-mail-scene');await section.waitFor();
for(let i=0;i<12;i++){
 const step=section.locator('.scene-current-step button');
 if(await step.count()){await step.evaluate(button=>button.click());continue;}
 const fixed=section.locator('.scene-fixed-reply button');if(await fixed.count()){await fixed.evaluate(button=>button.click());continue;}
 const options=section.locator('.hogwarts-device-choices button');if(await options.count()){await options.nth(1).evaluate(button=>button.click());break;}
}
const saved=JSON.parse(await p.evaluate(key=>localStorage.getItem(key),key));
assert.equal(saved.day,9);assert.equal(saved.beat,0);assert.equal(saved.affinity,21);
await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
await p.getByRole('button',{name:'猫头鹰信箱',exact:true}).click();await p.locator('.hogwarts-contact').filter({hasText:'李柱延'}).click();
await p.getByRole('button',{name:'12月8日 · 未读来信',exact:true}).click();
for(let i=0;i<180;i++){
 await p.waitForTimeout(1);
 if(!await p.locator('.juyeon-mail-scene').count())break;
 await p.locator('.juyeon-mail-scene').evaluate(section=>{
  const button=section.querySelector('.scene-current-step button,.scene-fixed-reply button')||section.querySelector('.hogwarts-continue-day');
  button?.click();
 });
}
const restored=JSON.parse(await p.evaluate(key=>localStorage.getItem(key),key));
assert.equal(restored.day,9);assert.equal(restored.beat,0);assert.equal(restored.affinity,21);
assert.equal(restored.mailBacklog['8'],undefined);
assert.ok(restored.mailHistory.length>0);
assert.ok((await p.locator('.hogwarts-device-top').innerText()).includes('D9/31'));
console.log('PASS unread mail replay, fixed replies, single scoring, current-day isolation and refresh');await b.close();
