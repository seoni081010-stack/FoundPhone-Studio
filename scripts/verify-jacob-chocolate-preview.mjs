import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.evaluate(()=>localStorage.setItem('hogwarts-jacob-expanded-v1:normal-preview-check','unchanged'));
 const names=['纽特·斯卡曼德','忒修斯·斯卡曼德','阿不思·邓布利多'];
 for(const name of names){
  await page.goto(base+'?preview=jcode-chocolate-frog');const slots=page.locator('.jacob-trading-cards button');await slots.first().waitFor();assert.deepEqual(await slots.allTextContents(),names);
  const art=slots.filter({has:page.locator(`[data-card="${name}"]`)}).locator('[role=img]');assert.equal(await art.evaluate(async e=>{const im=new Image();im.src=getComputedStyle(e).backgroundImage.slice(5,-2);await im.decode();return im.naturalWidth;}),1281);
  await slots.filter({has:page.locator(`[data-card="${name}"]`)}).click();await slots.first().waitFor({state:'detached'});assert.equal(await page.evaluate(()=>localStorage.getItem('hogwarts-jacob-expanded-v1:normal-preview-check')),'unchanged');
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('hogwarts-jacob-expanded-v1:review-'))),false);console.log('PASS direct card preview, named choice, actual image, return to story and normal-save isolation',name);
 }
 assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();}
