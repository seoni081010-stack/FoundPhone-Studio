import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {existsSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
assert.ok(existsSync('public/jacob/day21-gingerbread.jpg'),'The supplied original photograph is required before photo verification/deployment.');
assert.equal(createHash('sha256').update(readFileSync('public/jacob/day21-gingerbread.jpg')).digest('hex'),'ccb5beb7c58fd92401c083fc69254a0859450b4b9e869813624ff8bd85ad4ed7','Preserve the original uploaded photograph byte for byte');
const data=JSON.parse(readFileSync('stories/jcode-expanded.json'));
const beat=data.days[20].beats.findIndex(b=>b.kind==='choice'&&b.options?.some(o=>o.lines.at(-1)?.body==='现在完成了。'));
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
try{for(const mobile of [true,false]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const run='gingerbread-'+mobile,key='hogwarts-jacob-expanded-v1:'+run;
 async function seed(option){await page.goto(base);await page.evaluate(({key,run,beat,option})=>{localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'姜饼核验',house:'hufflepuff',year:7,loveInterest:'jacob',runId:run}));localStorage.setItem(key,JSON.stringify({day:21,beat,option,cursor:{position:0,accepted:true},clues:[],affinity:50,open:true,jacobChecklistRead:true,jacobChecklist21Read:true}));},{key,run,beat,option});await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();}
 async function finishBranch(expectPhoto){let sawNow=false;for(let i=0;i<100;i++){if(await page.locator('.jacob-gingerbread-photo').count()){assert.ok(expectPhoto);assert.ok(sawNow);await page.locator('.jacob-gingerbread-photo').waitFor({state:'visible'});return;}const p=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);if(p.beat>beat){assert.equal(expectPhoto,false);return;}if(p.jacobGingerbreadPhotoOpen){await page.waitForTimeout(10);continue;}const step=page.locator('dialog[open] .scene-current-step');if((await step.textContent())?.includes('现在完成了。'))sawNow=true;await page.locator('dialog[open] .scene-current-step button,dialog[open] .scene-fixed-reply button').first().evaluate(e=>e.click());}throw Error('Branch did not finish');}
 await seed(0);await finishBranch(false);assert.equal(await page.locator('.jacob-gingerbread-photo').count(),0);console.log('PASS A branch keeps its original continuation without the pocket photograph',mobile);
 for(const fraction of [.12,.5,.88]){
  await seed(1);await finishBranch(true);const photo=page.getByRole('dialog',{name:'装饰好的姜饼人'}),image=photo.locator('img');await image.evaluate(im=>im.decode());assert.equal(await image.evaluate(im=>im.naturalWidth),1536);assert.equal(await image.evaluate(im=>im.naturalHeight),1024);
  assert.equal(await page.getByText('家养小精灵拿来两个小纸袋，帮你们将姜饼装好。',{exact:true}).count(),0);await page.waitForTimeout(800);assert.equal(await photo.count(),1);await page.keyboard.press('Escape');assert.equal(await photo.count(),1);
  await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await photo.waitFor();await image.evaluate(im=>im.decode());const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(before.jacobGingerbreadPhotoOpen,true);assert.equal(before.affinity,50);
  const bounds=await image.boundingBox();await image.click({position:{x:bounds.width*fraction,y:bounds.height*fraction}});
  await photo.waitFor({state:'detached'});await page.getByText('家养小精灵拿来两个小纸袋，帮你们将姜饼装好。',{exact:true}).waitFor();const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(after.beat,beat+1);assert.equal(after.jacobGingerbreadPhotoRead,true);assert.equal(after.jacobGingerbreadPhotoOpen,false);assert.equal(after.affinity,50);assert.deepEqual(after.clues,[]);
  await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.getByText('家养小精灵拿来两个小纸袋，帮你们将姜饼装好。',{exact:true}).waitFor();assert.equal(await photo.count(),0);
  console.log('PASS B photo pending until image click, refresh, hit point, exact common continuation and unchanged score',mobile,fraction,'supplied original');
 }
 await context.close();
}assert.deepEqual(errors,[]);}finally{await browser.close();}
