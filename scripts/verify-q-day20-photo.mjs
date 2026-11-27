import {createServer} from 'vite';import {chromium} from 'playwright';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const ssr=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom'});
const q=await ssr.ssrLoadModule('/src/runtime/routeWork.ts');const {compileStory}=await ssr.ssrLoadModule('/src/story-engine/compiler.ts');const save=q.qDayPreviewProgress(compileStory(JSON.parse(readFileSync('stories/hyunjae/story.json'))).work,20);await ssr.close();
const b=await chromium.launch({executablePath:'/usr/bin/chromium'});const base=process.env.BASE_URL||'http://127.0.0.1:4183/';
try{for(const branch of [0,1])for(const mobile of [true,false]){
 const context=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'});
 if(process.env.ONLINE_FETCH){const {attach}=await import('../work/trusted-online-fetch.mjs');await attach(context);}
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);const run=`q20-photo-${branch}-${mobile}`;const key=`foundphone-q-day01-${run}`;
 await p.evaluate(({save,key,run})=>{localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'姜饼核验',house:'ravenclaw',year:6,loveInterest:'q',runId:run}));localStorage.setItem(key,JSON.stringify({...save,version:3}));},{save,key,run});
 await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await p.evaluate(async branch=>{for(let i=0;i<600;i++){
  await new Promise(r=>setTimeout(r,3));if(document.querySelector('.q-gingerbread-photo[open]'))return;
  const surface=document.querySelector('dialog[open]')||document;const bs=[...surface.querySelectorAll('button')].filter(b=>!b.disabled);
  const choices=bs.filter(b=>b.dataset.choiceTarget?.startsWith('q-expanded-20-1'));
  (bs.find(b=>b.textContent==='显示完整')||bs.find(b=>b.closest('.scene-current-step,.scene-fixed-reply'))||choices[branch]||bs.find(b=>b.dataset.choiceTarget)||bs.find(b=>b.textContent==='去上课')||bs.find(b=>b.classList.contains('hogwarts-activity')))?.click();
 }throw Error(document.body.innerText.slice(-1400));},branch);
 const photo=p.locator('.q-gingerbread-photo');await photo.locator('button:not(:disabled)').waitFor();assert.equal(await photo.locator('img').getAttribute('src'),'./q/day20-gingerbread.jpg');assert.ok(await photo.locator('img').evaluate(i=>i.naturalWidth>1000));
 const history=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).choices,key);
 assert.ok(history.some(t=>t.startsWith('q-expanded-20-1')&&t.endsWith('option'+branch)));
 await p.waitForTimeout(1000);assert.equal(await photo.count(),1);
 if(mobile){await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await p.locator('.hogwarts-activity').first().click();await photo.locator('button:not(:disabled)').waitFor();assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).choices,key),history);}
 const box=await photo.locator('button').boundingBox();await photo.locator('button').click({position:{x:box.width-8,y:8}});
 await p.waitForFunction(()=>!document.querySelector('.q-gingerbread-photo'));
 assert.match(await p.locator('.scene-fixed-reply').innerText(),/好啊，下次可以换个图案/);
 assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).choices,key),history);
 assert.deepEqual(errors,[]);console.log('PASS Q20 exact image, both choices, corner click, fixed reply, saved pending photo',branch,mobile?'mobile + reload':'desktop');await context.close();
}}finally{await b.close();}
