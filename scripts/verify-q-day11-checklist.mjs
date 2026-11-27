import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ssr=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom'});
const q=await ssr.ssrLoadModule('/src/runtime/routeWork.ts');const {compileStory}=await ssr.ssrLoadModule('/src/story-engine/compiler.ts');
const save=q.qDayPreviewProgress(compileStory(JSON.parse(readFileSync('stories/hyunjae/story.json'))).work,11);await ssr.close();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4183/';
try{for(const choice of ['tea','chestnuts'])for(const mobile of [true,false]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'});
 if(process.env.ONLINE_FETCH){const {attach}=await import('../work/trusted-online-fetch.mjs');await attach(context);}
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 const run=`q11-${choice}-${mobile}`;const key=`foundphone-q-day01-${run}`;
 await page.evaluate(({save,key,run})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'清单核验',house:'ravenclaw',year:6,loveInterest:'q',runId:run}));localStorage.setItem(key,JSON.stringify({...save,version:3}));
 },{save,key,run});await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await page.evaluate(async(choice)=>{
  for(let i=0;i<550;i++){
   await new Promise(r=>setTimeout(r,3));if(document.querySelector('.q-match-checklist[open]'))return;
   const surface=document.querySelector('dialog[open]')||document;
   const buttons=[...surface.querySelectorAll('button')].filter(b=>!b.disabled);
   const option=buttons.find(b=>b.dataset.choiceTarget?.startsWith('q-expanded-11-0')&&(choice==='tea'?b.textContent.includes('热茶'):b.textContent.includes('栗子')));
   (buttons.find(b=>b.textContent==='显示完整')||buttons.find(b=>b.closest('.scene-current-step,.scene-fixed-reply'))||option||buttons.find(b=>b.textContent==='去上课')||buttons.find(b=>b.classList.contains('hogwarts-activity')))?.click();
  }throw Error('Checklist not reached: '+document.body.innerText);
 },choice);
 const paper=page.locator('.q-match-checklist');assert.equal(await paper.getAttribute('data-choice'),choice);
 assert.equal(await paper.locator('li[data-crossed=true]').count(),3);
 assert.equal(await paper.locator('[data-obliterated=true] path').count(),4);
 assert.equal(await paper.locator('.q-list-tea').count(),choice==='tea'?1:0);
 assert.equal(await paper.locator('.q-list-circle').count(),choice==='chestnuts'?1:0);
 if(await paper.getAttribute('data-ready')==='false'){await paper.locator('.q-match-checklist-paper').evaluate(el=>el.click());assert.equal(await paper.count(),1);}
 const history=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).choices,key);
 if(mobile){await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('.hogwarts-activity').first().click();await paper.waitFor();assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).choices,key),history);}
 await page.waitForFunction(()=>document.querySelector('.q-match-checklist')?.dataset.ready==='true');
 const font=await paper.locator('ul').evaluate(el=>getComputedStyle(el).fontFamily);assert.match(font,/Q Checklist Hand/);
 await page.waitForTimeout(900);assert.equal(await paper.count(),1);
 if(mobile)await paper.screenshot({path:`work/q-day11-${choice}.png`});
 const box=await paper.boundingBox();assert.ok(box.width<=390||!mobile);
 await paper.locator('.q-match-checklist-paper').click({position:{x:box.width-18,y:18}});
 await page.waitForFunction(()=>!document.querySelector('.q-match-checklist'));
 assert.match(await page.locator('.scene-current-step').innerText(),/池昌民将羊皮纸收起来，继续吃午饭/);
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).choices,key),history);
 assert.deepEqual(errors,[]);console.log('PASS Q11 checklist branch, early-click lock, manual close, story return and save',choice,mobile?'mobile + reload':'desktop');await context.close();
}}finally{await browser.close();}
