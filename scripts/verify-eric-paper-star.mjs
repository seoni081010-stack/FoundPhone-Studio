import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const day=JSON.parse(readFileSync('stories/eric.json','utf8'))[7];
const beat=day.beats.findIndex(b=>b.kind==='lines'&&b.lines[0]?.body.startsWith('你也完成了自己的第一颗星星。'));
assert.ok(beat>0);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const errors=[];
for(const branch of [0,1]){
 const context=await browser.newContext({viewport:branch?{width:1366,height:900}:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 const key='hogwarts-eric-v1:star-check';
 async function seed(extra={}){
  await page.goto(base);await page.evaluate(({key,beat,branch,extra})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'星星核验',house:'ravenclaw',year:7,loveInterest:'eric',runId:'star-check'}));
   localStorage.setItem(key,JSON.stringify({day:8,beat,cursor:{position:0},affinity:branch?1:2,choiceHistory:{[`8:${beat-1}`]:branch},clues:[],open:true,...extra}));
  },{key,beat,branch,extra});
  await enter();
 }
 async function enter(){await page.goto(base);await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('#eric-scene-title').waitFor();}
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 await seed();
 const popup=page.getByRole('dialog',{name:'漂浮的浅蓝色纸星星'});
 await popup.waitFor();assert.equal(await popup.locator('button').count(),0);
 const start=(await save()).ericPaperStar.startedAt;
 const waitUntil=ms=>page.waitForTimeout(Math.max(0,start+ms-Date.now()));
 const star=popup.locator('.eric-paper-star-float'),spell=popup.locator('.eric-paper-star-spell');
 assert.equal(await star.locator('svg').isVisible(),true);
 const initial=await star.evaluate(e=>getComputedStyle(e).transform);
 assert.equal(await spell.evaluate(e=>Number(getComputedStyle(e).opacity)),0);
 await waitUntil(1000);assert.equal(await star.evaluate(e=>getComputedStyle(e).transform),initial);
 await page.keyboard.press('Escape');assert.equal(await popup.isVisible(),true);
 await page.screenshot({path:`work/eric-star-still-${branch}.png`});
 await waitUntil(3500);
 assert.ok(await spell.evaluate(e=>Number(getComputedStyle(e).opacity))>.8);
 assert.equal(await spell.textContent(),'Wingardium Leviosa');
 assert.equal(await spell.evaluate(e=>getComputedStyle(e).fontStyle),'italic');
 await page.screenshot({path:`work/eric-star-spell-${branch}.png`});
 await waitUntil(5700);
 assert.equal(await spell.evaluate(e=>Number(getComputedStyle(e).opacity)),0);
 const persisted=await save();assert.equal(persisted.cursor.position,0);
 await waitUntil(6500);
 assert.notEqual(await star.evaluate(e=>getComputedStyle(e).transform),initial);
 await page.screenshot({path:`work/eric-star-rising-${branch}.png`});
 await enter();assert.equal((await save()).ericPaperStar.startedAt,persisted.ericPaperStar.startedAt);
 await popup.waitFor({state:'detached',timeout:6500});
 assert.equal((await save()).cursor.position,1);assert.equal((await save()).ericPaperStar.done,true);
 assert.equal((await save()).affinity,branch?1:2);
 await page.locator('.scene-current-step').evaluate(step=>{const button=step.querySelector('button');if(button?.textContent==='显示完整台词')button.click();});
 assert.equal(await page.locator('.scene-current-step .hogwarts-message p').textContent(),'诶，你这个挺好看的。');
 const text=await page.locator('.scene-dialogue').innerText();
 assert.ok(text.includes('你也完成了自己的第一颗星星。'));
 assert.ok(!text.includes('它是一颗浅蓝色的五角星'));assert.ok(!text.includes('慢慢划过一道弧线'));
 await enter();assert.equal(await popup.count(),0);assert.equal((await save()).cursor.position,1);
 // Old saves already at the following speech neither replay nor change cursor/points.
 await seed({cursor:{position:1},ericPaperStar:undefined});assert.equal(await popup.count(),0);
 assert.equal((await save()).affinity,branch?1:2);
 console.log('PASS Eric Day8 star',branch,'stationary/spell/float/auto-resume/refresh/old saves/unchanged points');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
