import { describe, expect, it } from "vitest";
import { juyeonDays, juyeonEndings, juyeonEndingFor, juyeonStage } from "./juyeonStory";
import { knownMapPoint } from "./mapLocations";
import { characterLocations } from "./characterLocations";
import { sharedRules } from "./sharedRules";

const raw = import.meta.glob("../../story-archive/juyeon-day*-full.md", { eager: true, query: "?raw", import: "default" }) as Record<string,string>;
const tidy = (s:string) => s.replaceAll("**", "").trim();
describe("Approved Juyeon route", () => {
  it("contains every day and source-backed text, reply and choice verbatim", () => {
    expect(juyeonDays.map(day=>day.day)).toEqual(Array.from({length:30},(_,i)=>i+1));
    for(const day of [...juyeonDays,...Object.values(juyeonEndings)])for(const beat of day.beats){
      const lines = beat.kind === "lines" ? beat.lines : beat.kind === "choice" ? beat.options.flatMap(option=>[option,...option.lines]) : [];
      for(const line of lines){
        const source = (line as {source?:{file:string;line:number}}).source;
        expect(source).toBeDefined();
        const original=tidy(raw[`../../story-archive/${source!.file}`].split(/\r?\n/)[source!.line-1]);
        expect(original).toContain(line.body);
      }
    }
  });
  it("does not omit or duplicate authored speech or options in any source file",()=>{
    for(const [path,text] of Object.entries(raw)){
      const name=path.split('/').at(-1)!;
      if(!/^juyeon-day(?:01-02|\d\d)-full.md$/.test(name))continue;
      const sourceLines=text.split(/\r?\n/).map(tidy);
      const stories=name.includes('31')?[juyeonEndings.together,juyeonEndings.friends,juyeonEndings.unspoken]:juyeonDays;
      const emitted=stories.flatMap(day=>day.beats.flatMap(beat=>beat.kind==='lines'?beat.lines:beat.kind==='choice'?beat.options.flatMap(o=>[o,...o.lines]):beat.kind==='clue'?(beat.sources??[]).map(source=>({source,body:beat.clue.body})):[]));
      sourceLines.forEach((line,i)=>{
        if(!/^(?:[^：:]{1,40}[：:]「.*」|[AB][.]「.*」(?:（\+\d+）)?)$/.test(line))return;
        const matches=emitted.filter(item=>{
          const s=(item as {source?:{file:string;line:number}}).source;return s?.file===name&&s.line===i+1;
        });
        expect(matches.length,`${name}:${i+1}`).toBe(name.includes('31')&&i+1<134?3:1);
      });
    }
  });
  it("preserves the three full distinct letters, choices and exact final sentences",()=>{
    const finals={together:'新年的第一颗星星亮起时，他终于不用再把喜欢藏进未寄出的信里。',friends:'有些故事不必以爱情收尾，也依然值得在往后的每一年里，慢慢写下去。',unspoken:'新年的钟声已经敲响，而那句差一点说出口的喜欢，仍然停在故事的最后一页。'};
    for(const kind of ['together','friends','unspoken'] as const){
      const d=juyeonEndings[kind];expect(d.ending.text).toBe(finals[kind]);
      expect(d.beats.filter(b=>b.kind==='choice')).toHaveLength(4);
      expect(d.beats.filter(b=>'endingGate'in b&&b.endingGate)).toHaveLength(1);
      const gate=d.beats.findIndex(b=>b.endingGate);expect(d.beats.slice(gate).flatMap(b=>b.kind==='lines'?b.lines:[]).length).toBeGreaterThan(25);
    }
    expect(juyeonEndingFor(79)).toBe('unspoken');expect(juyeonEndingFor(80)).toBe('friends');expect(juyeonEndingFor(100)).toBe('together');
    expect(sharedRules.confessionAffinity).toBe(100);
  });
  it("maps every authored scene without falling back to the default corridor",()=>{
    for(const day of [...juyeonDays,juyeonEndings.together])for(const [index,beat]of day.beats.entries()){
      if(beat.channel!=='scene')continue;
      expect(knownMapPoint(beat.place),`${day.day} ${beat.time} ${beat.place}`).toBeDefined();
      expect(juyeonStage(day.day,index).place).toBe(beat.place);
    }
    expect(characterLocations(31,'00:08','juyeon').find(p=>p.id==='juyeon')?.place).toBe('黑湖湖畔的大山毛榉树下');
  });
  it("keeps reviewed album copy, match interruption and interleaved morning mail",()=>{
    const clues=[...juyeonDays,juyeonEndings.together].flatMap(day=>day.beats.flatMap(beat=>beat.kind==='clue'?[beat.clue.title]:[]));
    expect(clues).toEqual(['初雪下的银铃','槲寄生下的半步','装在书页里的星空','未寄出的星光']);
    expect(juyeonDays[11].beats.filter(b=>b.kind==='wager'||b.kind==='wager-result').map(b=>b.kind)).toEqual(['wager','wager-result']);
    expect(juyeonDays[16].beats[0].channel).toBe('mail');
    expect(juyeonDays[16].beats.some(b=>b.channel==='scene'&&b.time==='16:30')).toBe(true);
  });
});
