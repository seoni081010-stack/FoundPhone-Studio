import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const endings=JSON.parse(readFileSync('stories/juyeon-endings.json','utf8'));
const gate=endings.together.beats.findIndex(b=>b.endingGate);
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4181/';
for(const [score,kind]of [[0,'unspoken'],[79,'unspoken'],[80,'friends'],[99,'friends'],[100,'together'],[250,'together']]){
 const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();await p.goto(base);
 const key='hogwarts-juyeon-v1:gate';
 await p.evaluate(({key,score,gate})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'边界核对',house:'hufflepuff',year:5,loveInterest:'juyeon',runId:'gate'}));
  localStorage.setItem(key,JSON.stringify({day:31,beat:gate,cursor:{position:0},affinity:score,clues:['juyeon-31'],open:true}));
 },{key,score,gate});
 await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('#juyeon-scene-title').waitFor();
 const saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(saved.ending,kind);assert.equal(saved.affinity,score);
 const body=await p.locator('body').innerText();for(const [other,data]of Object.entries(endings))if(other!==kind)assert.ok(!body.includes(data.ending.text));
 console.log('PASS unchanged 80/100 ending gate',score,kind);await c.close();
}
await b.close();
