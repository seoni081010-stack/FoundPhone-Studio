import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('stories/jcode-expanded.json'));
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
async function drive(page,config){return page.evaluate(async config=>{
 let fixed=0,choices=0,clues=0,wishes=0,fireworks=false;
 for(let i=0;i<15000;i++){
  await new Promise(r=>setTimeout(r,0));
  const end=document.querySelector('.hogwarts-ending');
  if(end)return {kind:end.dataset.kind,text:end.innerText,fixed,choices,clues,wishes,fireworks};
  const saved=config.key?JSON.parse(localStorage.getItem(config.key)||'null'):null;
  if(saved?.done&&config.day<31)return {saved,fixed,choices,clues,wishes,fireworks};
  const paper=document.querySelector('.library-paper-note[open]');
  if(paper){if(paper.dataset.ready==='true')paper.click();else await new Promise(r=>setTimeout(r,40));continue;}
  if(document.querySelector('.winter-wish-tag[data-submitted=true]')){await new Promise(r=>setTimeout(r,40));continue;}
  const dialog=document.querySelector('dialog[open]');
  const surface=dialog||document.querySelector('.sunwoo-mail-scene');
  if(/烟花.*(?:城堡|庭院)/.test(surface?.textContent||''))fireworks=true;
  if(surface && /心动\s*\+|好感度\s*\+/.test(surface.textContent))throw Error('Score toast leaked into story');
  if(surface?.textContent.includes('{{'))throw Error('Unexpanded player or memory token');
  if(surface?.classList.contains('hogwarts-wager')){
   if(surface.querySelector('.hogwarts-message,img'))throw Error('Character dialogue inside shared paper');
   const team=surface.querySelector(`[data-team="${config.team||'斯莱特林'}"]`);
   if(team && team.getAttribute('aria-pressed')!=='true'){team.click();continue;}
   const submit=[...surface.querySelectorAll('button')].find(b=>b.textContent==='就押这个');
   if(submit){submit.click();continue;}
   surface.querySelector('button').click();continue;
  }
  const wish=surface?.querySelector('.hyunjae-wish textarea');
  if(wish){
   if(!wish.value){Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(wish,'愿我们都能勇敢地走向喜欢的未来。');wish.dispatchEvent(new Event('input',{bubbles:true}));}
   else{surface.querySelector('button[type=submit]').click();wishes++;}
   continue;
  }
  if(surface){
   if(surface.querySelector('h2')?.textContent==='魔法相册解锁新内容'){
    const event=new Event('cancel',{cancelable:true});surface.dispatchEvent(event);
    if(!surface.open)throw Error('Album notice escaped without acknowledging');
    clues++;surface.querySelector('button').click();continue;
   }
   const step=surface.querySelector('.scene-current-step button');if(step){step.click();continue;}
   const reply=surface.querySelector('.scene-fixed-reply button');if(reply){reply.click();fixed++;continue;}
   const maker=surface.querySelector('.jacob-card-maker');
   if(maker){const area=maker.querySelector('textarea');if(!area.value){Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(area,'愿你每一天都能做自己喜欢的事情。');area.dispatchEvent(new Event('input',{bubbles:true}));}else maker.querySelector('button[type=submit]').click();continue;}
   const cards=surface.querySelectorAll('.jacob-trading-cards button');if(cards.length){if(cards.length!==3)throw Error('Missing collectible card');cards[1].click();continue;}
   const options=surface.querySelectorAll('.hogwarts-device-choices button');
   if(options.length){options[Math.min(config.middle?(choices%4===0?1:0):(config.branch||0),options.length-1)].click();choices++;continue;}
   const next=[...surface.querySelectorAll('button')].find(b=>!b.disabled&&/继续|查看结局|返回信箱/.test(b.textContent));
   if(next){next.click();continue;}
  }
  const mail=[...document.querySelectorAll('button')].find(b=>!b.disabled&&b.textContent==='打开猫头鹰信箱');
  if(mail){mail.click();continue;}
  const scene=[...document.querySelectorAll('.hogwarts-today .hogwarts-activity')].find(b=>!b.disabled);
  if(scene){scene.click();continue;}
  const lesson=[...document.querySelectorAll('button')].find(b=>!b.disabled&&b.textContent==='去上课');
  if(lesson){lesson.click();continue;}
  const back=document.querySelector('.hogwarts-device-back');if(back){back.click();continue;}
 }
 throw Error('Cannot finish '+JSON.stringify(config)+'\n'+document.body.innerText.slice(-1300));
},config);}
try{
 for(const mode of (process.env.PREVIEWS_ONLY?[]:process.env.CAMPAIGN?[process.env.CAMPAIGN]:['high','low','friends'])){
  const context=await browser.newContext({viewport:mode==='high'?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const run='jacob-expanded-'+mode,key=`hogwarts-jacob-expanded-v1:${run}`;
  await page.goto(base);await page.evaluate(({run,mode})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'完整核验',house:mode==='low'?'ravenclaw':'gryffindor',year:mode==='low'?5:mode==='friends'?6:7,loveInterest:'jacob',runId:run}));
   localStorage.setItem(`foundphone-hogwarts-shopping-v1-${run}`,JSON.stringify({wallet:1000,vault:100000,inventory:{},gifts:{},vaultUpgrade:true}));
  },{run,mode});
  await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByRole('button',{name:'巫师手札',exact:true}).waitFor();
  let fixed=0,choices=0,clues=0,wishes=0;
  for(let day=1;day<=31;day++){
   const result=await drive(page,{day,key,branch:mode==='low'?1:0,middle:mode==='friends',team:mode==='low'?'格兰芬多':'斯莱特林'});
   fixed+=result.fixed;choices+=result.choices;clues+=result.clues;wishes+=result.wishes;
   const saved=result.saved||JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
   const beats=day===31?data.endings[saved.ending].beats:data.days[day-1].beats;
   assert.equal(saved.jacobRawAffinity,Object.entries(saved.choiceHistory||{}).reduce((sum,[id,index])=>{const [d,b]=id.split(':').map(Number);const beats=d===31?data.endings[saved.ending].beats:data.days[d-1].beats;return sum+(beats[b].options[index].affinity||0);},0));
   if(day===13)assert.equal(saved.jacobCard.submitted,true);if(day===18&&mode==='high')assert.equal(saved.jacobTradingCard,'忒修斯·斯卡曼德');assert.equal(saved.affinity,Math.round(saved.jacobRawAffinity/data.maximumRawAffinity*100000000)/1000000);
   if(day===31){assert.equal(result.kind,mode==='friends'?'friends':mode==='high'?'together':'unspoken');assert.ok(result.fireworks);assert.equal(saved.ending,result.kind);console.log('PASS complete campaign',mode,{fixed,choices,clues,wishes,affinity:saved.affinity,ending:result.kind});break;}
   const before=JSON.stringify(saved);
   await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByRole('button',{name:'巫师手札',exact:true}).waitFor();
   assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).affinity,key),saved.affinity);
   assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).day,key),day);
   let lateLessons=0;
   for(const lesson of await page.getByRole('button',{name:'去上课',exact:true}).all())if(await lesson.isEnabled()){await lesson.click();lateLessons++;}
   if(lateLessons){const time=await page.locator('.hogwarts-device-top').innerText();await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByRole('button',{name:'巫师手札',exact:true}).waitFor();assert.equal(await page.locator('.hogwarts-device-top').innerText(),time);}
   await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='结束这一天'&&!b.disabled),{},{timeout:5000}).catch(async e=>{throw Error(e.message+'\n'+await page.locator('body').innerText()+'\n'+await page.evaluate(key=>localStorage.getItem(key),key));});
   await page.getByRole('button',{name:'结束这一天',exact:true}).click();
   console.log('PASS day',day,mode,'beats',beats.length,'save bytes',before.length);
  }
  await context.close();
 }
 for(const kind of ['together','friends','unspoken']){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.evaluate(()=>localStorage.setItem('hogwarts-jacob-expanded-v1:normal-save','unchanged'));
  await page.goto(base+`?preview=jcode-ending-${kind}`);
  const result=await drive(page,{day:31,branch:0});assert.equal(result.kind,kind);assert.ok(result.fireworks);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hogwarts-jacob-expanded-v1:normal-save')),'unchanged');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('hogwarts-jacob-expanded-v1:review-'))),false);
  await page.getByRole('button',{name:'盖上结局印章',exact:true}).click();
  assert.equal(await page.locator('.ending-seal-caption').count(),1);
  await page.getByRole('button',{name:'返回',exact:true}).click();
  assert.ok((await page.locator('.hogwarts-today').innerText()).includes('12月31日'));
  assert.equal(await page.getByRole('button',{name:'查看结局',exact:true}).count(),1);
  console.log('PASS independent preview, ending seal, return schedule and normal-save isolation',kind);await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
