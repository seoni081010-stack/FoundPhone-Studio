import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SceneDialogue, sceneParts } from "./SceneDialogue";

function message(name: string, text: string, outgoing = false) {
  return <div className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}>
    <span className="hogwarts-avatar">{name}</span>
    <div><strong>{name}</strong><p>{text}</p></div>
  </div>;
}

describe("face-to-face dialogue", () => {
  it("keeps narration intact and withholds later replies, choices and finish actions", () => {
    const html = renderToStaticMarkup(<SceneDialogue>
      <p className="hogwarts-narration">雪落在<strong>槲寄生</strong>上。</p>
      {message("池昌民", "后续的台词")}
      {message("我", "好啊，我们在一起吧。", true)}
      <div className="hogwarts-device-choices"><button>第一个选项</button><button>第二个选项</button></div>
      <button>查看结局</button>
    </SceneDialogue>);
    expect(html).toContain("雪落在<strong>槲寄生</strong>上。");
    for (const text of ["后续的台词", "好啊，我们在一起吧。", "第一个选项", "第二个选项", "查看结局"]) {
      expect(html).not.toContain(text);
    }
  });

  it("shows a fixed reply as a button before putting it into the transcript", () => {
    const html = renderToStaticMarkup(<SceneDialogue>{message("我", "真的。", true)}</SceneDialogue>);
    expect(html).toContain("<button type=\"button\">真的。</button>");
    expect(html).not.toContain("hogwarts-message");
  });

  it("starts every character's speech unrevealed", () => {
    for (const name of ["裴俊英", "金泳勋", "李贤在", "李柱延", "池昌民", "金善旴", "孙英宰"]) {
      const html = renderToStaticMarkup(<SceneDialogue>{message(name, "完整台词暂时不显示")}</SceneDialogue>);
      expect(html).toContain(name);
      expect(html).not.toContain("完整台词暂时不显示");
      expect(html).toContain("显示完整台词");
    }
  });

  it("flattens story fragments while preserving choice groups and mail", () => {
    const { steps, controls } = sceneParts(<>
      <div><p className="hogwarts-narration">旁白</p>{message("李贤在", "台词")}</div>
      <div className="hogwarts-device-choices"><button>选项一</button><button>选项二</button></div>
      <div className="date-mail-reply">{message("李贤在", "来信")}</div>
    </>);
    expect(steps.map(step => [step.speech, step.text])).toEqual([[false, "旁白"], [true, "台词"]]);
    expect(controls).toHaveLength(2);
  });
});
