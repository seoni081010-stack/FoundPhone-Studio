import { chromium } from 'playwright';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true});
const errors=[];
for (const [day, branch, ending] of [[25,0],[25,1],[26,0],[26,1],[27,0],[27,1],[28,0],[28,1],[29,0],[29,1],[30,0],[30,1],[31,0,'together'],[31,1,'friends'],[31,0,'unspoken']]) {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage(); page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(`http://127.0.0.1:4173/?preview=younghoon-day${day}`);
 await page.getByRole('dialog').first().waitFor();
 let clueCount=0, endingSelected=false, completed=false;
 for(let i=0;i<1700;i++) {
  await page.waitForTimeout(2);

  const end=page.locator('.hogwarts-ending');
  if(await end.count()) {
   if(!ending) throw Error('unexpected ending');
   if(await end.getAttribute('data-kind')!==ending) throw Error('wrong ending');
   const copy={together:'原来所有计划之外的心动，都有一个共同的名字。',friends:'有些心意没能得到回应，但相遇本身依然值得珍惜。',unspoken:'故事停在了这一页，而下一行，谁也还没有写下。'};
   await page.getByText(copy[ending],{exact:true}).waitFor();
   await page.getByRole('button',{name:'返回',exact:true}).evaluate(el=>el.click());
   await page.getByRole('button',{name:'查看结局',exact:true}).waitFor();
   await page.getByRole('button',{name:'魔法相册',exact:true}).evaluate(el=>el.click());
   await page.getByText('写在冬天里的愿望',{exact:true}).waitFor();
   completed=true; break;
  }
  const dialog=page.getByRole('dialog').last();
  if(await dialog.count()) {
   if(await dialog.getByRole('heading',{name:'魔法相册解锁新内容'}).count()) {
    clueCount++; await page.keyboard.press('Escape');
    if(!await dialog.isVisible()) throw Error('Escape dismissed memory');
    await dialog.getByRole('button',{name:'继续',exact:true}).evaluate(el=>el.click()); continue;
   }
   if(await dialog.getByRole('heading',{name:'最终选择',exact:true}).count()) {
    await dialog.getByRole('button').nth(['together','friends','unspoken'].indexOf(ending)).evaluate(el=>el.click());endingSelected=true;continue;
   }
   const buttons=dialog.getByRole('button');
   const finish=dialog.getByRole('button',{name:day===31?'查看结局':'继续今天的行程',exact:true});
   if(await finish.count()) {await finish.evaluate(el=>el.click()); if(day!==31){completed=true;break;}continue;}
   const choices=dialog.locator('.hogwarts-device-choices:not(.scene-fixed-reply) button');
   if(await choices.count()===2) {await choices.nth(branch).evaluate(el=>el.click());continue;}
   const advance=dialog.locator('.scene-current-step button,.scene-fixed-reply button');
   if(await advance.count()) {await advance.last().evaluate(el=>el.click());continue;}
   if(await buttons.count()){await buttons.last().evaluate(el=>el.click());continue;}
  }
  const openMail=page.getByRole('button',{name:'打开猫头鹰信箱',exact:true});
  if(await openMail.count()){await openMail.first().evaluate(el=>el.click());continue;}
  const mailButtons=page.locator('.hogwarts-device-choices button');
  if(await mailButtons.count()) {await mailButtons.nth(Math.min(branch,(await mailButtons.count())-1)).evaluate(el=>el.click());continue;}
  const resume=page.getByRole('button',{name:'继续今天的行程',exact:true});
  if(await resume.count()){await resume.evaluate(el=>el.click());continue;}
  await page.waitForTimeout(10);
 }
 if(!completed) throw Error(`did not complete ${day} ${branch} ${ending}`);
 if(day===26 && clueCount!==1 || day===31 && (clueCount!==1 || !endingSelected)) throw Error('memory/ending gate failed');
 console.log('PASS',day,branch,ending??'', 'clues',clueCount);
 await context.close();
}
await browser.close();if(errors.length) throw Error(errors.join('\n'));
