import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const context=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(base);
const old=JSON.stringify({name:'原玩家',house:'ravenclaw',year:7,loveInterest:'younghoon',runId:'existing-other-route'});
await p.evaluate(old=>localStorage.setItem('foundphone-hogwarts-identity-v1',old),old);
await p.goto(base+'?route=eric');await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
await p.getByRole('region',{name:'霍格沃茨入学登记'}).waitFor();
assert.equal(await p.locator('.hogwarts-lead-profile').innerText().then(t=>t.includes('孙英宰')),true);
assert.equal(await p.evaluate(()=>localStorage.getItem('foundphone-hogwarts-identity-v1')),old);
const key='hogwarts-eric-v1:interactions';
async function seed(beat,cursor,extra={}){
 await p.goto(base);await p.evaluate(({key,beat,cursor,extra})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'eric',runId:'interactions'}));
  localStorage.setItem(key,JSON.stringify({day:1,beat,cursor,clues:[],affinity:0,open:true,...extra}));
 },{key,beat,cursor,extra});
 await enter();
}
async function enter(){await p.goto(base);await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('#eric-scene-title').waitFor();}
const saved=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
await seed(0,{position:0});
assert.ok((await p.locator('.scene-current-step').innerText()).includes('十二月的第一天，霍格沃茨冷得出奇。'));
assert.equal(await p.locator('.scene-current-step button').textContent(),'继续');
await p.locator('.scene-current-step button').click();
const typed=await p.locator('.scene-current-step').evaluate(step=>{const before=step.querySelector('.hogwarts-message p').textContent;step.querySelector('button').click();return before;});
assert.ok(typed.length<'等一下！'.length);
assert.equal(await p.locator('.scene-current-step .hogwarts-message p').textContent(),'等一下！');
await seed(1,{position:2},{option:0});
await p.getByRole('button',{name:'真的。',exact:true}).click();assert.equal((await saved()).cursor.accepted,true);
const checkpoint=(await saved()).cursor;await enter();assert.deepEqual((await saved()).cursor,checkpoint);
assert.equal(await p.locator('.scene-fixed-reply').count(),0);
await seed(1,{position:0});
const choice=p.locator('.hogwarts-device-choices button').first();const selected=await choice.textContent();
await choice.evaluate(btn=>{btn.click();btn.click();});
assert.equal((await saved()).affinity,2);assert.equal((await saved()).choiceHistory['1:1'],0);
await enter();assert.equal((await saved()).affinity,2);assert.equal((await saved()).option,0);
await p.locator('.scene-dialogue').getByText(selected,{exact:true}).waitFor();
assert.equal(await p.locator('.hogwarts-device-choices:not(.scene-fixed-reply) button').count(),0);
await p.screenshot({path:'work/eric-mobile-branch.png'});
// A same-route entry resumes its existing run; it never creates or resets a run on URL load.
await p.goto(base+'?route=eric');await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('#eric-scene-title').waitFor();
assert.equal((await saved()).affinity,2);
assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('foundphone-hogwarts-identity-v1')).runId),'interactions');
await b.close();assert.deepEqual(errors,[]);console.log('PASS route entry preservation/resume, instant narration, speech typewriter, fixed replies, double click and refresh scoring');
