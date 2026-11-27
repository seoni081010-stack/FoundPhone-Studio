import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QMatchChecklist, qChecklistAnchors, qChecklistItems, qChecklistDuration } from "./QMatchChecklist";
import { sceneParts } from "./SceneDialogue";
describe("Q Day11 match checklist",()=>{
 it.each(["tea","chestnuts"] as const)("renders the correct handwritten branch: %s",choice=>{
  const html=renderToStaticMarkup(<QMatchChecklist choice={choice} onComplete={()=>{}}/>);
  expect(qChecklistItems).toEqual(["栗子","糖果","望远镜","魔法斗篷","银质小刀","南瓜汁"]);
  expect(html.match(/data-crossed="true"/g)).toHaveLength(3);
  expect(html).toContain('data-obliterated="true"');
  expect(html.includes('class="q-list-tea"')).toBe(choice==='tea');
  expect(html.includes('class="q-list-circle"')).toBe(choice==='chestnuts');
  expect(html).toContain('aria-disabled="true"');expect(html).not.toContain('<img');
  expect(html).not.toContain('继续</button>');expect(qChecklistDuration).toBeGreaterThan(5000);
 });
 it("matches exactly the final character line on both branches",()=>{
  for(const choice of ['tea','chestnuts'] as const){
   const {steps}=sceneParts(<><div className="hogwarts-message"><div><p>{qChecklistAnchors[choice]}</p></div></div><p className="hogwarts-narration">池昌民将羊皮纸收起来，继续吃午饭。</p></>);
   expect(steps[0].text).toBe(qChecklistAnchors[choice]);expect(steps[1].speech).toBe(false);
  }
 });
});
