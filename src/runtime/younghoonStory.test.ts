import { expect, test } from "vitest";
const sources = import.meta.glob("../../story-archive/younghoon-day*-full.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
import { younghoonDays, younghoonEndings } from "./younghoonStory";

test("Younghoon retains 1–24 and adds all approved finale days and mail branches", () => {
  expect(younghoonDays.map(day => day.day)).toEqual(Array.from({length:31},(_,i)=>i+1));
  expect(younghoonDays.slice(24).map(day => day.beats.filter(b => b.kind === "choice").length)).toEqual([3,2,2,2,3,2,1]);
  for (const day of younghoonDays.slice(24)) {
    const mail = day.beats.find(b => b.kind === "mail");
    expect(mail?.kind).toBe("mail");
    if (mail?.kind === "mail") {
      expect(mail.mail.options).toHaveLength(2);
      expect(mail.mail.options.every(o=>o[0].speaker === "你" && o.length > 1)).toBe(true);
      expect(mail.mail.tail.filter(l=>l.speaker === "你").length).toBeGreaterThan(1);
    }
  }
});

test("every authored dialogue and narration line survives verbatim across all branches", () => {
  const compiled = JSON.stringify([younghoonDays.slice(24),younghoonEndings]);
  for (let day=25;day<=31;day++) {
    const source=sources[`../../story-archive/younghoon-day${day}-full.md`];
    const rows=source.split(/\r?\n/);
    for (const raw of rows) {
      const row=raw.trim().replace(/^\*\*(.*?)\*\*/,"$1");
      if (!row || /^(#|>|【|固定回复|玩家固定回复|玩家回复|后续通信|设定：|道具：|《|[AB]$|[ABC]｜|金泳勋：$|END·|魔法相册|连续性|触发提示|12月\d+日 ·)/.test(row)) continue;
      const text=row.match(/^(?:金泳勋|你)：「(.*)」$/)?.[1] ?? row.replace(/^\*|\*$/g,"");
      expect(compiled.includes(text), `Day ${day}: ${text}`).toBe(true);
    }
  }
});

test("finale delivers mail before confession, memory before endings, and independent page copy", () => {
  const beats=younghoonDays[30].beats;
  expect(beats.findIndex(b=>b.kind === "mail")).toBeLessThan(beats.findIndex(b=>b.kind === "clue"));
  expect(beats.at(-1)?.kind).toBe("ending");
  expect(younghoonDays.slice(24).flatMap(d=>d.beats.flatMap(b=>b.kind === "clue" ? [b.clue.title] : [])))
    .toEqual(["计划之外","写在冬天里的愿望"]);
  expect(Object.values(younghoonEndings).map(e=>e.text)).toEqual([
    "原来所有计划之外的心动，都有一个共同的名字。",
    "有些心意没能得到回应，但相遇本身依然值得珍惜。",
    "故事停在了这一页，而下一行，谁也还没有写下。",
  ]);
  expect(new Set(Object.values(younghoonEndings).map(e=>e.reply)).size).toBe(3);
});
