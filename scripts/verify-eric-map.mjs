import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const days=JSON.parse(readFileSync('stories/eric.json','utf8'));
const ending=JSON.parse(readFileSync('stories/eric-endings.json','utf8')).together;
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});const p=await c.newPage();
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const errors=[];p.on('pageerror',e=>errors.push(e.message));let count=0;
for(const day of [...days,ending]){
 const stages=[...new Map(day.beats.map((beat,index)=>[`${beat.time}|${beat.place}`,{...beat,index}]).filter(([,beat])=>beat.channel==='scene')).values()];
 for(const stage of stages){
  await p.goto(base);await p.evaluate(({day,stage})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'eric',runId:'eric-map-check'}));
   localStorage.setItem('hogwarts-eric-v1:eric-map-check',JSON.stringify({day:day.day,beat:stage.index,cursor:{position:0},clues:[],affinity:0,open:false,time:stage.time,ending:day.day===31?'together':undefined}));
  },{day,stage});
  await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
  await p.getByRole('button',{name:'巫师手札',exact:true}).click();await p.getByRole('button',{name:'打开活点地图',exact:true}).click();
  await p.getByRole('button',{name:'展开羊皮卷轴'}).click();await p.getByRole('button',{name:'我庄严宣誓，我不干好事'}).evaluate(e=>e.click());
  const marker=p.locator('[data-person="eric"]');assert.equal(await marker.getAttribute('data-place'),stage.place);
  assert.notEqual(await marker.getAttribute('transform'),'translate(180 280)');assert.equal(await p.locator('[data-person]').count(),7);
  const header=await p.locator('.marauder-signature').innerText();assert.ok(header.includes(`${stage.time} · 孙英宰 · ${stage.place}`));count++;
 }
 console.log('PASS map',day.day,stages.length);
}
await b.close();assert.deepEqual(errors,[]);console.log('PASS all scene map markers',count);
