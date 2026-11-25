import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const day=JSON.parse(readFileSync('stories/eric.json','utf8'))[21];
const beat=day.beats.findIndex(b=>b.kind==='lines'&&b.lines.some(l=>l.body==='那里夹着一张你亲手写下的生日贺卡。'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4182/';
const errors=[];
for(const branch of [0,1]){
 const context=await browser.newContext({viewport:branch?{width:1366,height:900}:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const key='hogwarts-eric-v1:birthday-check';
 async function enter(){await page.goto(base);await page.getByRole('button',{name:'推开霍格沃茨的大门'}).click();await page.locator('#eric-scene-title').waitFor();}
 async function seed(cursor){
  await page.goto(base);await page.evaluate(({key,beat,cursor,branch})=>{
   localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'生日核验',house:'ravenclaw',year:7,loveInterest:'eric',runId:'birthday-check'}));
   localStorage.setItem(key,JSON.stringify({day:22,beat,cursor,affinity:branch?10:20,choiceHistory:{'22:1':branch},clues:[],open:true}));
  },{key,beat,cursor,branch});await enter();
 }
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 // Advance from the preceding fixed reply: the card cannot appear early.
 await seed({position:13});
 const popup=page.getByRole('dialog',{name:'写给 Eric Sohn 的生日贺卡'});
 assert.equal(await popup.count(),0);
 await page.getByRole('button',{name:'当然。',exact:true}).click();
 for(let i=0;i<3&&(await save()).cursor.position<14;i++)await page.locator('.scene-current-step button').evaluate(e=>e.click());
 assert.equal((await save()).cursor.position,14);assert.equal(await popup.count(),0);
 const leadIn=await page.locator('.scene-current-step').innerText();
 assert.ok(leadIn.includes('那里夹着一张你亲手写下的生日贺卡。'));assert.ok(!leadIn.includes('他安静地看了很久'));
 await page.locator('.scene-current-step button').click();await popup.waitFor();
 const underlying=await page.locator('dialog.hogwarts-scene').innerText();
 assert.ok(underlying.includes('那里夹着一张你亲手写下的生日贺卡。'));
 assert.ok(!underlying.includes('他安静地看了很久'));assert.ok(!underlying.includes('愿你以后还有很多值得珍藏的回忆。'));
 assert.equal(await popup.locator('h2').textContent(),'To Eric Sohn');
 assert.equal(await popup.locator('h2').evaluate(e=>getComputedStyle(e).fontStyle),'italic');
 const input=popup.getByRole('textbox',{name:'生日祝福'}),submit=popup.getByRole('button',{name:'提交',exact:true});
 assert.equal(await input.getAttribute('placeholder'),'在这里写下你的祝福……');assert.equal(await submit.isDisabled(),true);
 await input.fill('   \n ');assert.equal(await submit.isDisabled(),true);
 const message='生日快乐，Eric！\n愿你拥有更多值得珍藏的回忆。⭐\n<script>不是代码</script>';
 await input.fill(message);assert.equal((await save()).ericBirthdayCard.draft,message);
 await enter();await popup.waitFor();assert.equal(await input.inputValue(),message);
 await page.keyboard.press('Escape');assert.equal(await popup.isVisible(),true);
 await page.waitForTimeout(1000);
 const cardBox=await popup.boundingBox(),submitBox=await submit.boundingBox();
 assert.ok(cardBox.y+cardBox.height-submitBox.y-submitBox.height<52);
 assert.ok(cardBox.x+cardBox.width-submitBox.x-submitBox.width<52);
 await page.screenshot({path:`work/eric-birthday-input-${branch}.png`});
 await submit.click();assert.equal(await input.count(),0);assert.equal(await submit.count(),0);
 assert.equal(await popup.locator('.eric-birthday-message').textContent(),message);
 assert.equal(await popup.locator('script').count(),0);
 await page.waitForTimeout(1200);assert.equal(await popup.isVisible(),true);
 await enter();await popup.waitFor();assert.equal(await input.count(),0);
 assert.equal(await popup.locator('.eric-birthday-message').textContent(),message);
 assert.equal((await save()).ericBirthdayCard.submitted,message);
 assert.equal((await save()).affinity,branch?10:20);
 await page.waitForTimeout(1000);await page.screenshot({path:`work/eric-birthday-submitted-${branch}.png`});
 await popup.getByRole('button',{name:'继续',exact:true}).click();await popup.waitFor({state:'detached'});
 assert.equal(await page.locator('.scene-current-step .hogwarts-narration').textContent(),'他安静地看了很久，手指轻轻抚过贺卡上的字迹。');
 assert.equal((await save()).cursor.position,14);assert.equal((await save()).ericBirthdayCard.done,true);
 await enter();assert.equal(await popup.count(),0);
 assert.ok((await page.locator('.scene-current-step').innerText()).startsWith('他安静地看了很久'));
 await page.locator('.scene-current-step button').click();
 await page.locator('.scene-current-step').evaluate(step=>{const b=step.querySelector('button');if(b?.textContent==='显示完整台词')b.click();});
 assert.equal(await page.locator('.scene-current-step .hogwarts-message p').textContent(),'好漂亮……');
 // Existing checkpoints past the original narration are not pulled backward.
 await seed({position:15});assert.equal(await popup.count(),0);assert.equal((await save()).cursor.position,15);
 console.log('PASS Eric birthday card',branch,'exact trigger, draft/submit/refresh, immutable multiline text, explicit continue, unchanged score, old saves');
 await context.close();
}
await browser.close();assert.deepEqual(errors,[]);
