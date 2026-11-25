import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const errors=[];
for(const mobile of [true,false]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},serviceWorkers:'block',reducedMotion:process.env.MAP_MOTION_ONLY?'no-preference':'reduce'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.evaluate(()=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'地图核验',house:'ravenclaw',year:7,loveInterest:'eric',runId:'floor-check'}));
  localStorage.setItem('hogwarts-eric-v1:floor-check',JSON.stringify({day:1,beat:0,cursor:{position:0},clues:[],affinity:12,open:false,time:'09:00'}));
 });
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 const before=await page.evaluate(()=>localStorage.getItem('hogwarts-eric-v1:floor-check'));
 await page.getByRole('button',{name:'巫师手札',exact:true}).click();await page.getByRole('button',{name:'打开活点地图',exact:true}).click();
 await page.getByRole('button',{name:'展开羊皮卷轴'}).click();await page.getByRole('button',{name:'我庄严宣誓，我不干好事'}).evaluate(e=>e.click());
 const map=page.getByRole('region',{name:'分层城堡地图'});await map.waitFor();
 assert.equal(await map.locator('[data-person]').count(),7);
 assert.equal(await map.locator('[data-person="eric"]').getAttribute('data-floor'),'two');
 assert.equal(await map.locator('[data-person="eric"]').getAttribute('data-map-room'),'黑魔法防御术教室');
 for(const marker of await map.locator('[data-person]').all())assert.equal(await marker.getAttribute('data-mapped'),'true');
 const signature=await page.locator('.marauder-signature').innerText();assert.ok(signature.includes('孙英宰'));
 for(const name of ['裴俊英','金泳勋','李柱延','池昌民','金善旴','李贤在'])assert.ok(!signature.includes(name));
 const labels=await map.locator('svg').textContent();assert.ok(!labels.includes('斯内普办公室'));assert.ok(!labels.includes('密室'));
 if(process.env.MAP_MOTION_ONLY){
  await page.waitForTimeout(2800);
  assert.equal(await map.locator('.marauder-person-first').count(),7);
  const marker=map.locator('.marauder-person-first').first();
  assert.equal(await marker.evaluate(e=>getComputedStyle(e).animationName),'marauder-local-walk');
  const pose=await marker.evaluate(e=>getComputedStyle(e).transform);
  await page.waitForTimeout(400);assert.notEqual(await marker.evaluate(e=>getComputedStyle(e).transform),pose);
  console.log('PASS moving map footsteps',mobile?'mobile':'desktop');await context.close();continue;
 }
 const rooms={一层:['门厅','大礼堂'],二层:['黑魔法防御术教室','图书馆'],三层:['变形课教室','校医院'],四层:['魔咒课教室','级长浴室'],地窖:['魔药课教室','厨房'],高层与塔楼:['天文塔','北塔占卜教室'],室外:['温室','魁地奇球场']};
 for(const [floor,names]of Object.entries(rooms)){
  const tab=page.getByRole('navigation',{name:'地图楼层'}).getByRole('button',{name:floor,exact:true});
  await tab.click();assert.equal(await tab.getAttribute('aria-pressed'),'true');
  const focused=map.locator('[data-floor-band].is-focused');
  for(const name of names)assert.ok((await focused.textContent()).includes(name));
  const section=await focused.boundingBox(),bounds=await map.boundingBox();
  assert.ok(section.y>=bounds.y-8&&section.y<bounds.y+bounds.height);
  assert.equal(await map.locator('[data-person]').count(),7);
  if(['一层','二层','三层','四层','地窖'].includes(floor))await page.screenshot({path:`work/map-floor-${floor}-${mobile?'mobile':'desktop'}.png`});
 }
 await page.getByRole('button',{name:'全图 · 7人',exact:true}).click();
 assert.equal(await map.evaluate(e=>e.scrollTop),0);
 await page.getByRole('button',{name:'恶作剧完毕',exact:true}).click();await page.getByRole('button',{name:'展开羊皮卷轴'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('hogwarts-eric-v1:floor-check')),before);
 assert.deepEqual((await page.locator('.hogwarts-dock button').allTextContents()).map(t=>t.trim()),['魔法相册','猫头鹰信箱','巫师手札','Date']);
 console.log('PASS layered map',mobile?'mobile':'desktop','all floors, 7 markers, subject rooms, exclusion, scroll/close, unchanged save');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
