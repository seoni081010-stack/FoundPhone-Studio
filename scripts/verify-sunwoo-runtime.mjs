import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const days=JSON.parse(readFileSync('stories/sunwoo.json','utf8'));
const endings=JSON.parse(readFileSync('stories/sunwoo-endings.json','utf8'));
const base=process.env.BASE_URL||'http://127.0.0.1:4180/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
async function open(page){await page.goto(base);await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();}
async function drive(page, config){
 return page.evaluate(async config=>{
  const sleep=()=>new Promise(r=>setTimeout(r,0));
  let clicks=0,fixed=0,choices=0,clues=0;
  for(let i=0;i<6000;i++){
   await sleep();
   const end=document.querySelector('.hogwarts-ending');
   if(end)return {ending:end.dataset.kind,text:end.innerText,clicks,fixed,choices,clues};
   const saved=config.key?JSON.parse(localStorage.getItem(config.key)||'null'):null;
   if(saved && saved.day>config.day)return {advanced:true,saved,clicks,fixed,choices,clues};
   if(saved && saved.done && config.day<31)return {done:true,saved,clicks,fixed,choices,clues};
   const writer=document.querySelector('.write-star-wish');
   if(writer){
    const input=writer.querySelector('textarea');
    if(input && !input.value){
     Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'愿我勇敢一点。');
     input.dispatchEvent(new Event('input',{bubbles:true}));
    }else{
     const submit=writer.querySelector('button:not([disabled])');
     if(submit)submit.click();
    }
    continue;
   }
   if(document.querySelector('.star-wish-paper,.truth-parchment'))continue;
   const dialog=document.querySelector('dialog[open]');
   const inline=document.querySelector('.sunwoo-mail-scene');
   const surface=dialog||inline;
   const click=button=>{button.click();clicks++;};
   if(dialog?.classList.contains('hogwarts-wager')){
    if(dialog.querySelector('.hogwarts-message,img'))throw Error('dialogue or portrait leaked into wager paper');
    const team=dialog.querySelector(`[data-team="${config.team||'斯莱特林'}"]`);
    if(team && team.getAttribute('aria-pressed')!=='true'){click(team);continue;}
    const submit=[...dialog.querySelectorAll('button')].find(b=>b.textContent.trim()==='就押这个');
    if(submit){click(submit);continue;}
    click([...dialog.querySelectorAll('button')].at(-1));continue;
   }
   if(dialog?.querySelector('h2')?.textContent==='魔法相册解锁新内容'){
    const event=new Event('cancel',{cancelable:true});dialog.dispatchEvent(event);
    if(!dialog.open)throw Error('clue dismissed without acknowledgement');
    clues++;click(dialog.querySelector('button'));continue;
   }
   if(surface){
    if(surface.textContent.includes('{{playerName}}'))throw Error('unsubstituted player name');
    const step=surface.querySelector('.scene-current-step button');if(step){click(step);continue;}
    const fixedReply=surface.querySelector('.scene-fixed-reply button');if(fixedReply){fixed++;click(fixedReply);continue;}
    const options=surface.querySelectorAll('.hogwarts-device-choices button');
    if(options.length){choices++;click(options[config.branch??0]);continue;}
    const finish=surface.querySelector('.hogwarts-continue-day');if(finish){click(finish);continue;}
   }
   if(config.skipMail){
    const endDay=document.querySelector('.hogwarts-end-day:not([disabled])');
    if(endDay){click(endDay);continue;}
   }
   const mail=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='打开猫头鹰信箱'&&!b.disabled);
   if(mail && !config.skipMail){click(mail);continue;}
   const back=document.querySelector('.hogwarts-device-back');if(back){click(back);continue;}
   const classButton=[...document.querySelectorAll('.hogwarts-agenda-row button')].find(b=>!b.disabled);
   if(classButton){click(classButton);continue;}
   const scene=[...document.querySelectorAll('.hogwarts-today button.hogwarts-activity')].find(b=>!b.disabled && /\d+:\d+/.test(b.textContent));
   if(scene){click(scene);continue;}
   if(i%100===0 && document.querySelector('body').textContent.includes('读取失败'))throw Error('work failed to load');
  }
  throw Error('Could not finish '+JSON.stringify(config)+'\n'+document.body.innerText.slice(-1500));
 },config);
}
for(const mode of (process.env.PREVIEWS_ONLY?[]:process.env.CAMPAIGN?[process.env.CAMPAIGN]:['low','middle','high'])){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const run=`sunwoo-campaign-${mode}`;const key=`hogwarts-sunwoo-v1:${run}`;
 await page.goto(base);await page.evaluate(run=>localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'sunwoo',runId:run})),run);
 await open(page);
 let totalClues=0,totalFixed=0,totalChoices=0;
 for(let day=1;day<=31;day++){
  const result=await drive(page,{day,key,branch:mode==='high'?0:1,skipMail:mode==='low'&&day<31,team:mode==='low'?'格兰芬多':'斯莱特林'});
  totalClues+=result.clues;totalFixed+=result.fixed;totalChoices+=result.choices;
  if(day===31){
   const expected=mode==='low'?'unspoken':mode==='middle'?'friends':'together';
   assert.equal(result.ending,expected);assert.ok(result.text.includes(endings[expected].ending.text));
   await page.getByRole('button',{name:'返回',exact:true}).click();
   await page.getByRole('button',{name:'魔法相册',exact:true}).click();
   await page.getByText(endings[expected].ending.title,{exact:true}).waitFor();
   console.log('PASS full campaign',mode,{totalClues,totalFixed,totalChoices,ending:expected});break;
  }
  console.log('PASS',mode,'day',day,'choices',result.choices,'fixed',result.fixed,'clues',result.clues);
  if(!result.advanced){
   const back=page.locator('.hogwarts-device-back');if(await back.count())await back.click();
   await page.getByRole('button',{name:'结束这一天',exact:true}).click();
  }
  if(day===8){
   const saved=await page.evaluate(key=>localStorage.getItem(key),key);
   await open(page);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),saved);
   if(mode==='low')assert.ok(Object.keys(JSON.parse(saved).mailBacklog).length>0);
  }
 }
 await context.close();
}
if(!process.env.CAMPAIGN)for(const kind of ['together','friends','unspoken']){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const formal=JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'younghoon',runId:'formal-preserved'});
 const formalProgress=JSON.stringify({day:24,beat:3,cursor:{position:1},clues:['younghoon-6'],affinity:47,open:false});
 await page.goto(base);await page.evaluate(({formal,formalProgress})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',formal);
  localStorage.setItem('hogwarts-younghoon-v1:formal-preserved',formalProgress);
 },{formal,formalProgress});
 await page.goto(base+'?preview=sunwoo-ending-'+kind);
 const result=await drive(page,{day:31,branch:1});assert.equal(result.ending,kind);
 assert.ok(result.text.includes(endings[kind].ending.text));
 for(const [other,entry]of Object.entries(endings))if(other!==kind)assert.ok(!result.text.includes(entry.ending.text));
 assert.equal(await page.evaluate(()=>localStorage.getItem('foundphone-hogwarts-identity-v1')),formal);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hogwarts-younghoon-v1:formal-preserved')),formalProgress);
 console.log('PASS independent preview',kind);await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
