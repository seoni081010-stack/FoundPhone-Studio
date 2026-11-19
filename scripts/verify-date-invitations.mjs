import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const pools=JSON.parse(readFileSync('stories/date-invitations.json','utf8'));
const venues=JSON.parse(readFileSync('stories/template/hogwarts-dates.json','utf8')).venues;
const catalog=JSON.parse(readFileSync('stories/template/hogwarts-gift-catalog.json','utf8'));
const prefs=JSON.parse(readFileSync('stories/template/hogwarts-gift-preferences.json','utf8')).preferences;
const names={sunwoo:'金善旴',jacob:'裴俊英',q:'池昌民',younghoon:'金泳勋',hyunjae:'李贤在'};
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const errors=[];
for(const lead of Object.keys(pools).filter(id=>!process.env.INVITATION_LEAD||process.env.INVITATION_LEAD===id)) for(const score of [45,46]){
 const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 const run=`date-check-${lead}-${score}`;const year=lead==='sunwoo'?6:5;const key=`hogwarts-date-invitations-v1:${run}:${lead}`;
 const preferred=prefs.find(person=>person.id===lead).preferredStores;
 const liked=catalog.items.find(i=>i.giftable&&preferred.includes(i.storeId));
 const ordinary=catalog.items.find(i=>i.giftable&&!preferred.includes(i.storeId));
 await p.goto(base);await p.evaluate(({lead,run,score,liked,ordinary,year})=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'邀约核验',house:'slytherin',year,loveInterest:lead,runId:run}));
  localStorage.setItem(`foundphone-hogwarts-shopping-v1-${run}`,JSON.stringify({wallet:5000,vault:100000,inventory:{},gifts:score===45?{[liked.id+'-'+lead]:9}:{[liked.id+'-'+lead]:8,[ordinary.id+'-'+lead]:3},vaultUpgrade:true}));
 },{lead,run,score,liked,ordinary,year});
 await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 await p.getByRole('button',{name:'巫师手札',exact:true}).click();await p.getByRole('button',{name:/人物档案/}).click();
 await p.getByRole('button',{name:names[lead],exact:true}).click();
 assert.equal(await p.getByRole('region',{name:'人物状态'}).locator('progress').first().getAttribute('value'),String(score));
 await p.getByRole('button',{name:'Date',exact:true}).click();
 await p.getByLabel('约谁见面').selectOption(lead);
 const dateOptions=await p.getByLabel('约会日期').locator('option').evaluateAll(items=>items.map(o=>o.value));
 assert.ok(!dateOptions.includes('12'));assert.ok(!dateOptions.includes('24'));
 const dateSlots=[5,6,13,19,20,22];
 for(let i=0;i<venues.length;i++){
  await p.getByLabel('约会日期').selectOption(String(score===46?dateSlots[i]:5));
  await p.getByLabel('去哪里').selectOption(venues[i].id);
  await p.evaluate(slot=>{Math.random=()=> (slot+.5)/4;},i%4);
  assert.equal(await p.getByRole('button',{name:'发送邀请',exact:true}).isEnabled(),true);
  await p.getByRole('button',{name:'发送邀请',exact:true}).click();
  const expected=pools[lead][score===46?'accepts':'declines'][i%4];
  await p.getByRole('dialog').getByText(expected,{exact:true}).waitFor();
  await p.getByRole('dialog').getByRole('button',{name:'返回',exact:true}).click();
  const saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.equal(saved.invitations.length,i+1);assert.equal(saved.invitations.at(-1).reply,expected);
  assert.equal(saved.invitations.at(-1).accepted,score===46);
 }
 const before=await p.evaluate(key=>localStorage.getItem(key),key);
 for(let i=0;i<2;i++){
  await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
  await p.getByRole('button',{name:'猫头鹰信箱',exact:true}).click();
  await p.locator('.hogwarts-contact').filter({hasText:names[lead]}).click();
  const mail=await p.locator('.hogwarts-device-page').innerText();
  for(const reply of pools[lead][score===46?'accepts':'declines'])assert.ok(mail.includes(reply));
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),before);
  await p.getByRole('button',{name:'Date',exact:true}).click();
  for(const day of dateSlots)assert.equal(await p.getByLabel('约会日期').locator(`option[value="${day}"]`).evaluate(option=>option.disabled),score===46);
  if(score===46)for(const venue of venues)assert.ok((await p.locator('.hogwarts-date').innerText()).includes(venue.name));
 }
 console.log('PASS',lead,'affinity',score,score===46?'accept':'decline','all 6 venues, all 4 replies, 2 refreshes');
 await c.close();
}
await b.close();assert.deepEqual(errors,[]);
