import { describe, expect, test } from "vitest";
import { sceneParts } from "./SceneDialogue";
import { jacobExpandedDay, type JacobDay } from "./jcodeExpandedStory";
import { jacobChecklistAnchor, jacobChecklistDuration, jacobChecklistItems, jacobChecklistRowStarts, jacobChecklistStep, jacobChecklistTiming, jacobChecklistWritingEnd } from "./JacobChristmasChecklist";

describe('Jacob December16 Christmas checklist',()=>{
 test('preserves all seven supplied items and exactly the four completed marks',()=>{
  expect(jacobChecklistItems.map(i=>i.text)).toEqual(['确认本院留校名单','节日巡逻安排表','布置圣诞树','完成魔药课论文','把写好的圣诞贺卡寄出去','买一些巧克力和姜饼','睡到自然醒']);
  expect(jacobChecklistItems.map(i=>i.done)).toEqual([true,true,false,false,true,true,false]);
 });
 test('starts after the original narration block and resumes at the unchanged fixed reply',()=>{
  const day=jacobExpandedDay(16) as unknown as JacobDay,beat=day.beats.find(b=>b.lines?.some(l=>l.body===jacobChecklistAnchor))!;
  const lines=beat.lines!,parts=sceneParts(lines.map((l,i)=>l.speaker?<article key={i} className={`hogwarts-message${l.speaker==='你'?' outgoing':''}`}><div><p>{l.body}</p></div></article>:<p key={i} className="hogwarts-narration">{l.body}</p>));
  const index=jacobChecklistStep(lines);expect(index).toBeGreaterThanOrEqual(0);expect(parts.steps[index].text).toContain(jacobChecklistAnchor);expect(parts.steps[index+1].text).toBe('你还给自己列了清单？');expect(parts.steps[index+1].outgoing).toBe(true);
  expect(jacobChecklistStep([{body:'普通旁白'}])).toBe(-1);
 });
 test('finishes each row in order, then reserves eight full seconds for reading',()=>{
  expect(jacobChecklistRowStarts[0]).toBeGreaterThan(jacobChecklistTiming.title);
  for(let i=1;i<jacobChecklistRowStarts.length;i++)expect(jacobChecklistRowStarts[i]).toBeGreaterThan(jacobChecklistRowStarts[i-1]+jacobChecklistItems[i-1].text.length*jacobChecklistTiming.character);
  expect(jacobChecklistDuration-jacobChecklistWritingEnd).toBe(8000);expect(jacobChecklistDuration).toBeGreaterThan(14000);
 });
});
