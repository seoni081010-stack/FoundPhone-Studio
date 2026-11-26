import {chromium} from 'playwright';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const story=JSON.parse(readFileSync('stories/hyunjae-expanded.json')).days[16];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
try{
 for(const [via,viewport] of [['tree',{width:390,height:844}],['message',{width:1366,height:900}]]){
  const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const run='winter-wish-'+via,key=`hogwarts-hyunjae-expanded-v1:${run}`,beat=via==='tree'?7:14;
  const lines=story.beats[beat].lines;let steps=0,previousSpeech=true;
  for(const line of lines){if(line.speaker||previousSpeech)steps++;previousSpeech=Boolean(line.speaker);}
  await page.goto(base);await page.evaluate(({run,key,beat,position,via})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'冬日核验',house:'ravenclaw',year:5,loveInterest:'hyunjae',runId:run}));
   localStorage.setItem(key,JSON.stringify({day:17,beat,cursor:{position},clues:[],affinity:29,open:true,hyunjaeChoices:{'17:2':via==='tree'?0:1},hyunjaeMigrated:true}));
  },{run,key,beat,position:steps-1,via});
  const enter=async()=>{await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByRole('button',{name:'巫师手札',exact:true}).waitFor();if(via==='message'&&await page.getByRole('button',{name:'打开猫头鹰信箱',exact:true}).count())await page.getByRole('button',{name:'打开猫头鹰信箱',exact:true}).click();};
  await enter();
  if(via==='message'&&!await page.locator('.hyunjae-mail-scene').count())await page.getByRole('button',{name:'打开猫头鹰信箱',exact:true}).click();
  assert.equal(await page.locator('.winter-wish-tag').count(),0);
  while(!await page.locator('.winter-wish-tag').count()){await page.locator('.scene-current-step button').click();await page.waitForTimeout(50);}
  const tag=page.locator('.winter-wish-tag'),input=tag.getByRole('textbox',{name:'你的愿望'}),submit=tag.getByRole('button',{name:'将愿望挂上圣诞树'});
  assert.equal(await tag.locator('[lang=en]').innerText(),'make a wish');
  assert.equal(await input.getAttribute('placeholder'),'写下你的冬日愿望……');
  await input.fill('   ');assert.equal(await submit.isDisabled(),true);
  await page.keyboard.press('Escape');assert.equal(await tag.count(),1);
  const wish='愿我们都能勇敢一点。\n明年也一起看雪。';await input.fill(wish);
  await enter();
  assert.equal(await page.getByRole('textbox',{name:'你的愿望'}).inputValue(),wish);
  await page.evaluate(()=>document.fonts.ready);
  const box=await page.locator('.winter-wish-tag-paper').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width&&box.y>=0&&box.y+box.height<=viewport.height);
  const hole=await page.locator('.winter-wish-tag-hole').boundingBox();assert.ok(Math.abs(hole.x+hole.width/2-box.x-box.width/2)<3,'hanging hole is centered');
  const green=await page.getByRole('button',{name:'将愿望挂上圣诞树'}).evaluate(node=>getComputedStyle(node).backgroundColor.match(/\d+/g).slice(0,3).map(Number));assert.ok(green[1]>green[0]&&green[1]>green[2],'submit uses muted green rather than the shared purple skin');
  await page.screenshot({path:`work/winter-wish-${via}.png`});
  await page.getByRole('button',{name:'将愿望挂上圣诞树'}).click();
  assert.equal(await page.locator('.winter-wish-tag textarea').count(),0);
  assert.equal(await page.locator('.winter-wish-tag-written').innerText(),wish);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.equal(saved.hyunjaeWish.submitted,wish);assert.equal(saved.hyunjaeWish.via,via);assert.equal(saved.affinity,29);
  if(via==='message')await enter(); // Submission survives a refresh during its exit animation.
  await page.locator('.winter-wish-tag').waitFor({state:'detached'});
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.equal(after.beat,beat+2);assert.equal(after.affinity,29);
  if(via==='tree')assert.ok((await page.locator('.scene-current-step').innerText()).includes('等你写完时，李贤在也已经放下了羽毛笔。'));
  assert.deepEqual(errors,[]);
  console.log('PASS winter wish trigger, layout, draft, blank guard, readonly submission, fade, continuation, score and save',via,viewport);
  await context.close();
 }
 // Exercise the public reset handle in an isolated browser-mounted instance.
 const fixture=await build({stdin:{contents:`import {useRef,useState} from 'react';import {createRoot} from 'react-dom/client';import {WinterWishTag} from './src/runtime/WinterWishTag';function Fixture(){const [draft,D]=useState(''),[submitted,S]=useState();const ref=useRef(null);window.resetWish=()=>ref.current.reset();return <WinterWishTag ref={ref} draft={draft} submitted={submitted} onDraft={D} onSubmit={S} onReset={()=>{D('');S(undefined)}} onContinue={()=>window.continued=(window.continued||0)+1}/>};createRoot(document.getElementById('wish-fixture')).render(<Fixture/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'iife',jsx:'automatic',loader:{'.css':'empty'},write:false,define:{'process.env.NODE_ENV':'"production"'}});
 const context=await browser.newContext(),page=await context.newPage();await page.setContent('<div id="wish-fixture"></div>');await page.addScriptTag({content:fixture.outputFiles[0].text});
 await page.getByRole('textbox').fill('第一次愿望');await page.getByRole('button').click();await page.locator('.winter-wish-tag-written').waitFor();
 await page.evaluate(()=>window.resetWish());assert.equal(await page.getByRole('textbox').inputValue(),'');await page.waitForTimeout(1650);assert.equal(await page.evaluate(()=>window.continued||0),0);
 await page.getByRole('textbox').fill('重新写的愿望');await page.getByRole('button').click();await page.waitForFunction(()=>window.continued===1);
 console.log('PASS reset API clears text, cancels pending continuation and allows a fresh submission');await context.close();
}finally{await browser.close();}
