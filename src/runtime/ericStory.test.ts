import { describe, expect, it } from "vitest";
import { ericDays, ericEndings, ericEndingFor, ericStage, ericVisibleLines } from "./ericStory";
import { knownMapPoint } from "./mapLocations";
import { characterLocations } from "./characterLocations";
import { sharedRules } from "./sharedRules";

const raw = import.meta.glob("../../story-archive/eric-day*-full.md", { eager: true, query: "?raw", import: "default" }) as Record<string,string>;
const tidy = (s:string) => s.replaceAll("**", "").trim();
describe("Approved Eric route", () => {
  it("contains every day and source-backed text, reply and choice verbatim", () => {
    expect(ericDays.map(day=>day.day)).toEqual(Array.from({length:30},(_,i)=>i+1));
    for(const day of [...ericDays,...Object.values(ericEndings)])for(const beat of day.beats){
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
      if(!/^eric-day(?:01-02|\d\d)-full.md$/.test(name))continue;
      const sourceLines=text.split(/\r?\n/).map(tidy);
      const stories=name.includes('31')?[ericEndings.together,ericEndings.friends,ericEndings.unspoken]:ericDays;
      const emitted=stories.flatMap(day=>day.beats.flatMap(beat=>beat.kind==='lines'?beat.lines:beat.kind==='choice'?beat.options.flatMap(o=>[o,...o.lines]):beat.kind==='clue'?(beat.sources??[]).map(source=>({source,body:beat.clue.body})):[]));
      sourceLines.forEach((line,i)=>{
        if(!/^(?:[^：:]{1,40}[：:]「.*」|[AB][.]「.*」(?:（\+\d+）)?)$/.test(line))return;
        const matches=emitted.filter(item=>{
          const s=(item as {source?:{file:string;line:number}}).source;return s?.file===name&&s.line===i+1;
        });
        expect(matches.length,`${name}:${i+1}`).toBe(name.includes('31')&&i+1<178?3:1);
      });
    }
  });
  it("preserves the three full distinct letters, choices and exact final sentences",()=>{
    const finals={together:'他曾为一瞬的金色奔赴整片天空，而今，他有了比金色更值得奔赴的人。',friends:'故事没有停在这个冬天，属于你们的友谊，还有无数个等待开场的春日。',unspoken:'他曾伸手触及无数次遥不可及的金色，这一次，却没能握住近在咫尺的你。'};
    for(const kind of ['together','friends','unspoken'] as const){
      const d=ericEndings[kind];expect(d.ending.text).toBe(finals[kind]);
      expect(d.beats.filter(b=>b.kind==='choice')).toHaveLength(5);
      expect(d.beats.filter(b=>'endingGate'in b&&b.endingGate)).toHaveLength(1);
      const gate=d.beats.findIndex(b=>b.endingGate);expect(d.beats.slice(gate).flatMap(b=>b.kind==='lines'?b.lines:[]).length).toBeGreaterThan(25);
    }
    expect(ericEndingFor(79)).toBe('unspoken');expect(ericEndingFor(80)).toBe('friends');expect(ericEndingFor(100)).toBe('together');
    expect(sharedRules.confessionAffinity).toBe(100);
  });
  it("maps every authored scene without falling back to the default corridor",()=>{
    for(const day of [...ericDays,ericEndings.together])for(const [index,beat]of day.beats.entries()){
      if(beat.channel!=='scene')continue;
      expect(knownMapPoint(beat.place),`${day.day} ${beat.time} ${beat.place}`).toBeDefined();
      expect(ericStage(day.day,index).place).toBe(beat.place);
    }
    expect(characterLocations(31,'23:45','eric').find(p=>p.id==='eric')?.place).toBe('霍格沃茨·魁地奇球场');
  });
  it("keeps reviewed album copy, match interruption and interleaved morning mail",()=>{
    const clues=[...ericDays,ericEndings.together].flatMap(day=>day.beats.flatMap(beat=>beat.kind==='clue'?[beat.clue.title]:[]));
    expect(clues).toEqual(['合拢的翅膀','初雪与槲寄生','购物清单之外','第三个生日愿望','槲寄生下的私心','比胜利更珍贵']);
    expect(ericDays[11].beats.filter(b=>b.kind==='wager'||b.kind==='wager-result').map(b=>b.kind)).toEqual(['wager','wager-result']);
    expect(ericDays[21].beats[0].channel).toBe('mail');
    expect(ericDays[21].beats.some(b=>b.channel==='scene'&&b.time==='14:20')).toBe(true);
  });
});

describe('Eric technical source exceptions and isolation',()=>{
  it('never unlocks the sixth clue on either non-lover ending, and keeps Day30 deleted option absent',()=>{
    for(const kind of ['friends','unspoken'] as const)expect(ericEndings[kind].beats.some(b=>b.kind==='clue')).toBe(false);
    expect(ericDays[29].beats.filter(b=>b.kind==='choice')).toHaveLength(5);
    const day=ericDays[24];const choice=day.beats.filter(b=>b.kind==='choice')[3];
    expect(choice.kind==='choice'&&choice.options.map(o=>o.affinity)).toEqual([2,1]);
    const shared=ericDays[23].beats.filter(b=>b.kind==='lines').flatMap(b=>b.lines).map(l=>l.body);
    expect(shared).toContain('你伸手回抱了他。');
    expect(shared).toContain('希望你度过一个很幸福的圣诞节。');
  });
});

it('shows the authored Day19 lamp premise only after 1B',()=>{
 const day=ericDays[18], index=day.beats.findIndex(b=>b.kind==='choice');
 const lines=day.beats.flatMap(b=>b.kind==='lines'?b.lines:[]);
 const premise='刚才听你说想做一个放在床边的。';
 expect(ericVisibleLines(lines,{[`19:${index}`]:0}).some(l=>l.body===premise)).toBe(false);
 expect(ericVisibleLines(lines,{[`19:${index}`]:1}).some(l=>l.body===premise)).toBe(true);
});
