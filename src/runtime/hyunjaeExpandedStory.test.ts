import { hyunjaeLegacyMatch } from "./hyunjaeExpandedStory";
import { castleLocation } from "./castleFloors";
import { expect, test } from "vitest";
import legacy from "../../stories/hyunjae/story.json";
import { hyunjaeDay, hyunjaeCondition, hyunjaeEndingFor, hyunjaeNextBeat, hyunjaeText, type HyDay, type HyIdentity, type HyProgress } from "./hyunjaeExpandedStory";
import { initialAffinity } from "./HogwartsCharacters";

function play(policy: (id: string, count: number) => number, identity: HyIdentity, team = "斯莱特林") {
  const p: HyProgress = { day: 1, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: true, hyunjaeChoices: {} };
  const choices = new Set<string>(); const events: { day: number; text: string; time: string; kind: string }[] = [];
  const base = initialAffinity(identity.year, identity.house, { year: 7, house: "gryffindor" });
  for (let day = 1; day <= 31; day++) {
    p.day = day;
    if (day === 19) p.hyunjaeVoucherAt19 = p.team === "斯莱特林" && !p.wagerClaimed;
    for (let index = 0; ; index++) {
      const story = hyunjaeDay(day, p.ending ?? hyunjaeEndingFor(p.affinity + base)) as unknown as HyDay;
      index = hyunjaeNextBeat(story, index, p, identity);
      const b = story.beats[index]; if (!b) break;
      let lines = b.lines ?? [];
      if (b.kind === "choice") {
        const option = policy(b.id!, b.options!.length); p.hyunjaeChoices![b.id!] = option;
        const chosen = b.options![option]; p.affinity += chosen.affinity; lines = [{ speaker: "你", body: chosen.body }, ...chosen.lines];
        choices.add(`${b.id}:${option}`);
        if (b.id === "31:final") p.ending = option === 2 ? "friends" : hyunjaeEndingFor(p.affinity + base);
      }
      if (b.kind === "wager") { p.team = team; p.wagerStake = 7; }
      if (b.kind === "wish") p.hyunjaeWish = { draft: "愿我勇敢。", submitted: "愿我勇敢。", via: p.hyunjaeChoices!["17:2"] === 0 ? "tree" : "message" };
      if (b.kind === "clue") p.clues.push(b.clue!.id);
      events.push({ day, time: b.time, kind: b.kind, text: lines.map(l => hyunjaeText(l.body, p, "玩家名")).join("\n") });
      if (day === 19 && b.when.includes("voucher-held")) p.wagerClaimed = true;
    }
  }
  return { p, events, choices, base };
}
const houses = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff"];
const identities = houses.flatMap(house => [5, 6, 7].map(year => ({ house, year })));

test.each(identities)("31 continuous days keep lover and unspoken reachable for $house year $year", identity => {
  const high = play(() => 0, identity), low = play(() => 1, identity);
  expect(high.p.ending).toBe("together"); expect(low.p.ending).toBe("unspoken");
  expect(high.p.affinity + high.base).toBeGreaterThanOrEqual(100);
  expect(low.p.affinity + low.base).toBeLessThan(100);
  expect(high.p.clues).toEqual(["photo-snow", "hyunjae-food-note", "hyunjae-wish", "photo-ball-mistletoe", "photo-new-year"]);
  expect(low.p.clues).toEqual(["hyunjae-food-note", "hyunjae-wish", "photo-new-year"]);
  expect(high.p.hyunjaeWish?.via).toBe("tree"); expect(low.p.hyunjaeWish?.via).toBe("message");
  for (const result of [high, low]) expect(new Set(result.events.map(e => e.day)).size).toBe(31);
});

test("all expanded choice options are reachable and explicit friendship remains independent of score", () => {
  const covered = new Set<string>();
  for (let seed = 0; seed < 180; seed++) {
    let value = seed + 1;
    const result = play((id, count) => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return (value >>> 8) % count; }, identities[seed % identities.length], seed % 2 ? "格兰芬多" : "斯莱特林");
    for (const id of result.choices) covered.add(id);
    if (result.p.hyunjaeChoices!["31:final"] === 2) expect(result.p.ending).toBe("friends");
  }
  for (let day = 1; day <= 31; day++) for (const beat of (hyunjaeDay(day) as unknown as HyDay).beats) {
    if (beat.kind === "choice") for (let i = 0; i < beat.options!.length; i++) expect(covered.has(`${beat.id}:${i}`), `${beat.id}:${i}`).toBe(true);
  }
});

test("shared wager resolves at 15:30, persists to day 19, and never turns a losing prediction into a voucher", () => {
  for (const team of ["格兰芬多", "斯莱特林"]) {
    const result = play(() => 0, identities[0], team);
    expect(result.events.find(e => e.day === 12 && e.text.includes("抓住了金色飞贼"))?.time).toBe("15:30");
    expect(result.events.find(e => e.kind === "wager-result")?.time).toBe("15:30");
    expect(result.p.wagerClaimed === true).toBe(team === "斯莱特林");
    expect(result.events.filter(e => e.day === 19).some(e => e.text.includes("韦斯莱家的那两个孩子"))).toBe(team === "斯莱特林");
  }
});

test("unexperienced snow, scarf and sugar memories are gated by the actual selected responses", () => {
  const result = play(() => 1, identities[0]);
  const all = (day: number) => result.events.filter(e => e.day === day).map(e => e.text).join("\n");
  expect(all(7)).not.toContain("围巾里面还有雪");
  expect(all(24)).not.toContain("初雪那天，我们不是也看见过吗");
  expect(all(20)).not.toContain("……你不会还记得我那天说了什么吧");
  expect(all(24)).toContain("看来你那天系得还挺牢的");
  expect(all(24)).not.toContain("17号约定");
  expect(all(9)).toContain("今天这个汤比昨天的还淡");
});

test("the approved original endings remain verbatim, except for the requested lover-only wish insertion", () => {
  for (const [kind, id] of [["together", "hy-ending-high"], ["unspoken", "hy-ending-low"], ["friends", "hy-ending-friends"]] as const) {
    const old = legacy.events.find(e => e.id === id)!.actions!.filter(a => a.type === "message").map(a => String(a.value)).join("\n");
    const story = hyunjaeDay(31, kind) as unknown as HyDay;
    const lines = story.beats.at(-2)!.lines!;
    const text = lines.map(l => l.speaker ? `${l.speaker}：${l.body}` : l.body).join("\n");
    const normalized = text.replace(/\n他低头笑了好一会儿，忽然想起了什么。\n李贤在：还记得我们一起在圣诞树上挂的愿望吗？\n你：当然记得。\n李贤在看着你，眉眼间的笑意怎么也藏不住。\n李贤在：我的愿望好像已经实现了。/, "");
    expect(normalized).toBe(old);
    expect(story.ending!.id).toBe(`hyunjae-${kind}`);
    expect(text.includes("我的愿望好像已经实现了。")).toBe(kind === "together");
  }
});

test("unknown conditions fail loudly and player template values are escaped as text by the renderer", () => {
  const p = play(() => 0, identities[0]).p;
  expect(() => hyunjaeCondition("typo", p, identities[0])).toThrow();
  expect(hyunjaeText("{{playerName}}", p, "<玩家>" )).toBe("<玩家>");
  expect(hyunjaeEndingFor(99)).toBe("unspoken"); expect(hyunjaeEndingFor(100)).toBe("together");
});

test("all 29 authored Hyunjae scene locations have explicit map placements", () => {
  for (let day = 1; day <= 31; day++) for (const beat of (hyunjaeDay(day) as unknown as HyDay).beats) {
    if (beat.channel === "scene" && !beat.place.includes("魔法相册")) expect(castleLocation(beat.place).explicit, beat.place).toBe(true);
  }
  expect(castleLocation("霍格沃茨外侧回廊").floor).toBe("grounds");
});

test("player-only classes never move Hyunjae into the player's classroom", () => {
  for (const day of [9, 14]) {
    const first = (hyunjaeDay(day) as unknown as HyDay).beats[0];
    expect(first.hyunjaePresent).toBe(false);
  }
});

test("legacy paid bets migrate without charging again or inventing a different team", () => {
  expect(hyunjaeLegacyMatch({ step: "bet", team: "斯莱特林", stake: 7 })).toEqual({});
  expect(hyunjaeLegacyMatch({ step: "pub", team: "斯莱特林", stake: 7 })).toEqual({ team: "斯莱特林", wagerStake: 7, wagerClaimed: false, hyunjaeLegacyWager: true });
  const p: HyProgress = { day: 12, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: true, ...hyunjaeLegacyMatch({ step: "done", team: "斯莱特林", stake: 7 }) };
  const story = hyunjaeDay(12) as unknown as HyDay;
  const wager = story.beats.findIndex(b => b.kind === "wager");
  const restored = hyunjaeNextBeat(story, wager, p, identities[0]);
  expect(restored).toBeGreaterThan(wager);
  expect(story.beats[restored].when).toContain("!team-gryffindor");
  expect(hyunjaeCondition("voucher-held", p, identities[0])).toBe(false);
});
