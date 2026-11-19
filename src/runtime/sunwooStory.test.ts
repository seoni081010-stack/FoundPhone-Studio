import { expect, test } from "vitest";
import { sunwooDays, sunwooEndings, sunwooEndingFor, sunwooDay, sunwooName, sunwooItinerary, type SunwooLine } from "./sunwooStory";
import { characterLocations } from "./characterLocations";
import { knownMapPoint } from "./mapLocations";
const raw = import.meta.glob("../../story-archive/sunwoo-day*.md", { eager:true, query:"?raw", import:"default" }) as Record<string,string>;
const allDays=[...sunwooDays,...Object.values(sunwooEndings)];
const speechSources=new Set<string>();
const normalize=(text:string)=>text.replaceAll("**","").trim();

test("all 31 days, authored choices and exact source lines are present",()=>{
  expect(sunwooDays.map(d=>d.day)).toEqual(Array.from({length:30},(_,i)=>i+1));
  for(const day of allDays) for(const beat of day.beats){
    expect(beat.time).toMatch(/^\d{1,2}:\d{2}$/);expect(beat.place).not.toBe("");
    const check=(line:SunwooLine)=>{
      if(!line.source)return;
      const {file,line:number}=line.source;
      const source=normalize(raw[`../../story-archive/${file}`].split(/\r?\n/)[number-1]);
      const speech=source.match(/^[^：:]+[：:]\s*「(.*)」$/);
      const body=speech?.[1]??source.replace(/^【(?:旁白[^】]*|修订补充[^】]*)】/,"").trim().replace(/^\*|\*$/g,"");
      expect(line.body,`${file}:${number}`).toBe(body);
      if(speech)speechSources.add(`${file}:${number}`);
    };
    if(beat.kind==="lines")beat.lines.forEach(check);
    if(beat.kind==="team")beat.options.flat().forEach(check);
    if(beat.kind==="choice"){
      expect(beat.options).toHaveLength(2);
      beat.options.forEach(option=>{
        const source=(option as typeof option & {source:{file:string;line:number}}).source;
        const original=normalize(raw[`../../story-archive/${source.file}`].split(/\r?\n/)[source.line-1]);
        expect(original).toContain(`「${option.body}」`);expect(original).toContain(`+${option.affinity}`);
        option.lines.forEach(check);
      });
    }
  }
  // Every character speech and fixed player reply in the confirmed archives is used.
  for(const [path,source] of Object.entries(raw))source.split(/\r?\n/).forEach((row,index)=>{
    const text=normalize(row);
    if(/^(金善旴|你(?:（点击）)?|Morag|孙英宰|队友|主持人|摊主|图书馆管理员|老巫师|学生[甲乙]?|画像里的老巫师)：\s*「/.test(text)){
      expect(speechSources.has(`${path.split('/').at(-1)}:${index+1}`),`${path}:${index+1}`).toBe(true);
    }
  });
});

test("all B without optional mail, mixed replies and all A reach the shared 80/100 endings",()=>{
  let low=0,medium=0,high=0;
  for(const day of sunwooDays)for(const beat of day.beats)if(beat.kind==="choice"){
    if(beat.channel==="scene")low+=beat.options[1].affinity??0;
    medium+=beat.options[1].affinity??0;
    high+=beat.options[0].affinity??0;
  }
  expect([low,medium,high]).toEqual([67,93,186]);
  expect([low,medium,high].map(sunwooEndingFor)).toEqual(["unspoken","friends","together"]);
  expect([79,80,99,100].map(sunwooEndingFor)).toEqual(["unspoken","friends","friends","together"]);
});

test("three independent finale texts keep their own final sentence and approved lover replies",()=>{
  const final=["风曾把一张羊皮纸送到你面前，而从今往后，金善旴会亲自走向你。","往后每一场初雪，你们仍然可以并肩看，只是不再等待同一个答案。","那场雪终于落到了故事的最后一页，而你们的名字，始终没有写进同一句话里。"];
  expect(Object.values(sunwooEndings).map(d=>d.ending.text)).toEqual(final);
  expect(Object.values(sunwooEndings).map(d=>d.title)).toEqual(["等你走过来","还会一起看雪","好像差一点"]);
  for(const [index,day] of Object.values(sunwooEndings).entries()){
    const beats=day.beats;
    const last=beats.at(-1);expect(last?.kind).toBe("clue");
    const transcript=JSON.stringify(beats);
    final.forEach((text,other)=>expect(transcript.includes(text)).toBe(index===other));
    expect(sunwooDay(31,day.ending.kind)).toBe(day);
  }
  const finalChoice=sunwooEndings.together.beats.filter(b=>b.kind==="choice").at(-1);
  expect(finalChoice?.kind==="choice"&&finalChoice.options.map(o=>o.body)).toEqual(["我愿意。","你怎么现在才问啊？"]);
  expect(sunwooName("{{playerName}}，新年快乐。","测试姓名")).toBe("测试姓名，新年快乐。");
});

test("album updates and all authored scene locations are explicit",()=>{
  expect(sunwooDays.flatMap(d=>d.beats.flatMap(b=>b.kind==="clue"?[[d.day,b.clue.title]]:[]))).toEqual([[6,"窗边的槲寄生"],[12,"目光所及"],[24,"比槲寄生更早"]]);
  for(let day=1;day<=31;day++)for(const stage of sunwooItinerary(day))expect(knownMapPoint(stage.place),`${day} ${stage.place}`).toBeDefined();
  const match=sunwooDay(12);
  expect(match.beats.filter(b=>b.kind==="wager")).toHaveLength(1);
  expect(match.beats.filter(b=>b.kind==="wager-result")).toHaveLength(1);
  expect(match.beats.filter(b=>b.kind==="team")).toHaveLength(1);
  expect(match.beats.findIndex(b=>b.kind==="clue")).toBeLessThan(match.beats.findIndex(b=>b.channel==="mail"));
});

test("Day 8's waiting paragraph is common to both mail branches",()=>{
  const day=sunwooDay(8);
  const choiceIndex=day.beats.map((b,i)=>[b,i] as const).filter(([b])=>b.kind==="choice")[1][1];
  const choice=day.beats[choiceIndex];
  expect(choice.kind).toBe("choice");
  if(choice.kind!=="choice")return;
  expect(choice.options.every(option=>!option.lines.some(line=>line.body.startsWith("接下来的将近一个小时")))).toBe(true);
  expect(JSON.stringify(day.beats[choiceIndex+1])).toContain("接下来的将近一个小时");
});


test("Sunwoo's after-midnight finale does not move his marker during the morning",()=>{
  expect(characterLocations(31,"09:00","q").find(p=>p.id==="sunwoo")?.place).not.toContain("塔楼露台");
  expect(characterLocations(31,"23:40","q").find(p=>p.id==="sunwoo")?.place).toContain("塔楼露台");
  expect(characterLocations(31,"00:05","q").find(p=>p.id==="sunwoo")?.place).toContain("塔楼露台");
});
