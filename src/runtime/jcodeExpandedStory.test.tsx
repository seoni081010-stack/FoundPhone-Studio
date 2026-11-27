import { knownMapPoint } from "./mapLocations";
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import data from "../../stories/jcode-expanded.json";
import { jacobCondition, jacobEndingFor, jacobExpandedDay, jacobNextBeat, jacobPreviewProgress, jacobScore, jacobText, type JacobDay, type JacobProgress } from "./jcodeExpandedStory";
import { JacobExpandedScene } from "./JacobExpandedScene";
function play(policy: (index: number) => number) {
  const p: JacobProgress = { day: 1, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: true, jacobFlags: {}, jacobChoices: {}, jacobRawAffinity: 0 };
  let ordinal=0;const visited=new Set<string>();
  for(let day=1;day<=31;day++) {
    p.day=day;const story=jacobExpandedDay(day,jacobEndingFor(p.affinity)) as unknown as JacobDay;
    for(let i=0;i<story.beats.length;i++) {
      const b=story.beats[i];if(!b.when.every(c=>jacobCondition(c,p)))continue;
      if(b.kind==='choice') {const oi=policy(ordinal++),o=b.options![oi];visited.add(b.id+':'+oi);p.jacobChoices![b.id]=oi;Object.assign(p.jacobFlags!,o.effects??{});p.jacobRawAffinity!+=o.rawAffinity;p.affinity=jacobScore(p.jacobRawAffinity!);}
      if(b.kind==='clue')p.clues.push(b.clue!.id);
    }
  }
  return {p,visited};
}
describe('approved Jacob expansion',()=>{
 test('has all thirty merged days, four original clues and exclusive latest endings',()=>{
  expect(data.days.map(d=>d.day)).toEqual(Array.from({length:30},(_,i)=>i+1));
  expect(data.days.flatMap(d=>d.beats.filter(b=>b.kind==='clue').map(b=>('clue' in b?b.clue:undefined)?.id))).toEqual(['jcode-1','jcode-6','jcode-17','jcode-24']);
  expect(data.endings.together.ending.text).toBe('可你知道，往后还会有许多个冬天，等待你们一起走过。');
  expect(data.endings.friends.ending.text).toBe('今年的冬天没有变成爱情故事，却依然留下了值得珍藏的照片。');
  expect(data.endings.unspoken.ending.text).toBe('但有些事情，最终还是没有得到答案。');
  for(const kind of ['together','friends','unspoken'] as const){const story=jacobExpandedDay(31,kind) as unknown as JacobDay;expect(story.beats.flatMap(b=>b.lines??[]).some(l=>l.body.includes('烟花从城堡后方升起'))).toBe(true);}
 });
 test('normal high, middle and low complete paths reach three shared thresholds',()=>{
  const high=play(()=>0).p,low=play(()=>1).p,middle=play(i=>i%4===0?1:0).p;
  expect(high.jacobRawAffinity).toBe(data.maximumRawAffinity);expect(high.affinity).toBe(100);
  expect(jacobEndingFor(high.affinity)).toBe('together');expect(jacobEndingFor(low.affinity)).toBe('unspoken');expect(jacobEndingFor(middle.affinity)).toBe('friends');
  expect(low.affinity).toBeLessThan(80);expect(high.clues).toHaveLength(4);expect(low.clues).toHaveLength(4);
 });
 test('mixed policies cover every reachable dialogue option without exceeding the maximum',()=>{
  const seen=new Set<string>();for(let seed=0;seed<180;seed++){const {p,visited}=play(i=>(Math.imul(seed+3,i+13)^(seed>>2)^(i*i))>>>0&1);expect(p.affinity).toBeGreaterThanOrEqual(0);expect(p.affinity).toBeLessThanOrEqual(100);for(const v of visited)seen.add(v);}
  for(const {visited} of [play(()=>0),play(()=>1)])for(const v of visited)seen.add(v);
  for(const d of data.days)for(const b of d.beats)if(b.kind==='choice'&&'options' in b)b.options?.forEach((_,oi)=>expect(seen.has(b.id+':'+oi),b.id+':'+oi).toBe(true));
 });
 test('memory conditions follow actual flags and never import a choice from another route',()=>{
  const p=play(()=>1).p;expect(jacobCondition('photo',p)).toBe(false);expect(jacobCondition('sing',p)).toBe(false);expect(jacobCondition('swap-cards',p)).toBe(false);expect(jacobCondition('!sweet',p)).toBe(true);
  const d=jacobExpandedDay(18) as unknown as JacobDay;const index=d.beats.findIndex(b=>b.kind==='trading-cards');expect(jacobNextBeat(d,index,p)).toBeGreaterThan(index);
 });
 test('twentieth-day second-cup record controls the twenty-first-day debt text',()=>{
  const p=play(()=>0).p;p.day=21;expect(jacobText('不是还欠你热巧克力吗？',p,'玩家')).toBe('不是还答应再请你一杯吗？');
  p.jacobFlags!['second-cup']=false;expect(jacobText('不是还欠你热巧克力吗？',p,'玩家')).toBe('想请你试试新的热巧克力配方。');
 });
 test('Day25 does not access Day13 player card data or display its creation form',()=>{
  const p: JacobProgress={day:25,beat:0,cursor:{position:0},clues:[],affinity:50,open:true};Object.defineProperty(p,'jacobCard',{get(){throw Error('Day25 read Day13 card');}});
  const html=renderToStaticMarkup(<JacobExpandedScene progress={p} update={()=>{}} identityKey="test" score={50} player="玩家" mailOpen={false} onMail={()=>{}} onFinish={()=>{}} onClue={()=>{}} note={(_,body)=><div>{body}</div>} highlight={body=>body}/>);
  expect(html).not.toContain('jacob-card-maker');expect((jacobExpandedDay(25) as unknown as JacobDay).beats.some(b=>['greeting-card','trading-cards'].includes(b.kind))).toBe(false);
 });
 test('only Day13 offers card creation and Day18 offers three named card slots',()=>{
  expect(data.days.filter(d=>d.beats.some(b=>b.kind==='greeting-card')).map(d=>d.day)).toEqual([13]);expect(data.days.filter(d=>d.beats.some(b=>b.kind==='trading-cards')).map(d=>d.day)).toEqual([18]);
 });
});

test('every authored Jacob scene place has an explicit map point',()=>{for(const d of data.days)for(const b of d.beats)if(b.channel==='scene'&&b.kind!=='clue')expect(knownMapPoint(b.place),b.place).toBeDefined();});

test('drink and lesson memories reflect the actual branch',()=>{const p:JacobProgress={day:15,beat:0,cursor:{position:0},clues:[],affinity:0,open:true,jacobFlags:{'drink-热苹果汁':true}};expect(jacobText('厨房里的家养小精灵很快给你们准备了两杯热巧克力。',p,'玩家')).toContain('一杯热苹果汁和一杯热巧克力');p.day=20;expect(jacobText('他将其中一杯递给你。',p,'玩家')).toBe('他将热苹果汁递给你。');p.day=18;expect(jacobText('昨天是教她拍照。',p,'玩家')).toBe('昨天是带她看怎么洗照片。');p.day=27;p.jacobFlags!.marshmallow=true;expect(jacobText('终于不是什么都不加了？',p,'玩家')).toBe('这次不是只加棉花糖了？');});

 test("authoring instructions never enter playable narration",()=>{for(const day of data.days)for(const beat of day.beats)for(const line of beat.lines??[])expect(line.body).not.toMatch(/用户提供|图片位置|不标A／B／C|独立动画名额|原版/);});

test('Day18 uses one named Hufflepuff friend and the actual Day17 lesson',()=>{
 const day=data.days[17];const lines=day.beats.flatMap(b=>[...(b.lines??[]),...(b.options??[]).flatMap(o=>o.lines)]);
 expect(lines.some(l=>l.body.includes('赫奇帕奇的厄尼·麦克米兰'))).toBe(true);
 expect(lines.some(l=>l.speaker==='厄尼')).toBe(true);
 expect(lines.some(l=>l.body.includes('同学')||l.speaker==='同学'||l.body.includes('两个厄尼'))).toBe(false);
 const p:JacobProgress={day:18,beat:0,cursor:{position:0},clues:[],affinity:0,open:true,jacobFlags:{}};
 expect(jacobText('说在教你拍照。',p,'玩家')).toBe('说在带你看怎么洗照片。');p.jacobFlags!['camera-lesson']=true;expect(jacobText('说在教你拍照。',p,'玩家')).toBe('说在教你拍照。');
});

test("Day18 preview includes the actual Day12 card exchange agreement",()=>{expect(jacobPreviewProgress(18).jacobFlags?.["swap-cards"]).toBe(true);expect(jacobPreviewProgress(19).jacobFlags?.["swap-cards"]).toBe(false);});

test("chocolate frog preview starts directly on the existing card selector",()=>{const p=jacobPreviewProgress(18,undefined,true);expect(data.days[17].beats[p.beat!].kind).toBe("trading-cards");expect(p.jacobFlags?.["swap-cards"]).toBe(true);expect(p.open).toBe(true);});
