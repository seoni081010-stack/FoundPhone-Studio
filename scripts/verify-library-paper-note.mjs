import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
try{
 for(const viewport of [{width:390,height:844},{width:1366,height:900}]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const run='library-note-'+viewport.width,key=`hogwarts-hyunjae-expanded-v1:${run}`;
  await page.goto(base);
  await page.evaluate(({run,key})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'纸条核验',house:'ravenclaw',year:5,loveInterest:'hyunjae',runId:run}));
   localStorage.setItem(key,JSON.stringify({day:4,beat:4,cursor:{position:1},clues:[],affinity:7,open:true,hyunjaeChoices:{},hyunjaeMigrated:true}));
  },{run,key});
  const enter=async()=>{await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByRole('button',{name:'巫师手札',exact:true}).waitFor();};
  await enter();
  assert.equal(await page.locator('.library-paper-note').count(),0,'must wait for the pushing narration');
  await page.locator('.scene-current-step button').click();
  await page.locator('.scene-current-step button').click();
  const paper=page.locator('.library-paper-note[open]');await paper.waitFor();
  assert.equal(await paper.locator('p').count(),2);
  await paper.click({position:{x:5,y:5}});
  assert.equal(await paper.count(),1,'early clicks cannot dismiss');
  await page.keyboard.press('Escape');assert.equal(await paper.count(),1,'Escape cannot skip');
  await page.waitForFunction(()=>document.querySelector('.library-paper-note-first')?.textContent==='刚才是你先笑的');
  assert.equal(await paper.locator('.library-paper-note-second').textContent(),'','second line waits for first');
  await page.locator('.library-paper-note[data-ready=true]').waitFor();
  assert.equal(await paper.locator('.library-paper-note-second').textContent(),'明明是你先给我看的');
  await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.fonts.check('25px "Library Neat"','明明是你先给我看的')));
  assert.equal(await page.evaluate(async()=>(await document.fonts.load('29px "Library Playful"','刚才是你先笑的')).length),1);
  assert.equal(await page.evaluate(async()=>(await document.fonts.load('25px "Library Neat"','明明是你先给我看的')).length),1);
  const fonts=await paper.locator('p').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).fontFamily));
  assert.notEqual(fonts[0],fonts[1]);
  const box=await paper.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width);
  await page.screenshot({path:`work/library-note-${viewport.width}.png`});
  await page.waitForTimeout(2000);assert.equal(await paper.count(),1,'paper stays until clicked');
  await paper.click({position:{x:box.width-5,y:box.height-5}});
  await paper.waitFor({state:'detached'});
  assert.ok((await page.locator('.scene-current-step').innerText()).includes('他看完后，抿着嘴笑了一下，重新拿起自己的书。'));
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.equal(saved.hyunjaeLibraryNoteRead,true);assert.equal(saved.affinity,7);assert.equal(saved.beat,4);
  assert.equal(await page.getByRole('button',{name:'明明是你先给我看的。',exact:true}).count(),0,'no duplicate fixed reply');
  await enter();assert.equal(await page.locator('.library-paper-note').count(),0,'completed animation is not replayed on refresh');
  assert.ok((await page.locator('.scene-current-step').innerText()).includes('他看完后，抿着嘴笑了一下，重新拿起自己的书。'));
  await page.locator('.scene-current-step button').click();
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).beat,key),5);
  assert.deepEqual(errors,[]);console.log('PASS library note ordering, early-click guard, handwriting, hold, corner click, continuation and save',viewport);
  await context.close();
 }
}finally{await browser.close();}
