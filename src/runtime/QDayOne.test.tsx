import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HogwartsDevice } from "./HogwartsDevice";
import { people } from "./HogwartsCharacters";
import { compileStory } from "../story-engine/compiler";
import { choose, dispatch } from "../engine";
import { initialRuntime, validateWork } from "../schema";
import hyunjaeStory from "../../stories/hyunjae/story.json";
import { characterRouteWork, qRouteWork } from "./routeWork";
import { MaraudersMap } from "./MaraudersMap";
import story from "../../stories/q/day01.json";

describe("Q first day", () => {
  it("keeps authored plots separate and leaves unwritten routes ready for their own content", () => {
    const original = compileStory(hyunjaeStory).work;
    expect(characterRouteWork(original, "hyunjae")).toBe(original);
    expect(characterRouteWork(original, "q").nodes.some(node => node.id.startsWith("hy-"))).toBe(false);
    for (const person of people.filter(person => !["hyunjae", "q"].includes(person.id))) {
      const route = validateWork(characterRouteWork(original, person.id));
      const runtime = dispatch(route, initialRuntime(route), "start");
      expect(runtime.messages.owlpost ?? []).toEqual([]);
      expect(route.nodes).toHaveLength(1);
      expect(route.title).toContain(person.name);
    }
  });
  it("uses the normal four-app phone for Q without leaking Hyunjae's route", () => {
    const work = compileStory(hyunjaeStory).work;
    const html = renderToStaticMarkup(<HogwartsDevice work={work} identity={{ name: "玩家", house: "ravenclaw", year: 6, loveInterest: "q", runId: "q-test" }} contacts={people} onRestart={() => {}} />);
    const dock = html.match(/<nav[^>]*aria-label="学生手机应用"[\s\S]*?<\/nav>/)?.[0] ?? "";
    for (const label of ["魔法相册", "猫头鹰信箱", "巫师手札", "Date"]) expect(dock).toContain(label);
    expect(dock).not.toContain("今日行程");
    expect(html).toContain("09:00");
    expect(html).not.toContain("你是不是忘了什么东西");
  });
  it("shows all names inside the map, only the selected person in its header, and no roster below", () => {
    const html = renderToStaticMarkup(<MaraudersMap day={1} time="11:00" selectedId="q" />);
    const header = html.match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? "";
    expect(header).toContain("池昌民");
    expect(header).not.toContain("李贤在");
    const map = html.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? "";
    for (const person of people) expect(map).toContain(person.name);
    expect(html).not.toContain("marauder-locations");
    expect(html).not.toContain("<ul");
  });
  it.each([0, 1])("runs Q branch %s through the shared event engine", index => {
    const work = validateWork(qRouteWork(compileStory(hyunjaeStory).work));
    const start = dispatch(work, initialRuntime(work), "start");
    expect(start.choices).toHaveLength(2);
    const next = choose(work, start, `q-day01-${index}`);
    expect(next.variables.q_day1_complete).toBe(true);
    expect(next.variables.q_day1_choice).toBe(index);
    expect(next.endings).toEqual([]);
    expect(next.choices).toEqual([]);
  });
  it("keeps both approved branches and the revised bookmark reaction", () => {
    expect(story.choices).toHaveLength(2);
    expect(story.opening).toContain("池昌民：改了好几遍，这一版也翻不过来。");
    expect(story.choices[1].lines).toContain("你还没说话，他自己先笑了，拿本子挡住半张脸。");
    expect(story.choices[1].lines).toContain("池昌民：你就当没看见吧。");
    expect(story.mail[4].text).toBe("是我没说清楚要找什么。");
  });
});
