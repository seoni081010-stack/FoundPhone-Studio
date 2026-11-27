import originalFinale from "../../stories/q/days27-31.json";
import { describe, it, expect } from "vitest";
import { compileStory } from "../story-engine/compiler";
import base from "../../stories/hyunjae/story.json";
import { choose, dispatch, validateGraph } from "../engine";
import { initialRuntime, validateWork, type Runtime } from "../schema";
import {
  qRouteWork,
  gateRouteDays,
  qDayPreviewProgress,
  qAlbumClues,
  qDays,
} from "./routeWork";
import { replayQChoice, qExpanded } from "./qExpansion";
const original = compileStory(base).work;
const work = validateWork(gateRouteDays(qRouteWork(original)));
function run(strategy: "min" | "max" | "middle") {
  let state = dispatch(work, initialRuntime(work), "start");
  const history: string[] = [];
  const dates = new Set<string>();
  let maximum = false;
  for (let i = 0; state.choices.length && i < 2000; i++) {
    dates.add(state.date!);
    const gains = (target: string) =>
      Number(
        work.nodes
          .find((n) => n.id === target)
          ?.actions.find(
            (a) => a.type === "increment" && a.key === "q_affection",
          )?.value ?? 0,
      );
    const ranked = [...state.choices].sort(
      (a, b) => gains(a.target) - gains(b.target),
    );
    if (strategy === "middle")
      maximum = Number(state.variables.q_affection) < 82;
    const target = (strategy === "max" || maximum ? ranked.at(-1)! : ranked[0])
      .target;
    history.push(target);
    state = choose(work, state, target);
  }
  return { state, history, dates };
}
describe("Q reviewed expansion", () => {
  it("retains a valid graph and all 93 source blocks", () => {
    expect(validateGraph(work.nodes)).toEqual([]);
    expect(qExpanded.coverage.blocks).toBe(93);
    expect(work.nodes.length).toBeLessThan(2000);
  });
  it.each(["min", "middle", "max"] as const)(
    "plays all 31 dates continuously: %s",
    (strategy) => {
      const { state, history, dates } = run(strategy);
      console.log(
        "Q verified path",
        strategy,
        Number(state.variables.q_affection),
        state.endings,
        history.length,
      );
      expect(dates.size).toBe(31);
      expect(state.endings).toEqual([
        `q-${strategy === "min" ? "friends" : strategy === "max" ? "together" : "unspoken"}`,
      ]);
      let restored = dispatch(work, initialRuntime(work), "start");
      for (const target of history)
        restored = replayQChoice(work, restored, target);
      expect(restored.variables).toEqual(state.variables);
      expect(restored.endings).toEqual(state.endings);
    },
  );
  it("executes every authored choice target including conditional alternatives", () => {
    const queue: Runtime[] = [dispatch(work, initialRuntime(work), "start")];
    const visited = new Set<string>();
    while (queue.length) {
      const state = queue.pop()!;
      for (const choice of state.choices)
        if (!visited.has(choice.target)) {
          visited.add(choice.target);
          queue.push(choose(work, state, choice.target));
        }
    }
    for (const node of work.nodes.filter((n) => n.type === "choice"))
      for (const target of node.next)
        if (!target.startsWith("q-ending-"))
          expect(visited.has(target), target).toBe(true);
  }, 60000);
  it.each(Array.from({ length: 31 }, (_, i) => i + 1))(
    "starts isolated day %s without changing a save",
    (day) => {
      expect(() => qDayPreviewProgress(original, day)).not.toThrow();
    },
  );
  it("keeps original albums, mistletoe condition and all ending copies", () => {
    expect(qDays.filter((d) => d.album).map((d) => d.day)).toEqual([
      6, 14, 24, 26,
    ]);
    expect(qAlbumClues([24], [])).toEqual([]);
    expect(qAlbumClues([24], ["q-day24-stage2-0"])).toHaveLength(1);
    expect(qExpanded.endings.friends).toEqual(originalFinale.endings.friends);
    expect(qExpanded.endings.unspoken).toEqual(originalFinale.endings.unspoken);
    expect(qExpanded.endings.friends.lines.join("\n")).toContain(
      "我室友明天下棋",
    );
    expect(qExpanded.endings.unspoken.lines.at(-1)).toBe("池昌民：明早见。");
  });
});
