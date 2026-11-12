import { afterEach, describe, expect, it, vi } from "vitest";
import { compileStory } from "../story-engine/compiler";
import { choose, dispatch, validateGraph } from "../engine";
import { initialRuntime, validateWork } from "../schema";
import hyunjaeStory from "../../stories/hyunjae/story.json";
import { qDayPreviewProgress, gateRouteDays, qAlbumClues, qDays, qLetters, qRouteWork, readQProgress } from "./routeWork";
import { characterLocations } from "./characterLocations";
import { characterStatus, initialAffinity, people } from "./HogwartsCharacters";
import { savedGiftAffinity } from "./MagicalShops";

const work = validateWork(gateRouteDays(qRouteWork(compileStory(hyunjaeStory).work)));
afterEach(() => vi.unstubAllGlobals());

describe("Q's reviewed twenty-six-day route", () => {
  it.each([0, 1])("completes all days using branch %s without skipping a date boundary", branch => {
    expect(validateGraph(work.nodes)).toEqual([]);
    let state = dispatch(work, initialRuntime(work), "start");
    const days = new Set([state.date]);
    const history: string[] = [];
    for (let step = 0; state.choices.length && state.variables.q_completed_day !== 26 && step < 250; step++) {
      const target = state.choices[state.choices.length === 2 ? branch : 0].target;
      history.push(target);
      const previousDay = state.date;
      state = choose(work, state, target);
      if (state.date !== previousDay) expect(target).toMatch(/^q-day(?:0[2-9]|1[0-9]|2[0-6])-stage0$/);
      days.add(state.date);
      if (state.variables.q_completed_day === 19 && state.date === "2026-12-19")
        expect(characterStatus("q", 6, "ravenclaw", state.variables).affinity).toBeLessThanOrEqual(47);
    }
    expect([...days]).toEqual(Array.from({ length: 26 }, (_, index) => `2026-12-${String(index + 1).padStart(2, "0")}`));
    expect(state.variables.q_completed_day).toBe(26);
    expect(state.variables.scene_place).toBe("城堡西侧长廊");
    expect(state.choices[0]?.target).toBe("q-day27-stage0");
    expect(state.variables.q_affection).toBeLessThanOrEqual(85);
    expect(characterStatus("q", 6, "ravenclaw", state.variables).affinity).toBeLessThanOrEqual(89);
    const scenes = (state.messages.scene ?? []).map(entry => entry.body).join("\n");
    expect(scenes).toContain(branch === 0 ? "池昌民：我们现在过去？" : "池昌民：第一支舞，你现在想跳吗？");
    expect(scenes).not.toContain(branch === 0 ? "池昌民：第一支舞，你现在想跳吗？" : "池昌民：我们现在过去？");
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
  it("uses the approved B choices and keeps the reviewed snow and silver-leaf clues", () => {
    const snow = qDays.find(day => day.day === 6)!;
    expect(snow.stages[0].choices.map(choice => choice.label)).toEqual([
      "走啊，第一场雪当然要出去看。", "刚修好椅子，让我多坐一会儿嘛。",
    ]);
    expect(qDays.filter(day => day.album).map(day => day.day)).toEqual([6, 14, 24, 26]);
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
    const additions = qDays.filter(day => day.day >= 7 && day.day <= 16);
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


it("opens a fresh sixth-day preview without reading or changing a real sixteenth-day save", () => {
  const getItem = vi.fn(() => JSON.stringify({ version: 2, readDays: [16] }));
  const setItem = vi.fn();
  vi.stubGlobal("localStorage", { getItem, setItem });
  const preview = qDayPreviewProgress(compileStory(hyunjaeStory).work, 6);
  expect(preview.readDays).toEqual([1, 2, 3, 4, 5]);
  const state = preview.choices.reduce((previous, target) => choose(work, previous, target), dispatch(work, initialRuntime(work), "start"));
  expect(state.date).toBe("2026-12-06");
  expect(state.messages.scene?.at(-1)?.body).toContain("12月6日｜");
  expect(getItem).not.toHaveBeenCalled();
  expect(setItem).not.toHaveBeenCalled();
});


it("starts the match-day preview before betting and suppresses earlier album notices", () => {
  const preview = qDayPreviewProgress(compileStory(hyunjaeStory).work, 12);
  const state = preview.choices.reduce((previous, target) => choose(work, previous, target), dispatch(work, initialRuntime(work), "start"));
  expect(state.date).toBe("2026-12-12");
  expect(preview.time).toBe("14:00");
  expect(preview.readDays).not.toContain(12);
  expect(preview.acknowledgedClues).toContain("q-photo-snow");
  expect(state.variables.q_completed_day).toBe(11);
});


it("unlocks the approved silver-leaf album after day fourteen and uses the existing notification queue", async () => {
  const { nextAlbumNotice } = await import("./albumNotices");
  const gift = qDays.find(day => day.day === 14)!;
  expect(gift.album).toEqual({ id: "q-photo-silver-leaf", title: "银叶别针",
    body: "翻过银叶，背面刻着一只很小的甲虫，藏在细细的叶脉之间。和他书页上画的那只一样。你抬头看向槲寄生，回过眼时，他正看着你。" });
  const unlocked = (readDays: number[]) => qDays.flatMap(day => day.album && readDays.includes(day.day) ? [{ ...day.album, unlocked: true }] : []);
  expect(nextAlbumNotice(unlocked([6]), ["q-photo-snow"], false)).toBeUndefined();
  expect(nextAlbumNotice(unlocked([6, 14]), ["q-photo-snow"], true)).toBeUndefined();
  expect(nextAlbumNotice(unlocked([6, 14]), ["q-photo-snow"], false)?.id).toBe("q-photo-silver-leaf");
  expect(nextAlbumNotice(unlocked([6, 14]), ["q-photo-snow", "q-photo-silver-leaf"], false)).toBeUndefined();
});

it("resumes a completed day-16 save and announces the third clue after day 26", async () => {
  const original = compileStory(hyunjaeStory).work;
  const oldWork = validateWork(gateRouteDays({
    ...qRouteWork(original),
    nodes: qRouteWork(original).nodes
      .filter(node => !/^q-(?:day(?:1[7-9]|2[0-9]|3[01])-|ending-)/.test(node.id))
      .map(node => node.id === "q-day16-stage2-tail" ? { ...node, next: [] } : node),
  }));
  const history: string[] = [];
  let state = dispatch(oldWork, initialRuntime(oldWork), "start");
  while (state.choices.length && history.length < 250) {
    history.push(state.choices[0].target);
    state = choose(oldWork, state, history.at(-1)!);
  }
  expect(state.variables.q_completed_day).toBe(16);
  const resumed = history.reduce((previous, target) => choose(work, previous, target), dispatch(work, initialRuntime(work), "start"));
  expect(resumed.choices[0]?.target).toBe("q-day17-stage0");
  expect(choose(work, resumed, resumed.choices[0].target).date).toBe("2026-12-17");

  const { nextAlbumNotice } = await import("./albumNotices");
  const acknowledged = ["q-photo-snow", "q-photo-silver-leaf"];
  const unlocked = (day: number) => qAlbumClues(Array.from({ length: day }, (_, index) => index + 1), []);
  expect(nextAlbumNotice(unlocked(25), acknowledged, false)).toBeUndefined();
  expect(nextAlbumNotice(unlocked(26), acknowledged, true)).toBeUndefined();
  expect(nextAlbumNotice(unlocked(26), acknowledged, false)).toMatchObject({
    id: "q-photo-paper-stars", title: "纸上的星星", body: expect.stringContaining("等放晴了，带她去看真的。"),
  });
});

it("caps every character's starting affinity at four", () => {
  for (const person of people) {
    expect(initialAffinity(person.year, person.house, person)).toBe(4);
    for (const year of [5, 6, 7]) {
      for (const house of ["gryffindor", "slytherin", "ravenclaw", "hufflepuff"])
        expect(initialAffinity(year, house, person)).toBeLessThanOrEqual(4);
    }
  }
});

it("ignores an old inflated affinity while retaining recorded gift points", () => {
  vi.stubGlobal("localStorage", { getItem: (key: string) => key === "q-save"
    ? JSON.stringify({ version: 2, choices: ["q-day01-0"], readDays: [1], affinity: 100, jealousy: 3 })
    : key === "foundphone-hogwarts-shopping-v1-run"
      ? JSON.stringify({ gifts: { "malkins-1-q": 1, "malkins-1-hyunjae": 5, "zonkos-1-q": 2 } })
      : null });
  const saved = readQProgress("q-save");
  const restored = saved.choices.reduce((previous, target) => choose(work, previous, target),
    dispatch(work, initialRuntime(work), "start"));
  expect(restored.variables.q_affection).toBe(1);
  expect(saved).not.toHaveProperty("affinity");
  expect(saved.jealousy).toBe(3);
  expect(savedGiftAffinity("run", "q")).toBe(12);
});

it("previews the complete last day from a separate run with enough affinity for the confession", () => {
  const getItem = vi.fn();
  const setItem = vi.fn();
  vi.stubGlobal("localStorage", { getItem, setItem });
  const preview = qDayPreviewProgress(compileStory(hyunjaeStory).work, 31);
  let state = preview.choices.reduce((previous, target) => choose(work, previous, target),
    dispatch(work, initialRuntime(work), "start"));
  expect(state.date).toBe("2026-12-31");
  expect(state.variables.q_affection).toBe(95);
  expect(preview.time).toBe("23:45");
  expect(preview.readDays).toHaveLength(30);
  expect(preview.acknowledgedClues).toContain("q-photo-ball-arch");
  expect(preview.acknowledgedClues).not.toContain("photo-new-year");
  state = choose(work, state, "q-day31-stage0-0");
  expect(state.choices.map(choice => choice.target)).toEqual(["q-day31-stage1-0", "q-day31-stage1-1"]);
  state = choose(work, state, "q-day31-stage1-0");
  expect(state.endings).toEqual(["q-together"]);
  expect(getItem).not.toHaveBeenCalled();
  expect(setItem).not.toHaveBeenCalled();
});

it.each([[79, "friends"], [80, "unspoken"], [99, "unspoken"], [100, "together"]] as const)(
  "automatically resolves displayed affinity %s to %s", (score, kind) => {
    const original = compileStory(hyunjaeStory).work;
    const route = gateRouteDays(qRouteWork(original, 4));
    const preview = qDayPreviewProgress(original, 31);
    let state = preview.choices.reduce((previous, target) => choose(route, previous, target),
      dispatch(route, initialRuntime(route), "start"));
    state = choose(route, state, "q-day31-stage0-0");
    state.variables.q_affection = score - 4 - 2;
    state = choose(route, state, "q-day31-stage1-1");
    expect(characterStatus("q", 6, "ravenclaw", state.variables).affinity).toBe(score);
    expect(state.endings).toEqual([`q-${kind}`]);
  },
);
