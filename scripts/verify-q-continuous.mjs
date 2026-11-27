import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const paths=JSON.parse(readFileSync('work/q-verification-results.json')).paths;
const base=process.env.BASE_URL||'http://127.0.0.1:4183/';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
const results=[];
try{for(const path of paths){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 const run=`q-continuous-${path.kind}`;
 await page.evaluate(run=>localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'连续游玩',house:'ravenclaw',year:6,loveInterest:'q',runId:run})),run);
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 const key=`foundphone-q-day01-${run}`;
 let before;
 for(let phase=0;phase<2;phase++){
  const result=await page.evaluate(async({history,key,stopAt})=>{
   let previous=0,stuck=0;const days=new Set();
   for(let i=0;i<12000;i++){
    await new Promise(r=>setTimeout(r,2));
    const save=JSON.parse(localStorage.getItem(key)||'null');const count=save?.choices?.length||0;const date=document.querySelector('.hogwarts-device-header time')?.textContent||document.querySelector('.hogwarts-device-top')?.textContent;
    if(date)days.add(date);
    if(stopAt&&count>=stopAt)return {count,save};
    const ending=document.querySelector('.hogwarts-ending');if(ending)return {kind:ending.dataset.kind,count,text:ending.textContent,save};
    const surface=document.querySelector('dialog[open]')||document;
    const checklist=document.querySelector('.q-match-checklist[open]');
    if(checklist){if(checklist.dataset.ready==='true')checklist.querySelector('.q-match-checklist-paper')?.click();else await new Promise(r=>setTimeout(r,80));continue;}
    const buttons=[...surface.querySelectorAll('button')].filter(b=>!b.disabled);
    if(document.querySelector('#match-wager-title')){document.querySelector('[data-team="斯莱特林"]')?.click();buttons.find(b=>b.textContent==='就押这个')?.click();continue;}
    const expected=history[count];
    let button=buttons.find(b=>b.textContent==='显示完整')||buttons.find(b=>b.closest('.scene-current-step,.scene-fixed-reply'));
    button ||= buttons.find(b=>b.dataset.choiceTarget===expected);
    button ||= buttons.find(b=>/^(继续|展开羊皮纸|收下饮料券|把纸条折起来|查看结局|返回今日行程|陪他坐一会儿)/.test(b.textContent));
    if(!button&&!document.querySelector('dialog[open]'))button=buttons.find(b=>b.textContent==='去上课')||buttons.find(b=>b.textContent==='结束这一天')||buttons.find(b=>/^(打开猫头鹰信箱|查看池昌民的来信)/.test(b.textContent))||buttons.find(b=>b.classList.contains('hogwarts-activity'))||buttons.find(b=>b.classList.contains('hogwarts-device-back'));
    // Pub-only commentary is independent and awards no score.
    button ||= buttons.find(b=>b.closest('.hogwarts-device-choices'));
    button?.click();
    stuck=count===previous?stuck+1:0;previous=count;
    if(stuck>1000)throw Error('Stalled expected '+expected+' '+document.body.innerText.slice(-1800));
   }throw Error('Continuous traversal exceeded limit');
  },{history:path.choices,key,stopAt:phase===0?75:0});
  if(phase===0){before=result;await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();const save=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.deepEqual(save.choices,before.save.choices);assert.deepEqual(save.readDays,before.save.readDays);}
  else{assert.equal(result.kind,path.kind);assert.deepEqual(result.save.choices,path.choices);assert.deepEqual(errors,[]);results.push({kind:path.kind,affinity:path.affinity,choices:result.count,refreshAt:before.count});console.log('PASS continuous browser Day 1–31, reload and ending',results.at(-1));}
 }
 await context.close();
}writeFileSync('work/q-continuous-results.json',JSON.stringify(results,null,2));}finally{await browser.close();}
