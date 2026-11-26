import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom'});
const j=await server.ssrLoadModule('/src/runtime/jcodeStory.ts');
const y=await server.ssrLoadModule('/src/runtime/younghoonStory.ts');
const q=await server.ssrLoadModule('/src/runtime/routeWork.ts');
const {compileStory}=await server.ssrLoadModule('/src/story-engine/compiler.ts');
const hy=JSON.parse(readFileSync('stories/hyunjae/story.json'));
const qSave=q.qDayPreviewProgress(compileStory(hy).work,12);
const routes={jacob:JSON.parse(readFileSync('stories/jcode-expanded.json')).days,younghoon:y.younghoonDays,hyunjae:JSON.parse(readFileSync('stories/hyunjae-expanded.json')).days};
for(const name of ['sunwoo','juyeon','eric'])routes[name]=JSON.parse(readFileSync(`stories/${name}.json`));
await server.close();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const errors=[];let paperText;
try {
 for(const lead of [...Object.keys(routes),'q'].filter(id=>!process.env.MATCH_LEAD||process.env.MATCH_LEAD===id))for(const team of ['格兰芬多','斯莱特林']){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const run=`shared-match-${lead}-${team}`;
  const prefix=lead==='jacob'?'jcode':lead;
  const key=lead==='jacob'?`hogwarts-jacob-expanded-v1:${run}`:lead==='hyunjae'?`hogwarts-hyunjae-expanded-v1:${run}`:lead==='q'?`foundphone-q-day01-${run}`:`hogwarts-${prefix}-v1:${run}`;
  const day=routes[lead]?.find(d=>d.day===12);const wager=day?.beats.findIndex(b=>b.kind==='wager');

  await page.goto(base);
  await page.evaluate(({lead,run,key,wager,qSave})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'共同事件核验',house:'ravenclaw',year:6,loveInterest:lead,runId:run}));
   localStorage.setItem(key,JSON.stringify(lead==='q'?{...qSave,version:2}:{day:12,beat:wager,cursor:{position:0},clues:[],affinity:37,open:true}));
   localStorage.setItem(`foundphone-hogwarts-shopping-v1-${run}`,JSON.stringify({wallet:100,vault:100000,inventory:{},gifts:{},vaultUpgrade:true}));
  },{lead,run,key,wager,qSave});
  await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
  if(lead==='q'){
   await page.getByRole('button',{name:/和池昌民看魁地奇比赛|去看台找李贤在/}).click({timeout:5000}).catch(async e=>{throw Error(e.message+'\n'+await page.locator('body').innerText());});
   for(let i=0;i<500 && !await page.locator('#match-wager-title').count();i++){
    const buttons=page.locator('dialog[open] button');const text=await buttons.allTextContents();
    let target=buttons.filter({hasText:'显示完整'}).first();
    if(!await target.count())target=buttons.filter({hasText:/^继续$|展开羊皮纸/}).last();
    if(!await target.count())target=buttons.filter({hasText:text[0]||'__none__'}).first();
    if(await target.count())await target.evaluate(e=>e.click()).catch(()=>{});else await page.waitForTimeout(10);
   }
  }
  const paper=page.locator('.hogwarts-wager');await paper.waitFor();
  const text=await paper.innerText();if(paperText===undefined)paperText=text;else assert.equal(text,paperText,lead+' must use exactly the shared paper');
  assert.equal(await paper.locator('.hogwarts-message,img').count(),0);
  await paper.locator(`[data-team="${team}"]`).click();
  const range=paper.locator('input[type=range]');await range.focus();await range.press('Home');for(let i=0;i<6;i++)await range.press('ArrowRight');
  assert.equal(await range.inputValue(),'7');
  const walletKey=`foundphone-hogwarts-shopping-v1-${run}`;
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).wallet,walletKey);
  await paper.getByRole('button',{name:'就押这个',exact:true}).click();
  await page.waitForFunction(({key,lead,wager})=>{const p=JSON.parse(localStorage.getItem(key));return lead==='q'?p?.match?.step==='ready':p?.beat>wager;},{key,lead,wager});
  for(let reload=0;reload<2;reload++){
   await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
   assert.equal(lead==='q'?saved.match.team:saved.team,team);
   assert.equal(lead==='q'?saved.match.stake:saved.wagerStake,7);
   assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).wallet,walletKey),before-7);
   assert.equal(await page.locator('#match-wager-title').count(),0);
  }
  console.log('PASS shared paper, stake 7, single deduction and two refreshes',lead,team);await context.close();
 }
 for(const preview of ['hyunjae-day31','jcode-ending-together','jcode-ending-friends','jcode-ending-unspoken']){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'?preview='+preview);
  const seen=await page.evaluate(async()=>{
   let fireworks=false;
   for(let i=0;i<2500;i++){
    await new Promise(r=>setTimeout(r,0));
    const surface=document.querySelector('dialog[open]')||document.querySelector('.hyunjae-mail-scene,.sunwoo-mail-scene');
    if(surface?.textContent.includes('烟花'))fireworks=true;
    if(document.querySelector('.hogwarts-ending'))return {fireworks,kind:document.querySelector('.hogwarts-ending').dataset.kind};
    const button=surface?.querySelector('.scene-current-step button,.scene-fixed-reply button,.scene-choices button,.hogwarts-device-choices button')
      ||[...surface?.querySelectorAll('button')||[]].find(b=>!b.disabled&&/继续|查看结局/.test(b.textContent))
      ||[...document.querySelectorAll('.hogwarts-device-choices button')].find(b=>!b.disabled)
      ||[...document.querySelectorAll('button')].find(b=>!b.disabled&&(b.textContent==='查看结局'||b.textContent==='打开猫头鹰信箱'));
    button?.click();
   }
   throw Error('Finale did not finish: '+document.body.innerText.slice(-1000));
  });
  assert.ok(seen.fireworks,preview);if(preview.startsWith('jcode'))assert.equal(seen.kind,preview.split('-').at(-1));
  console.log('PASS fireworks before ending',preview,seen.kind);await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
