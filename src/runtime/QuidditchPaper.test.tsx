import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QuidditchPaper, QuidditchResult } from "./QuidditchPaper";
import { people } from "./HogwartsCharacters";
import { sharedRules } from "./sharedRules";

const props = { team: "斯莱特林", stake: 3, error: "", onTeam: () => {}, onStake: () => {}, onSubmit: () => {}, onReturn: () => {} };
describe("the shared match paper is an interruption, not a conversation", () => {
  it("retains the shared teams, stake range and commit controls without a dialogue reader", () => {
    const html = renderToStaticMarkup(<QuidditchPaper {...props} />);
    expect(html).toContain("谁的扫帚先得意？");
    for (const team of ["格兰芬多", "斯莱特林"]) expect(html).toContain(team);
    expect(html).toContain(`min="${sharedRules.wagerMin}"`);
    expect(html).toContain(`max="${sharedRules.wagerMax}"`);
    expect(html).toContain("就押这个");
    expect(html).not.toMatch(/scene-dialogue|hogwarts-message|hogwarts-avatar|继续看比赛/);
  });
  it("cannot include any character's conversation even if it is accidentally supplied as children", () => {
    for (const person of people) {
      const accidentallyMixed = { children: <div className="hogwarts-message">{person.name}：不要显示在纸条上的对话</div> };
      const html = renderToStaticMarkup(<QuidditchPaper {...props} {...accidentallyMixed} />);
      expect(html).not.toContain(person.name);
      expect(html).not.toContain("不要显示在纸条上的对话");
      expect(html).not.toContain("hogwarts-message");
    }
  });
  it("keeps selection validation and insufficient-funds feedback on the paper", () => {
    const html = renderToStaticMarkup(<QuidditchPaper {...props} team="" error="钱包里的加隆不够。" />);
    expect(html).toContain('disabled=""');
    expect(html).toContain('role="alert"');
    expect(html).toContain("钱包里的加隆不够。");
  });
  it.each([false, true])("shows only the shared result and redemption rules for won=%s", won => {
    const html = renderToStaticMarkup(<QuidditchResult won={won} stake={4} onContinue={() => {}} />);
    expect(html).toContain("斯莱特林赢了");
    expect(html).toContain("4 加隆");
    expect(html).toContain(won ? "收下饮料券" : "把纸条折起来");
    expect(html).not.toMatch(/scene-dialogue|hogwarts-message|hogwarts-avatar/);
  });
});
