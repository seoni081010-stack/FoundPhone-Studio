import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HogwartsDevice } from "./HogwartsDevice";
import { people } from "./HogwartsCharacters";
import { compileStory } from "../story-engine/compiler";
import story from "../../stories/hyunjae/story.json";
import { initialRuntime } from "../schema";
import { choose, dispatch } from "../engine";
import { gateRouteDays, qRouteWork, qProgressKey } from "./routeWork";
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
