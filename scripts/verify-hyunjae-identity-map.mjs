import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom'});
const h=await server.ssrLoadModule('/src/runtime/hyunjaeExpandedStory.ts');
const legacyWager=h.hyunjaeDay(12).beats.findIndex(b=>b.kind==='wager');
const id={house:'gryffindor',year:7};const places=new Map();
for(let day=1;day<=31;day++){
 const p={day,beat:0,cursor:{position:0},clues:[],affinity:0,open:false,...h.hyunjaePreviewProgress(day)};
 const story=h.hyunjaeDay(day);
 for(let i=0;i<story.beats.length;i++){
  const beat=story.beats[i];if(!beat.when.every(c=>h.hyunjaeCondition(c,p,id)))continue;
  if(beat.kind==='choice')p.hyunjaeChoices[beat.id]=0;
  if(beat.kind==='wager'){p.team='斯莱特林';p.wagerStake=1;}
  if(beat.channel==='scene'&&beat.hyunjaePresent&&!beat.place.includes('魔法相册')&&!places.has(beat.place))places.set(beat.place,{...structuredClone(p),day,beat:i,time:beat.time,place:beat.place,open:false});
 }
}
await server.close();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';const errors=[];
try{
 for(const [house,year,expected]of [['gryffindor',7,'我就说怎么看着这么眼熟'],['ravenclaw',7,'身份核验？这本书是你的'],['gryffindor',5,'我记得在休息室见过你'],['ravenclaw',5,'格兰芬多七年级，李贤在']]){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.evaluate(({house,year})=>localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'身份核验',house,year,loveInterest:'hyunjae',runId:`hy-id-${house}-${year}`})),{house,year});
  await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.getByRole('button',{name:/16:40.*忘在教室的书/}).click();
  const block=p.locator('.scene-narration-block');await block.waitFor();assert.ok((await block.innerText()).includes('天色比前几日暗得更早'));
  assert.equal(await p.getByRole('button',{name:'显示完整旁白',exact:true}).count(),0);
  const found=await p.evaluate(async expected=>{let fixed=0;for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,0));const d=document.querySelector('dialog[open]');if(d?.textContent.includes(expected))return fixed;const b=d?.querySelector('.scene-current-step button,.scene-fixed-reply button');if(b){if(b.closest('.scene-fixed-reply'))fixed++;b.click();}}throw Error(document.body.innerText);},expected);
  assert.ok(found>0);console.log('PASS identity branch, instant narration, typed dialogue and clickable fixed replies',house,year);await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 for(const [place,fixture]of places){
  await p.goto(base);await p.evaluate(f=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'地图核验',house:'gryffindor',year:7,loveInterest:'hyunjae',runId:'hy-map'}));
   localStorage.setItem('hogwarts-hyunjae-expanded-v1:hy-map',JSON.stringify(f));
  },fixture);
  await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
  await p.getByRole('button',{name:'巫师手札',exact:true}).click();await p.getByRole('button',{name:'打开活点地图',exact:true}).click();
  await p.getByRole('button',{name:'展开羊皮卷轴',exact:true}).click();await p.getByRole('button',{name:'我庄严宣誓，我不干好事',exact:true}).evaluate(e=>e.click());
  const marker=p.locator('[data-person=hyunjae]');await marker.waitFor();assert.equal(await marker.getAttribute('data-place'),place);
  assert.equal(await marker.getAttribute('data-mapped'),'true');assert.ok((await p.locator('.marauder-signature').innerText()).includes(fixture.time));
  console.log('PASS Hyunjae map scene',fixture.day,fixture.time,place);
 }
 await context.close();
 const legacyContext=await browser.newContext({serviceWorkers:'block'}),legacy=await legacyContext.newPage();
 await legacy.goto(base);await legacy.evaluate(()=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'旧档核验',house:'gryffindor',year:7,loveInterest:'hyunjae',runId:'hy-legacy'}));
  localStorage.setItem('hogwarts-match-v1:hy-legacy',JSON.stringify({step:'done',team:'斯莱特林',stake:7,visitedPub:true}));
  localStorage.setItem('foundphone-hogwarts-shopping-v1-hy-legacy',JSON.stringify({wallet:93,vault:100000,inventory:{},gifts:{},vaultUpgrade:true,paid:[7,14,21,28]}));
  localStorage.setItem('foundphone-album-notices-v1-hy-legacy-hyunjae',JSON.stringify({acknowledged:['photo-snow'],completedDays:[6]}));
 });
 await legacy.reload();await legacy.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await legacy.waitForFunction(()=>JSON.parse(localStorage.getItem('hogwarts-hyunjae-expanded-v1:hy-legacy')||'null')?.hyunjaeMigrated);
 const migrated=await legacy.evaluate(()=>JSON.parse(localStorage.getItem('hogwarts-hyunjae-expanded-v1:hy-legacy')));
 assert.ok(migrated.clues.includes('photo-snow'));assert.equal(migrated.team,'斯莱特林');assert.equal(migrated.wagerStake,7);assert.equal(migrated.wagerClaimed,true);
 await legacy.evaluate(wager=>{const key='hogwarts-hyunjae-expanded-v1:hy-legacy';localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)),day:12,beat:wager,cursor:{position:0},open:true,done:false}));},legacyWager);
 await legacy.reload();await legacy.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await legacy.waitForFunction(wager=>JSON.parse(localStorage.getItem('hogwarts-hyunjae-expanded-v1:hy-legacy')).beat>wager,legacyWager);
 assert.equal(await legacy.locator('#match-wager-title').count(),0);
 assert.equal(await legacy.evaluate(()=>JSON.parse(localStorage.getItem('foundphone-hogwarts-shopping-v1-hy-legacy')).wallet),93);
 assert.deepEqual(await legacy.evaluate(()=>JSON.parse(localStorage.getItem('hogwarts-match-v1:hy-legacy'))),{step:'done',team:'斯莱特林',stake:7,visitedPub:true});
 console.log('PASS legacy album and paid wager migration; no repeat stake or old-save overwrite');
 await legacyContext.close();assert.deepEqual(errors,[]);
}finally{await browser.close();}
