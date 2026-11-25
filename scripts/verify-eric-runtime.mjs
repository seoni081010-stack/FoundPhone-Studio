import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const days=JSON.parse(readFileSync('stories/eric.json','utf8'));
const endings=JSON.parse(readFileSync('stories/eric-endings.json','utf8'));
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
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
   if(document.querySelector('.star-wish-paper,.truth-parchment,.eric-paper-star'))continue;
   const dialog=document.querySelector('dialog[open]');
   const inline=document.querySelector('.eric-mail-scene');
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
    if(config.branch===0 && config.day===19 && surface.textContent.includes('刚才听你说想做一个放在床边的。'))throw Error('B-only lamp premise on path A');
    if(surface.textContent.includes('{{playerName}}'))throw Error('unsubstituted player name');
    const step=surface.querySelector('.scene-current-step button');if(step){click(step);continue;}
    const fixedReply=surface.querySelector('.scene-fixed-reply button');if(fixedReply){fixed++;click(fixedReply);continue;}
    const options=surface.querySelectorAll('.hogwarts-device-choices button');
    if(options.length){choices++;click(options[config.branch??0]);continue;}
    const finish=surface.querySelector('.hogwarts-continue-day');if(finish){click(finish);if(config.previewDay)return {done:true,clicks,fixed,choices,clues};continue;}
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
for(const mode of (process.env.PREVIEWS_ONLY?[]:process.env.CAMPAIGN?[process.env.CAMPAIGN]:['low','high'])){
 const context=await browser.newContext({viewport:mode==='high'?{width:1366,height:900}:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const run=`eric-campaign-${mode}`;const key=`hogwarts-eric-v1:${run}`;
 await page.goto(base);await page.evaluate(run=>localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'eric',runId:run})),run);
 await open(page);
 let totalClues=0,totalFixed=0,totalChoices=0;
 for(let day=1;day<=31;day++){
  const result=await drive(page,{day,key,branch:mode==='high'?0:1,skipMail:false,team:mode==='low'?'格兰芬多':'斯莱特林'});
  totalClues+=result.clues;totalFixed+=result.fixed;totalChoices+=result.choices;
  if(day===31){
   const expected='together';
   assert.equal(result.ending,expected);assert.ok(result.text.includes(endings[expected].ending.text));
   await page.getByRole('button',{name:'返回',exact:true}).click();
   await page.getByRole('button',{name:'魔法相册',exact:true}).click();
   await page.getByText('比胜利更珍贵',{exact:true}).waitFor();
   const finalSave=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
   assert.equal(finalSave.affinity,mode==='high'?366:183);
   assert.deepEqual(finalSave.clues,['eric-1','eric-6','eric-20','eric-22','eric-24','eric-31']);
   console.log('PASS full campaign',mode,{totalClues,totalFixed,totalChoices,ending:expected});break;
  }
  const progress=result.saved || JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
  const all=[...days,endings.together];
  const expectedScore=Object.entries(progress.choiceHistory??{}).reduce((total,[key,index])=>{const [d,b]=key.split(':').map(Number);return total+all[d-1].beats[b].options[index].affinity;},0);
  assert.equal(progress.affinity,expectedScore);
  if(day===19)assert.ok(result.fixed>0);
  console.log('PASS',mode,'day',day,'choices',result.choices,'fixed',result.fixed,'clues',result.clues);
  if(!result.advanced){
   const back=page.locator('.hogwarts-device-back');if(await back.count())await back.click();
   await page.getByRole('button',{name:'结束这一天',exact:true}).click();
  }
  if(day===8){
   const saved=await page.evaluate(key=>localStorage.getItem(key),key);
   await open(page);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),saved);

  }
 }
 await context.close();
}
if(!process.env.CAMPAIGN)for(const kind of ['together','friends','unspoken'])for(const branch of [0,1]){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const formal=JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'younghoon',runId:'formal-preserved'});
 const formalProgress=JSON.stringify({day:24,beat:3,cursor:{position:1},clues:['younghoon-6'],affinity:47,open:false});
 await page.goto(base);await page.evaluate(({formal,formalProgress})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',formal);
  localStorage.setItem('hogwarts-younghoon-v1:formal-preserved',formalProgress);
  localStorage.setItem('hogwarts-eric-v1:formal-preserved',formalProgress);
 },{formal,formalProgress});
 await page.goto(base+'?preview=eric-ending-'+kind);
 await page.locator('.hogwarts-device-stage').waitFor();
 const size=await page.locator('.hogwarts-device-stage').boundingBox();assert.ok(size.width>380);
 const result=await drive(page,{day:31,branch});assert.equal(result.ending,kind);
 assert.ok(result.text.includes(endings[kind].ending.text));
 assert.equal(result.clues,kind==='together'?1:0);
 for(const [other,entry]of Object.entries(endings))if(other!==kind)assert.ok(!result.text.includes(entry.ending.text));
 assert.equal(await page.evaluate(()=>localStorage.getItem('foundphone-hogwarts-identity-v1')),formal);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hogwarts-younghoon-v1:formal-preserved')),formalProgress);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hogwarts-eric-v1:formal-preserved')),formalProgress);
 assert.equal(await page.locator('.ending-copy h2 + p').textContent(),endings[kind].ending.text);
 await page.screenshot({path:`work/eric-ending-${kind}-${branch}.png`});
 console.log('PASS independent preview',kind,branch);await context.close();
}
if(!process.env.CAMPAIGN)for(const day of [1,6,12,22,24]){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?preview=eric-day'+day);
 const before=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([key])=>!key.includes('review-eric-')))));
 const result=await drive(page,{day,branch:1,previewDay:true});assert.ok(result.done);
 assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([key])=>!key.includes('review-eric-'))))),before);
 console.log('PASS isolated day preview',day);await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
