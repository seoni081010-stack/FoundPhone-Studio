import { afterEach, describe, expect, it, vi } from "vitest";
import { compileStory } from "../story-engine/compiler";
import { choose, dispatch, validateGraph } from "../engine";
import { initialRuntime, validateWork } from "../schema";
import hyunjaeStory from "../../stories/hyunjae/story.json";
import { gateRouteDays, qDays, qLetters, qRouteWork, readQProgress } from "./routeWork";
import { characterLocations } from "./characterLocations";

const work = validateWork(gateRouteDays(qRouteWork(compileStory(hyunjaeStory).work)));
afterEach(() => vi.unstubAllGlobals());

describe("Q's reviewed six-day route", () => {
  it.each([0, 1])("completes all days using branch %s without skipping a date boundary", branch => {
    expect(validateGraph(work.nodes)).toEqual([]);
    let state = dispatch(work, initialRuntime(work), "start");
    const days = new Set([state.date]);
    const history: string[] = [];
    for (let step = 0; state.choices.length && step < 50; step++) {
      const target = state.choices[state.choices.length === 2 ? branch : 0].target;
      history.push(target);
      const previousDay = state.date;
      state = choose(work, state, target);
      if (state.date !== previousDay) expect(target).toMatch(/^q-day0[2-6]-stage0$/);
      days.add(state.date);
    }
    expect([...days]).toEqual(["2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
    expect(state.variables.q_completed_day).toBe(6);
    expect(state.variables.scene_place).toBe("城堡外的石桥");
    expect(state.choices).toEqual([]);
    expect(state.endings).toEqual([]);
    expect(qLetters(state.messages.owlpost ?? []).some(entry => entry.day === 2 && entry.outgoing)).toBe(true);
    expect(qLetters(state.messages.owlpost ?? []).some(entry => entry.day === 5)).toBe(true);
    const face = (state.messages.scene ?? []).map(entry => entry.body).join("\n");
    expect(face).toContain("画像里的老巫师：");
    expect(face).toContain("这槲寄生挂得也太低了。");
    expect(face).not.toContain("你：这是什么？");
    let replayed = dispatch(work, initialRuntime(work), "start");
    for (const target of history) replayed = choose(work, replayed, target);
    expect(replayed.date).toBe(state.date);
    expect(replayed.variables).toEqual(state.variables);
  });
  it("uses the approved B choices and adds just the approved snow clue", () => {
    const snow = qDays.find(day => day.day === 6)!;
    expect(snow.stages[0].choices.map(choice => choice.label)).toEqual([
      "走啊，第一场雪当然要出去看。", "刚修好椅子，让我多坐一会儿嘛。",
    ]);
    expect(qDays.filter(day => day.album)).toHaveLength(1);
    expect(snow.album?.body).toBe("雪落在他袖口上，他举着手，等你凑近来看。");
  });
  it("migrates the published first-day save into the extended route", () => {
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify({ choice: 1, finished: true, mailRead: 6 }) });
    const saved = readQProgress("test");
    expect(saved.legacy).toBe(true);
    expect(saved.readDays).toEqual([1]);
    const start = dispatch(work, initialRuntime(work), "start");
    const restored = saved.choices.reduce((state, target) => choose(work, state, target), start);
    expect(restored.date).toBe("2026-12-01");
    expect(restored.choices[0].target).toBe("q-day02-stage0");
    expect(saved.extraMail).toHaveLength(6);
  });
  it("updates map positions from authored visit times", () => {
    const location = (day: number, time: string) => characterLocations(day, time, "hyunjae").find(person => person.id === "q")?.place;
    expect(location(3, "20:00")).toBe("图书馆外的走廊");
    expect(location(4, "16:00")).toBe("画像后的小房间");
    expect(location(5, "15:00")).toBe("蜂蜜公爵");
    expect(location(6, "16:00")).toBe("画像后的小房间");
    expect(location(6, "17:00")).toBe("城堡外的石桥");
  });
});
