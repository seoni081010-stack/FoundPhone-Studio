import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const d24=JSON.parse(readFileSync('stories/younghoon-21.json','utf8')).find(d=>d.day===24);
const d26=JSON.parse(readFileSync('stories/younghoon-25.json','utf8')).find(d=>d.day===26);
const arrivalBeat=d24.beats.findIndex(b=>b.kind==='lines'&&b.lines.some(l=>l.body.startsWith('夜幕降临时')));
let step=-1,narration=false;
for(const l of d24.beats[arrivalBeat].lines){if(l.speaker||!narration)step++;narration=!l.speaker;if(l.body.startsWith('夜幕降临时'))break;}
for(const fixture of [{day:24,beat:arrivalBeat,cursor:{position:step},time:'16:00',open:true,done:false,expected:'19:00'},
 {day:26,beat:d26.beats.length,cursor:{position:0},time:'14:10',open:false,done:true,expected:'16:00'}]){
 const c=await b.newContext({serviceWorkers:'block'});const p=await c.newPage();await p.goto(base);
 await p.evaluate(f=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'核验',house:'ravenclaw',year:6,loveInterest:'younghoon',runId:'time-save-check'}));
  localStorage.setItem('hogwarts-younghoon-v1:time-save-check',JSON.stringify({...f,clues:[],affinity:32}));
 },fixture);
 for(let i=0;i<2;i++){
  await p.goto(base);await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
  await p.waitForFunction(expected=>JSON.parse(localStorage.getItem('hogwarts-younghoon-v1:time-save-check')).time===expected,fixture.expected);
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('hogwarts-younghoon-v1:time-save-check')));
  assert.equal(saved.beat,fixture.beat);assert.equal(saved.cursor.position,fixture.cursor.position);assert.equal(saved.affinity,32);
  assert.match(await p.locator('.hogwarts-device-top').innerText(),new RegExp(fixture.expected));
 }
 console.log('PASS scene time/cursor refresh',fixture.day,fixture.expected);await c.close();
}
await b.close();
