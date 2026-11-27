import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JacobExpandedScene } from "./JacobExpandedScene";
import { jacobExpandedDay, type JacobDay, type JacobProgress } from "./jcodeExpandedStory";
import { JacobGingerbreadPhoto, jacobGingerbreadPhotoSrc } from "./JacobGingerbreadPhoto";

test('both gingerbread choices open the photo and preserve the common continuation',()=>{
 const day=jacobExpandedDay(21) as unknown as JacobDay,index=day.beats.findIndex(b=>b.kind==='choice'&&b.options?.some(o=>o.lines.at(-1)?.body==='现在完成了。'));
 expect(index).toBeGreaterThan(0);expect(day.beats[index].options![1].lines.some(l=>l.body==='他又拿来一点糖霜，在另一侧添了一个小小的口袋。')).toBe(true);
 expect(day.beats[index+1].lines![0].body).toBe('家养小精灵拿来两个小纸袋，帮你们将姜饼装好。');
 const p:JacobProgress={day:21,beat:index,option:1,cursor:{position:0},clues:[],affinity:50,open:true,jacobGingerbreadPhotoOpen:true};
 const props={progress:p,update:()=>{},identityKey:'test',score:50,player:'玩家',mailOpen:false,onMail:()=>{},onFinish:()=>{},onClue:()=>{},note:(_:string,body:string)=><div>{body}</div>,highlight:(body:string)=>body};
 expect(renderToStaticMarkup(<JacobExpandedScene {...props}/>)).toContain('jacob-gingerbread-picture');
 expect(renderToStaticMarkup(<JacobExpandedScene {...props} progress={{...p,option:0}}/>)).toContain('jacob-gingerbread-picture');
 expect(renderToStaticMarkup(<JacobExpandedScene {...props} progress={{...p,beat:0}}/>)).not.toContain('jacob-gingerbread-picture');
 expect(renderToStaticMarkup(<JacobExpandedScene {...props} progress={{...p,day:20}}/>)).not.toContain('jacob-gingerbread-picture');
});

test('the supplied photograph is a single whole clickable image without extra visible controls',()=>{
 const html=renderToStaticMarkup(<JacobGingerbreadPhoto onContinue={()=>{}}/>);expect(html).toContain(jacobGingerbreadPhotoSrc);expect((html.match(/<button/g)||[]).length).toBe(1);expect((html.match(/<img/g)||[]).length).toBe(1);expect(html).not.toContain('继续</button>');
});
