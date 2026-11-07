import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HogwartsDevice } from "./HogwartsDevice";
import { people } from "./HogwartsCharacters";
import { compileStory } from "../story-engine/compiler";
import story from "../../stories/hyunjae/story.json";
import { initialRuntime } from "../schema";
import { choose, dispatch } from "../engine";
import { gateRouteDays, qRouteWork, qProgressKey, qAlbumClues, qEndingCopy } from "./routeWork";
import { albumNoticeKey } from "./albumNotices";

afterEach(() => vi.unstubAllGlobals());
describe("published Q snow popup", () => {
  it.each([false, true])("shows the completed sixth-day clue only until explicitly acknowledged (%s)", acknowledged => {
    const original = compileStory(story).work;
    const work = gateRouteDays(qRouteWork(original));
    let state = dispatch(work, initialRuntime(work), "start");
    const history: string[] = [];
    for (let step = 0; state.variables.q_completed_day !== 6 && step < 100; step++) {
      const target = state.choices[0].target;
      history.push(target);
      state = choose(work, state, target);
    }
    const identity = { name: "试玩", house: "ravenclaw", year: 6, loveInterest: "q", runId: "album-test" };
    const record = { version: 2, choices: history, readDays: [1, 2, 3, 4, 5, 6], acknowledgedClues: [], time: "17:00" };
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === qProgressKey(identity) ? JSON.stringify(record)
      : key === albumNoticeKey(identity) ? JSON.stringify({ acknowledged: acknowledged ? ["q-photo-snow"] : [], completedDays: [6] }) : null });
    const html = renderToStaticMarkup(<HogwartsDevice work={original} identity={identity} contacts={people} onRestart={() => {}} />);
    expect(html.includes('aria-labelledby="album-clue-title"')).toBe(!acknowledged);
    if (!acknowledged) {
      expect(html).toContain("魔法相册解锁新内容");
      expect(html).toContain("圆窗外的初雪");
    }
  });
});


describe("restored Q match conversations stay outside the paper", () => {
  it.each(["intro", "reaction"] as const)("restores %s into the ordinary dialogue surface", conversation => {
    const original = compileStory(story).work;
    const work = gateRouteDays(qRouteWork(original));
    let state = dispatch(work, initialRuntime(work), "start");
    const history: string[] = [];
    for (let step = 0; state.date !== "2026-12-12" && step < 150; step++) {
      const target = state.choices[0].target;
      history.push(target);
      state = choose(work, state, target);
    }
    expect(state.date).toBe("2026-12-12");
    const identity = { name: "试玩", house: "ravenclaw", year: 6, loveInterest: "q", runId: "match-test" };
    const saved = { version: 2, choices: history, readDays: [6], acknowledgedClues: ["q-photo-snow"],
      match: { step: conversation === "intro" ? "bet" : "ready", team: "斯莱特林", stake: 1, conversation } };
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === qProgressKey(identity) ? JSON.stringify(saved) : null });
    const html = renderToStaticMarkup(<HogwartsDevice work={original} identity={identity} contacts={people} onRestart={() => {}} />);
    expect(html).toContain('aria-labelledby="match-conversation-title"');
    expect(html).toContain("scene-dialogue");
    expect(html).not.toContain("hogwarts-wager");
    expect(html).not.toContain("谁的扫帚先得意？");
    expect(html).not.toContain('aria-labelledby="scene-title"');
  });
});


it("opens the direct day-twelve preview in character conversation, before the paper or match", () => {
  const original = compileStory(story).work;
  vi.stubGlobal("localStorage", { getItem: () => null });
  const identity = { name: "试玩", house: "ravenclaw", year: 6, loveInterest: "q", runId: "review-q-day12" };
  const html = renderToStaticMarkup(<HogwartsDevice previewDay={12} work={original} identity={identity} contacts={people} onRestart={() => {}} />);
  expect(html).toContain("D12/31");
  expect(html).toContain('aria-labelledby="match-conversation-title"');
  expect(html).not.toContain('aria-labelledby="scene-title"');
  expect(html).not.toContain("hogwarts-wager");
  expect(html).not.toContain('aria-labelledby="album-clue-title"');
});

it("announces the newly added day-fourteen clue to an existing day-sixteen save", () => {
  const original = compileStory(story).work;
  const work = gateRouteDays(qRouteWork(original));
  let state = dispatch(work, initialRuntime(work), "start");
  const history: string[] = [];
  for (let step = 0; state.variables.q_completed_day !== 16 && step < 250; step++) {
    const target = state.choices[0].target;
    history.push(target);
    state = choose(work, state, target);
  }
  const identity = { name: "试玩", house: "ravenclaw", year: 6, loveInterest: "q", runId: "existing-day16" };
  const saved = { version: 2, choices: history, readDays: Array.from({ length: 16 }, (_, index) => index + 1),
    acknowledgedClues: ["q-photo-snow"], time: "17:00" };
  vi.stubGlobal("localStorage", { getItem: (key: string) => key === qProgressKey(identity) ? JSON.stringify(saved) : null });
  const html = renderToStaticMarkup(<HogwartsDevice work={original} identity={identity} contacts={people} onRestart={() => {}} />);
  expect(html).toContain("D16/31");
  expect(html).toContain('aria-labelledby="album-clue-title"');
  expect(html).toContain("在魔法相册中查看「银叶别针」。");
});

it.each([
  { branch: 0, read: false, acknowledged: false, unlocked: false, popup: false },
  { branch: 0, read: true, acknowledged: false, unlocked: true, popup: true },
  { branch: 0, read: true, acknowledged: true, unlocked: true, popup: false },
  { branch: 1, read: true, acknowledged: false, unlocked: false, popup: false },
])("restores the ball clue from the final choice ($branch, read=$read, acknowledged=$acknowledged)", ({
  branch, read, acknowledged, unlocked, popup,
}) => {
  const original = compileStory(story).work;
  const work = gateRouteDays(qRouteWork(original));
  let state = dispatch(work, initialRuntime(work), "start");
  const history: string[] = [];
  for (let step = 0; state.variables.q_completed_day !== 24 && step < 250; step++) {
    const choice = state.choices.find(entry => entry.target === `q-day24-stage2-${branch}`) ?? state.choices[0];
    history.push(choice.target);
    state = choose(work, state, choice.target);
  }
  expect(state.variables.q_completed_day).toBe(24);
  const identity = { name: "试玩", house: "ravenclaw", year: 6, loveInterest: "q", runId: "existing-day24" };
  const readDays = Array.from({ length: read ? 24 : 23 }, (_, index) => index + 1);
  const saved = { version: 2, choices: history, readDays, time: "20:00",
    acknowledgedClues: ["q-photo-snow", "q-photo-silver-leaf", ...(acknowledged ? ["q-photo-ball-arch"] : [])] };
  vi.stubGlobal("localStorage", { getItem: (key: string) => key === qProgressKey(identity) ? JSON.stringify(saved) : null });
  const html = renderToStaticMarkup(<HogwartsDevice work={original} identity={identity} contacts={people} onRestart={() => {}} />);
  expect(html.includes("在魔法相册中查看「石拱门下」。")).toBe(popup);
  expect(qAlbumClues(readDays, state.completed).some(clue => clue.id === "q-photo-ball-arch")).toBe(unlocked);
});

it.each([
  { kind: "together", title: "恋人结局 · 一起下楼", score: 100, gift: false },
  { kind: "together", title: "恋人结局 · 一起下楼", score: 100, gift: true },
  { kind: "friends", title: "朋友结局 · 给我留一局", score: 66, gift: false },
  { kind: "unspoken", title: "暧昧结局 · 明早见", score: 93, gift: false },
] as const)("restores Q's $kind finale through the shared album and ending page (gift=$gift)", ({ kind, title, score, gift }) => {
  const original = compileStory(story).work;
  const work = gateRouteDays(qRouteWork(original, 4));
  const initial = initialRuntime(work);
  if (gift) initial.variables.q_affection = 5;
  let state = dispatch(work, initial, "start");
  const history: string[] = [];
  for (let step = 0; state.choices.length && step < 250; step++) {
    const gain = (target: string) => Number(work.nodes.find(node => node.id === target)?.actions
      .find(action => action.type === "increment" && action.key === "q_affection")?.value ?? 0);
    const first = state.choices[0];
    expect(state.choices.some(entry => entry.target === "q-ending-friends")).toBe(false);
    const choice = state.choices.find(entry => (kind === "unspoken" && (entry.target === "q-day24-stage2-1"
        || /^q-day(?:2[7-9]|3[01])-stage[01]-1$/.test(entry.target)))
        || (kind === "together" && /^q-day31-stage[01]-1$/.test(entry.target))
        || (gift && /^q-day27-stage[01]-1$/.test(entry.target)))
      ?? state.choices.reduce((best, entry) => (kind === "friends" ? gain(entry.target) < gain(best.target) : gain(entry.target) > gain(best.target)) ? entry : best, first);
    history.push(choice.target);
    state = choose(work, state, choice.target);
  }
  expect(state.variables.q_completed_day).toBe(31);
  expect(state.endings).toEqual([`q-${kind}`]);
  const finale = (state.messages.scene ?? []).map(entry => entry.body).join("\n").split("12月31日｜").slice(1).join("\n");
  expect(finale).toContain(kind !== "together" ? "到窗边才叫出来" : "你手指动了一下");
  expect(finale).toContain("一簇烟花从湖对岸升起来");
  expect(finale.indexOf("一簇烟花从湖对岸升起来")).toBeLessThan(finale.lastIndexOf("池昌民："));
  const identity = { name: "试玩", house: "ravenclaw", year: 6, loveInterest: "q", runId: "q-finale" };
  const readDays = Array.from({ length: 31 }, (_, index) => index + 1);
  const earlierClues = ["q-photo-snow", "q-photo-silver-leaf", "q-photo-ball-arch", "q-photo-paper-stars"];
  for (const phase of ["reading", "memory", "ending", "lobby"] as const) {
    const saved = { version: 2, choices: history, readDays: phase === "reading" ? readDays.slice(0, -1) : readDays,
      acknowledgedClues: ["ending", "lobby"].includes(phase) ? [...earlierClues, "photo-new-year"] : earlierClues,
      reviewingEnding: phase === "lobby", time: "23:55", jealousy: 3 };
    vi.stubGlobal("localStorage", { getItem: (key: string) => key === qProgressKey(identity) ? JSON.stringify(saved)
      : gift && key === "foundphone-hogwarts-shopping-v1-q-finale" ? JSON.stringify({ gifts: { "zonkos-1-q": 1 } }) : null });
    const html = renderToStaticMarkup(<HogwartsDevice work={original} identity={identity} contacts={people} onRestart={() => {}} />);
    expect(html.includes('aria-labelledby="final-memory-title"')).toBe(phase === "memory");
    const showsEnding = phase === "ending";
    expect(html.includes('aria-label="31天结算"')).toBe(showsEnding);
    if (phase === "lobby") {
      expect(html).toContain('aria-label="通关后的游戏大厅"');
      for (const label of ["查看结局", "查看余额", "打开活点地图", "打开魔法相册"]) {
        expect(html).toContain(`>${label}</button>`);
      }
      expect(html).not.toContain("结束这一天");
      expect(html).not.toContain("夜里 · 去西廊窗边");
    }
    if (phase === "memory") {
      expect(html).toContain(qEndingCopy(kind).memory);
      expect(html).toContain(">查看结局</button>");
    }
    if (showsEnding) {
      expect(html).toContain(title);
      expect(html).toContain(qEndingCopy(kind).text);
      expect(html).toContain('src="./portraits/q.webp" alt="池昌民"');
      expect(html).toContain(`好感度 ${score}% · 嫉妒值 3%`);
      expect(html).toContain('class="ending-back"');
      expect(html).toContain('class="ending-restart"');
      expect(html).toContain(">重新开始</button>");
      expect(html).not.toContain("保存结局画面");
      expect(html).not.toContain(">归档</button>");
    }
  }
});
