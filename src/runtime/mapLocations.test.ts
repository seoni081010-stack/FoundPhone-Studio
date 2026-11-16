import { expect, test } from "vitest";
import { knownMapPoint, mapPoint } from "./mapLocations";
import { younghoonDays, younghoonItinerary, younghoonStage } from "./younghoonStory";
import { characterLocations } from "./characterLocations";

test("every Younghoon day and authored scene resolves to an explicit map point", () => {
  for (const day of younghoonDays) for (const stage of younghoonItinerary(day.day)) {
    expect(knownMapPoint(stage.place), `${day.day} ${stage.place}`).toBeDefined();
    expect(mapPoint(stage.place)).not.toEqual(mapPoint("长廊"));
    expect(characterLocations(day.day, stage.time, "younghoon").find(p => p.id === "younghoon")?.place).toBe(stage.place);
  }
});

test("observatory and tower aliases share coordinates instead of falling back to a corridor", () => {
  expect(mapPoint("旧观测室")).toEqual(mapPoint("霍格沃茨旧观测室"));
  expect(mapPoint("旧观测室门口")).not.toEqual(mapPoint("旧观测室"));
  expect(mapPoint("拉文克劳塔楼附近的走廊")).toEqual(mapPoint("霍格沃茨拉文克劳塔楼附近的走廊"));
});

test("Day 24 changes to the ball at its original narration without changing saved beat indices", () => {
  const day = younghoonDays[23];
  const beatIndex = day.beats.findIndex(b => b.kind === "lines" && b.lines.some(l => l.body.startsWith("夜幕降临时")));
  const beat = day.beats[beatIndex];
  expect(beat.kind).toBe("lines");
  if (beat.kind !== "lines") return;
  let step = -1, narration = false;
  for (const line of beat.lines) {
    if (line.speaker || !narration) step++;
    narration = !line.speaker;
    if (line.body.startsWith("夜幕降临时")) break;
  }
  expect(younghoonStage(24, beatIndex, step - 1).time).toBe("16:00");
  expect(younghoonStage(24, beatIndex, step)).toEqual({ schedule: "12月24日 · 19:00 · 霍格沃茨礼堂外", time: "19:00", place: "霍格沃茨礼堂外" });
  expect(younghoonStage(24, beatIndex + 1, 0).place).toBe("霍格沃茨礼堂外");
});
