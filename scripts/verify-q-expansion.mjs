import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom'});
const q=await vite.ssrLoadModule('/src/runtime/routeWork.ts');
const ex=await vite.ssrLoadModule('/src/runtime/qExpansion.ts');
const engine=await vite.ssrLoadModule('/src/engine.ts');
const schema=await vite.ssrLoadModule('/src/schema.ts');
const {compileStory}=await vite.ssrLoadModule('/src/story-engine/compiler.ts');
const original=compileStory(JSON.parse(readFileSync('stories/hyunjae/story.json'))).work;
const work=q.gateRouteDays(q.qRouteWork(original,4));
const paths=[];
for(const mode of ['friends','unspoken','together']){
 let state=engine.dispatch(work,schema.initialRuntime(work),'start');const history=[];
 while(state.choices.length){
  const gain=c=>Number(work.nodes.find(n=>n.id===c.target)?.actions.find(a=>a.type==='increment'&&a.key==='q_affection')?.value??0);
  const high=mode==='together'||mode==='unspoken'&&Number(state.variables.q_affection)<76;
  const choices=[...state.choices].sort((a,b)=>gain(a)-gain(b));const target=(high?choices.at(-1):choices[0]).target;
  history.push(target);state=engine.choose(work,state,target);
 }
 assert.deepEqual(state.endings,[`q-${mode}`]);
 paths.push({kind:mode,affinity:Math.min(100,4+Number(state.variables.q_affection)),choices:history,originalChoices:history.filter(t=>/^q-day/.test(t))});
}
await vite.close();
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];const results=[];
try{
 const days=process.env.Q_DAYS?process.env.Q_DAYS.split(',').map(Number):Array.from({length:31},(_,i)=>i+1);
 for(const branch of [0,1])for(const day of days){
  const context=await browser.newContext({viewport:branch?{width:1280,height:900}:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  if(process.env.ONLINE_FETCH){const {attach}=await import('../work/trusted-online-fetch.mjs');await attach(context);}
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+`?preview=q-day${day}`);
  const result=await page.evaluate(async({day,branch})=>{
   const seen={snow:false,fireworks:false,card:false};let steps=0;
   for(;steps<1800;steps++){
    await new Promise(r=>setTimeout(r,2));
    const text=document.body.innerText;seen.snow ||= text.includes('下雪了');seen.fireworks ||= text.includes('烟花');seen.card ||= text.includes('圣诞快乐');
    if(document.querySelector('.hogwarts-ending'))return {...seen,steps,ending:true};
    const end=[...document.querySelectorAll('button')].find(b=>b.textContent==='结束这一天'&&!b.disabled);
    if((end||document.querySelector('[data-q-day-complete=true]'))&&day!==31)return {...seen,steps,ending:false};
    const surface=document.querySelector('dialog[open]');
    if(document.querySelector('#match-wager-title')){
     document.querySelector('[data-team="斯莱特林"]')?.click();[...surface.querySelectorAll('button')].find(b=>b.textContent==='就押这个')?.click();continue;
    }
    const letter=document.querySelector('.q-christmas-letter');
    if(letter){if(letter.dataset.written==='true')letter.querySelector('.jacob-letter-stage')?.click();else await new Promise(r=>setTimeout(r,80));continue;}
    const gingerbread=document.querySelector('.q-gingerbread-photo[open] button:not(:disabled)');
    if(gingerbread){gingerbread.click();continue;}
    const checklist=document.querySelector('.q-match-checklist[open]');
    if(checklist){if(checklist.dataset.ready==='true')checklist.querySelector('.q-match-checklist-paper')?.click();else await new Promise(r=>setTimeout(r,80));continue;}
    const buttons=[...(surface||document).querySelectorAll('button')].filter(b=>!b.disabled);
    let button=buttons.find(b=>b.textContent==='显示完整')||buttons.find(b=>b.closest('.scene-current-step,.scene-fixed-reply'));
    if(!button){const choices=buttons.filter(b=>b.closest('.hogwarts-device-choices'));button=choices[Math.min(branch,choices.length-1)];}
    button ||= buttons.find(b=>/^(继续|展开羊皮纸|收下饮料券|把纸条折起来|查看结局|返回今日行程|陪他坐一会儿)/.test(b.textContent));
    if(!button&&!surface){
     button=buttons.find(b=>b.textContent==='去上课')||buttons.find(b=>b.textContent==='打开猫头鹰信箱'||b.textContent==='查看池昌民的来信')||buttons.find(b=>b.classList.contains('hogwarts-activity'));
     button ||= buttons.find(b=>b.classList.contains('hogwarts-device-back'));
     if(!button){const contact=document.querySelector('.hogwarts-contact[aria-pressed=true]');contact?.click();}
    }
    button?.click();
   }
   throw Error('Q day '+day+' branch '+branch+' stalled: '+document.body.innerText.slice(-2200));
  },{day,branch});
  results.push({day,branch,...result});console.log('PASS Q day',day,'branch',branch,'steps',result.steps);
  await context.close();
 }
 for(const kind of ['together','friends','unspoken']){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  if(process.env.ONLINE_FETCH){const {attach}=await import('../work/trusted-online-fetch.mjs');await attach(context);}
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+`?preview=q-ending-${kind}`);
  const result=await page.evaluate(async()=>{
   let fireworks=false;for(let i=0;i<900;i++){
    await new Promise(r=>setTimeout(r,2));fireworks ||= document.body.innerText.includes('烟花');
    const ending=document.querySelector('.hogwarts-ending');if(ending)return {kind:ending.dataset.kind,fireworks};
    const surface=document.querySelector('dialog[open]')||document;
    const buttons=[...surface.querySelectorAll('button')].filter(b=>!b.disabled);
    (buttons.find(b=>b.textContent==='显示完整')||buttons.find(b=>b.closest('.scene-current-step,.scene-fixed-reply'))||buttons.find(b=>b.closest('.hogwarts-device-choices'))||buttons.find(b=>/继续|查看结局/.test(b.textContent))||buttons.find(b=>b.classList.contains('hogwarts-activity')))?.click();
   }throw Error(document.body.innerText.slice(-1000));
  });
  assert.equal(result.kind,kind);assert.ok(result.fireworks);assert.equal(await page.evaluate(()=>localStorage.getItem('foundphone-hogwarts-identity-v1')),null);
  console.log('PASS isolated Q ending',kind);await context.close();
 }
 assert.deepEqual(errors,[]);
 writeFileSync('work/q-verification-results.json',JSON.stringify({paths,results,errors},null,2));
}finally{await browser.close();}
