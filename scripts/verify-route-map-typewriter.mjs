import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const days=[1,5,9,13,17,21,25].flatMap(n=>JSON.parse(readFileSync(`stories/younghoon-${String(n).padStart(2,'0')}.json`,'utf8')));
const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await c.newPage();
for(const day of (process.env.TYPEWRITER_ONLY?[]:days)){
 const stages=[day.schedule,...day.beats.flatMap(beat=>beat.schedule?[beat.schedule]:[])];
 if(day.day===24)stages.push('12月24日 · 19:00 · 霍格沃茨礼堂外');
 for(const schedule of new Set(stages)){
  const [,time,place]=schedule.split(' · ');
  await p.goto(base);await p.evaluate(({day,time})=>{
   localStorage.clear();
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'核验',house:'ravenclaw',year:6,loveInterest:'younghoon',runId:'map-check'}));
   localStorage.setItem('hogwarts-younghoon-v1:map-check',JSON.stringify({day,beat:0,cursor:{position:0},clues:[],affinity:0,open:false,time}));
  },{day:day.day,time});
  await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
  await p.getByRole('button',{name:'巫师手札',exact:true}).click();
  await p.getByRole('button',{name:'打开活点地图',exact:true}).click();
  await p.getByRole('button',{name:'展开羊皮卷轴'}).click();
  await p.getByRole('button',{name:'我庄严宣誓，我不干好事'}).evaluate(e=>e.click());
  const marker=p.locator('[data-person="younghoon"]');
  assert.equal(await marker.getAttribute('data-place'),place,`${day.day} ${time}`);
  assert.notEqual(await marker.getAttribute('transform'),'translate(180 280)',place);
  assert.equal(await p.locator('[data-person]').count(),7);
  assert.match(await p.locator('.marauder-signature').innerText(),new RegExp(`12月${day.day}日 · ${time} · 金泳勋 · ${place}`));
 }
 console.log('PASS map day',day.day,'stages',new Set(stages).size);
}
await c.close();
for(const mode of ['hyunjae-day31','q-day31','jcode-day21','younghoon-day25']){
 const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 await p.goto(base+'?preview='+mode);await p.getByRole('dialog').first().waitFor();
 const advance=p.getByRole('button',{name:'显示完整旁白',exact:true});
 await advance.waitFor();
 const current=p.locator('.scene-current-step .scene-narration-block');
 await p.waitForTimeout(130);const short=await current.innerText();assert.ok(short.length>0);
 await advance.click();const full=await current.innerText();assert.ok(full.length>short.length,mode);
 if(mode.startsWith('jcode-')||mode.startsWith('younghoon-'))assert.ok((await current.locator('p').count())>1,mode+' groups consecutive paragraphs');
 await p.getByRole('button',{name:'继续',exact:true}).last().click();
 console.log('PASS shared typed narration',mode,'partial',short.length,'full',full.length);
 await p.close();
}
await b.close();
