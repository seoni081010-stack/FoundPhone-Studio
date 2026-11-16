import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JcodeScene } from "./JcodeScene";

test.each([false, true])("both script routes start with one typed narration block (%s)", younghoon => {
  const html = renderToStaticMarkup(<JcodeScene younghoon={younghoon}
    progress={{day:1,beat:0,cursor:{position:0},clues:[],affinity:0,open:true}}
    update={() => {}} identityKey="typewriter-check" affinity={0} onFinish={() => {}}
    note={(name,body,outgoing,key) => <div key={key} className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}><span>{name}</span><div><strong>{name}</strong><p>{body}</p></div></div>}
    player="你" highlight={body => body} />);
  expect(html).toContain("显示完整旁白");
  expect(html).not.toContain('class="scene-fixed-reply"');
});
