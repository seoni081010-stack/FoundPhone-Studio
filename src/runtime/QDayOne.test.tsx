import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QDayOne } from "./QDayOne";
import story from "../../stories/q/day01.json";

describe("Q first day", () => {
  it("opens the selected route with a map entry and no Hyunjae dialogue", () => {
    const html = renderToStaticMarkup(<QDayOne identity={{ name: "玩家", house: "ravenclaw", year: 6, runId: "q-test" }} />);
    expect(html).toContain("Hogwarts Unspoken · 池昌民");
    expect(html).toContain("查看活点地图");
    expect(html).not.toContain("你是不是忘了什么东西");
  });
  it("keeps both approved branches and the revised bookmark reaction", () => {
    expect(story.choices).toHaveLength(2);
    expect(story.opening).toContain("池昌民：改了好几遍，这一版也翻不过来。");
    expect(story.choices[1].lines).toContain("你还没说话，他自己先笑了，拿本子挡住半张脸。");
    expect(story.choices[1].lines).toContain("池昌民：你就当没看见吧。");
    expect(story.mail[4].text).toBe("是我没说清楚要找什么。");
  });
});
