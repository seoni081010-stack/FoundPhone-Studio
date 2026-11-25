import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4180/';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const ids=['jacob','younghoon','hyunjae','juyeon','q','sunwoo','eric'];
const c=await b.newContext({serviceWorkers:'block',reducedMotion:'reduce'});const p=await c.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(base);
const baseline=JSON.stringify({day:8,beat:0,cursor:{position:0},open:false,clues:['sunwoo-6'],affinity:23,choiceHistory:{'1:1':1},mailHistory:[]});
await p.evaluate(baseline=>localStorage.setItem('hogwarts-sunwoo-v1:seven-sunwoo',baseline),baseline);
for(const lead of ids){
 await p.evaluate(lead=>localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'隔离核验',house:'ravenclaw',year:6,loveInterest:lead,runId:'seven-'+lead})),lead);
 await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.getByRole('button',{name:'巫师手札',exact:true}).waitFor();
 assert.equal(await p.locator('.hogwarts-dock button').allTextContents().then(a=>a.map(t=>t.trim())).then(a=>JSON.stringify(a)),JSON.stringify(['魔法相册','猫头鹰信箱','巫师手札','Date']));
 await p.getByRole('button',{name:'猫头鹰信箱',exact:true}).click();
 assert.equal(await p.locator('.hogwarts-contact').count(),7);
 assert.equal(await p.locator('.hogwarts-contact img').count(),7);
 assert.equal(await p.locator('#sunwoo-scene-title').count(),0);
 assert.equal(await p.evaluate(()=>localStorage.getItem('hogwarts-sunwoo-v1:seven-sunwoo')),baseline);
 console.log('PASS route entry, dock, 7 contacts and Sunwoo save isolation',lead);
}
await b.close();assert.deepEqual(errors,[]);
