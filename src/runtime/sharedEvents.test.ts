import { expect, test } from "vitest";
import hyunjae from "../../stories/hyunjae/story.json";
import { jcodeDays } from "./jcodeStory";
import { younghoonDays, younghoonStage } from "./younghoonStory";
import { sunwooDay } from "./sunwooStory";
import { juyeonDay } from "./juyeonStory";
import { ericDay } from "./ericStory";
import { qDays } from "./routeWork";
import { quidditchStage } from "./quidditchStage";
import { characterLocations } from "./characterLocations";

for (const [name, day] of [["sunwoo", sunwooDay(12)], ["juyeon", juyeonDay(12)], ["eric", ericDay(12)]] as const) {
  test(`${name}: match starts at 10:30, resolves at 15:30 and subsequent scenes stay ordered`, () => {
    const wager = day.beats.findIndex(beat => beat.kind === "wager");
    const start = day.beats.slice(wager + 1).find(beat => beat.kind === "lines" && beat.lines.some(line => /哨声|哨响/.test(line.body)));
    expect(start?.time).toBe("10:30");
    expect(day.beats.find(beat => beat.kind === "wager-result")?.time).toBe("15:30");
    const times = day.beats.map(beat => beat.time);
    expect(times).toEqual([...times].sort());
  });
}

test.each([false, true])("legacy script match times follow existing saved cursors (%s)", younghoon => {
  const day = (younghoon ? younghoonDays : jcodeDays)[11];
  const wager = day.beats.findIndex(beat => beat.kind === "wager");
  const result = day.beats.findIndex(beat => beat.kind === "lines" && beat.lines.some(line => /比赛结束.*斯莱特林获胜/.test(line.body)));
  expect(quidditchStage(day, 0, 0)?.time).toBe("10:10");
  expect(quidditchStage(day, wager + 1, 0)?.time).toBe("10:30");
  expect(quidditchStage(day, result + 1, 0)?.time).toBe("15:30");
  if (younghoon) expect(younghoonStage(12, result + 1, 0).time).toBe("15:30");
});

test("all seven map markers remain at the match throughout the shared match window", () => {
  for (const time of ["10:30", "13:00", "15:30"]) {
    const locations = characterLocations(12, time, "hyunjae");
    expect(locations).toHaveLength(7);
    expect(locations.every(person => person.place === "魁地奇球场" && person.activity === "魁地奇比赛")).toBe(true);
  }
  const day = qDays.find(day => day.day === 12)!;
  expect(day.stages.every(stage => stage.time === "10:30")).toBe(true);
  expect(day.stages.at(-1)?.endTime).toBe("15:30");
});

test("Jacob waits until day 6 for snow, and the existing fireworks-free finales gain a common fireworks scene", () => {
  expect(JSON.stringify(jcodeDays[0])).not.toContain("飘起了细雪");
  expect(JSON.stringify(jcodeDays[5])).toContain("第一场雪");
  const common = jcodeDays[30].beats.filter(beat => beat.kind !== "ending");
  expect(JSON.stringify(common)).toContain("烟花从城堡后方升起");
  const events = hyunjae.events;
  expect(JSON.stringify(events.find(event => event.id === "hy-day31-scene"))).toContain("烟花在城堡上空缓缓绽开");
  expect(JSON.stringify(events.find(event => event.id === "hy-day29-scene"))).toContain("灯展已经开始了");
});
