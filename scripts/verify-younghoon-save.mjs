import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});const p=await b.newPage();
await p.goto('http://127.0.0.1:4173/');
await p.evaluate(()=>{
localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'测试',house:'ravenclaw',year:6,loveInterest:'younghoon',runId:'save-check'}));
localStorage.setItem('hogwarts-younghoon-v1:save-check',JSON.stringify({day:24,beat:999,cursor:{position:0},clues:['younghoon-6'],affinity:30,open:false,done:true}));
});
await p.reload();
await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
await p.getByRole('button',{name:'结束这一天',exact:true}).click();
await p.getByRole('button',{name:/10:20/}).click();
await p.locator('.scene-advance').click();await p.locator('.scene-advance').click();
const saved=await p.evaluate(()=>localStorage.getItem('hogwarts-younghoon-v1:save-check'));
await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
if(await p.evaluate(()=>localStorage.getItem('hogwarts-younghoon-v1:save-check'))!==saved)throw Error('save changed on reload');
const progress=JSON.parse(saved);if(progress.day!==25 || progress.affinity!==30 || !progress.clues.includes('younghoon-6') || progress.cursor.position<1)throw Error('Day24 continuation failed');
console.log('PASS Day24→25 and cursor/affinity/clue save restore');
await b.close();
