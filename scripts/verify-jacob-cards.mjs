import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('stories/jcode-expanded.json'));
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const key='hogwarts-jacob-expanded-v1:card-check';
 async function seed(day,kind){await page.goto(base);await page.evaluate(({day,beat,key})=>{
 localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'卡片核验',house:'hufflepuff',year:7,loveInterest:'jacob',runId:'card-check'}));localStorage.setItem(key,JSON.stringify({day,beat,cursor:{position:0},clues:[],affinity:40,open:true,jacobFlags:{'swap-cards':true},jacobRawAffinity:99}));
 },{day,beat:data.days[day-1].beats.findIndex(b=>b.kind===kind),key});await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();}
 await seed(13,'greeting-card');await page.getByLabel('羊皮纸颜色').selectOption('浅蓝色');await page.getByLabel('装饰图案').selectOption('雪花');await page.getByLabel('贺卡内容').fill('愿你永远喜欢眼前的冬天。');
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();assert.equal(await page.getByLabel('贺卡内容').inputValue(),'愿你永远喜欢眼前的冬天。');assert.equal(await page.getByLabel('羊皮纸颜色').inputValue(),'浅蓝色');await page.getByRole('button',{name:'收好贺卡，圣诞节再交换'}).click();assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).jacobCard.submitted,key),true);console.log('PASS Day13 color, decoration, free text, refresh and submission');
 for(const name of ['纽特·斯卡曼德','忒修斯·斯卡曼德','阿不思·邓布利多']){
 await seed(18,'trading-cards');const slots=page.locator('.jacob-trading-cards button');assert.deepEqual(await slots.allTextContents(),['纽特·斯卡曼德','忒修斯·斯卡曼德','阿不思·邓布利多']);
 const sprite=await slots.first().locator('[role=img]').evaluate(async e=>{const url=getComputedStyle(e).backgroundImage.slice(5,-2),im=new Image();im.src=url;await im.decode();return {width:im.naturalWidth,height:im.naturalHeight,url};});assert.equal(sprite.width,1281);assert.equal(sprite.height,1227);assert.ok(sprite.url.includes('chocolate-frog-cards'));
 await slots.filter({has:page.locator(`[data-card="${name}"]`)}).click();let p=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(p.jacobTradingCard,name);assert.equal(p.affinity,40);assert.equal(p.jacobRawAffinity,99);assert.deepEqual(p.clues,[]);
 await page.reload();await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();p=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(p.jacobTradingCard,name);assert.equal(await page.locator('.jacob-trading-cards').count(),0);console.log('PASS provided pentagonal sprite, Chinese option, no score/clue, saved selection',name);
 }
 assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();}
