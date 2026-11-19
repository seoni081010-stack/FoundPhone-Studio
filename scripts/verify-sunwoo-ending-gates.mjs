import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
for(const [score,expected]of [[77,'unspoken'],[78,'friends'],[79,'friends'],[97,'friends'],[98,'together'],[99,'together']]){
 const p=await b.newPage({serviceWorkers:'block',reducedMotion:'reduce'});await p.goto(process.env.BASE_URL||'http://127.0.0.1:4180/');
 await p.evaluate(score=>{
  localStorage.setItem('foundphone-hogwarts-identity-v1',JSON.stringify({name:'栀子',house:'slytherin',year:6,loveInterest:'sunwoo',runId:'gate-check'}));
  localStorage.setItem('hogwarts-sunwoo-v1:gate-check',JSON.stringify({day:31,beat:0,cursor:{position:0},affinity:score,clues:[],open:true}));
 },score);
 await p.reload();await p.getByRole('button',{name:'推开霍格沃茨的大门'}).click();
 const result=await p.evaluate(async()=>{
  for(let i=0;i<550;i++){
   await new Promise(r=>setTimeout(r,0));
   const progress=JSON.parse(localStorage.getItem('hogwarts-sunwoo-v1:gate-check'));
   if(progress.ending)return progress;
   const dialog=document.querySelector('dialog[open]');
   const options=dialog?.querySelectorAll('.hogwarts-device-choices button');
   const step=dialog?.querySelector('.scene-current-step button,.scene-fixed-reply button');
   if(step)step.click();else if(options?.length)options[1].click();
  }
  throw Error('gate not reached');
 });
 assert.equal(result.ending,expected);assert.equal(result.affinity,score+2);
 console.log('PASS 00:05 shared gate',score,'+2 =>',result.affinity,expected);await p.close();
}
await b.close();
