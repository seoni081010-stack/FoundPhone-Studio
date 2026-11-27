import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JacobExpandedScene } from "./JacobExpandedScene";
import { jacobExpandedDay, type JacobDay, type JacobProgress } from "./jcodeExpandedStory";
import { jacobChristmasLetterAnchor, jacobChristmasLetterText, jacobChristmasLetterReveals, jacobChristmasLetterWrittenAt } from "./JacobChristmasLetter";

test('Jacob Christmas letter preserves all supplied paragraphs and signature',()=>{
 expect([...jacobChristmasLetterText]).toEqual(['圣诞快乐。','今年 12 月发生了很多值得记住，也有很多原本很普通变得特别特别的日子。','谢谢你愿意把一些时间留给我。','希望你在新的一年能够做自己很多喜欢的事情，遇到烦恼的时候也不总是一个人想办法。','希望明年的圣诞节你也会过得很开心。','Jacob']);
 expect(jacobChristmasLetterReveals).toHaveLength(6);for(let i=1;i<6;i++)expect(jacobChristmasLetterReveals[i]).toBeGreaterThan(jacobChristmasLetterReveals[i-1]+1000);expect(jacobChristmasLetterWrittenAt).toBeGreaterThan(jacobChristmasLetterReveals[5]+1000);
});

test('the letter follows the new color line and returns to the supplied envelope narration without reading Day13',()=>{
 const day=jacobExpandedDay(25) as unknown as JacobDay,index=day.beats.findIndex(b=>b.kind==='lines'&&b.lines?.at(-1)?.body===jacobChristmasLetterAnchor);
 expect(index).toBeGreaterThan(0);expect(day.beats[index+1].lines!.slice(0,2).map(l=>l.body)).toEqual(['裴俊英没有立刻打开你送给他的贺卡。','他先看了一会儿信封上的名字，才小心地将封口拆开。']);
 const p:JacobProgress={day:25,beat:index,cursor:{position:0},clues:[],affinity:50,open:true,jacobChristmasLetterOpen:true};Object.defineProperty(p,'jacobCard',{get(){throw Error('Read Day13 card');}});
 expect(()=>renderToStaticMarkup(<JacobExpandedScene progress={p} update={()=>{}} identityKey="test" score={50} player="玩家" mailOpen={false} onMail={()=>{}} onFinish={()=>{}} onClue={()=>{}} note={(_,body)=><div>{body}</div>} highlight={body=>body}/>)).not.toThrow();
});
