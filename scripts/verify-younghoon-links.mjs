import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
for(const ending of ['together','friends','unspoken']) {
 const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 await p.goto(`${process.env.BASE_URL||'http://127.0.0.1:4173/'}?preview=younghoon-ending-${ending}`);
 await p.getByRole('dialog').waitFor();let complete=false;
 for(let i=0;i<1200;i++) {
  await p.waitForTimeout(2);
  if(await p.locator('.hogwarts-ending').count()) {
   if(await p.locator('.hogwarts-ending').getAttribute('data-kind')!==ending)throw Error('incorrect ending');
   complete=true;break;
  }
  const d=p.getByRole('dialog');
  if(await d.count()){
   const choices=d.locator('.hogwarts-device-choices:not(.scene-fixed-reply) button');
   if(await choices.count()===2){await choices.first().evaluate(e=>e.click());continue;}
   const buttons=d.getByRole('button');if(await buttons.count()){await buttons.last().evaluate(e=>e.click());continue;}
  }
  const open=p.getByRole('button',{name:'打开猫头鹰信箱',exact:true});
  if(await open.count()){await open.first().evaluate(e=>e.click());continue;}
  const buttons=p.locator('.hogwarts-device-choices button');
  if(await buttons.count()){await buttons.first().evaluate(e=>e.click());continue;}
 }
 if(!complete)throw Error(`link incomplete ${ending}`);
 console.log('PASS standalone full Day31 link',ending);await p.close();
}
await b.close();
