import { afterEach, describe, expect, it, vi } from "vitest";
import { compileStory } from "../story-engine/compiler";
import { choose, dispatch, validateGraph } from "../engine";
import { initialRuntime, validateWork } from "../schema";
import hyunjaeStory from "../../stories/hyunjae/story.json";
import { gateRouteDays, qDays, qLetters, qRouteWork, readQProgress } from "./routeWork";
import { characterLocations } from "./characterLocations";

const work = validateWork(gateRouteDays(qRouteWork(compileStory(hyunjaeStory).work)));
afterEach(() => vi.unstubAllGlobals());

describe("Q's reviewed sixteen-day route", () => {
  it.each([0, 1])("completes all days using branch %s without skipping a date boundary", branch => {
    expect(validateGraph(work.nodes)).toEqual([]);
    let state = dispatch(work, initialRuntime(work), "start");
    const days = new Set([state.date]);
    const history: string[] = [];
    for (let step = 0; state.choices.length && step < 250; step++) {
      const target = state.choices[state.choices.length === 2 ? branch : 0].target;
      history.push(target);
      const previousDay = state.date;
      state = choose(work, state, target);
      if (state.date !== previousDay) expect(target).toMatch(/^q-day(?:0[2-9]|1[0-6])-stage0$/);
      days.add(state.date);
    }
    expect([...days]).toEqual(Array.from({ length: 16 }, (_, index) => `2026-12-${String(index + 1).padStart(2, "0")}`));
    expect(state.variables.q_completed_day).toBe(16);
    expect(state.variables.scene_place).toBe("城堡外的小路");
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
    expect(snow.album?.body).toBe("槲寄生勾住你的帽沿。他说“别动”，靠近替你拨开叶片，肩上落着细雪。");
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

describe("Q's reviewed additions", () => {
  it("continues a completed six-day save, with no day-seven restart or skipped choice", () => {
    let state = dispatch(work, initialRuntime(work), "start");
    const history: string[] = [];
    while ((state.date ?? "") < "2026-12-06" || state.variables.q_completed_day !== 6) {
      const target = state.choices[0].target;
      history.push(target);
      state = choose(work, state, target);
    }
    expect(state.choices[0].target).toBe("q-day07-stage0");
    const restored = history.reduce((previous, target) => choose(work, previous, target), dispatch(work, initialRuntime(work), "start"));
    expect(choose(work, restored, restored.choices[0].target).date).toBe("2026-12-07");
  });
  it("keeps consecutive face choices in one meeting, and only mail-to-face transitions require travel", () => {
    const travel = work.nodes.filter(node => node.id.endsWith("-travel"));
    expect(travel.map(node => node.id)).toEqual(["q-day02-stage0-travel", "q-day05-stage0-travel", "q-day14-stage0-travel"]);
    expect(work.nodes.find(node => node.id === "q-day16-stage0-tail")?.next).toEqual(["q-day16-stage1"]);
    const letter = qDays.find(day => day.day === 14)!.stages[0];
    expect(letter.channel).toBe("mail");
    expect(letter.time).toBe("12:30");
    expect(letter.choices.map(choice => choice.label)).toEqual(["好，下课后见。"]);
  });
  it("preserves approved edits and each holiday-answer continuation", () => {
    const day16 = qDays.find(day => day.day === 16)!;
    expect(day16.stages[1].choices[0].lines.at(-1)).toBe("池昌民：那……你的回答呢？");
    expect(day16.stages[2].choices[0].lines.at(-1)).toBe("你：好，一起过。");
    expect(day16.stages[2].choices[1].lines.at(-1)).toBe("你：好，我确定下来就告诉你。");
    expect(day16.stages[0].tail.join("\n")).toContain("“圣诞假期”“留校”");
    const additions = qDays.filter(day => day.day >= 7);
    const prose = JSON.stringify(additions);
    expect(prose).not.toMatch(/宿管|自己先没绷住|撞疼了|那再点一杯|我不一定看得懂|这次没了/);
    expect(JSON.stringify(day16)).not.toContain("酒窝");
    expect(qDays.find(day => day.day === 12)?.match?.closing).toContain("你：好啊。");
  });
  it("shows Q's authored positions on every character's map", () => {
    for (const selected of ["hyunjae", "q", "eric"]) {
      for (const [day, time, expected] of [[9, "16:00", "猫头鹰棚屋"], [13, "14:00", "佐科魔法笑话店"], [13, "15:00", "三把扫帚"], [14, "17:00", "城堡西侧长廊"], [15, "19:00", "三楼高窗石廊"], [16, "16:00", "温室外侧露台"]]) {
        const locations = characterLocations(Number(day), String(time), selected);
        expect(locations).toHaveLength(7);
        expect(locations.find(person => person.id === "q")?.place).toBe(expected);
      }
    }
  });
});
