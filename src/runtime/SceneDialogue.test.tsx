import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SceneDialogue, sceneParts, narrationBody } from "./SceneDialogue";

function message(name: string, text: string, outgoing = false) {
  return <div className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}>
    <span className="hogwarts-avatar">{name}</span>
    <div><strong>{name}</strong><p>{text}</p></div>
  </div>;
}

describe("face-to-face dialogue", () => {
  it("types narration as one block and withholds later replies, choices and finish actions", () => {
    const html = renderToStaticMarkup(<SceneDialogue>
      <p className="hogwarts-narration">雪落在<strong>槲寄生</strong>上。</p>
      {message("池昌民", "后续的台词")}
      {message("我", "好啊，我们在一起吧。", true)}
      <div className="hogwarts-device-choices"><button>第一个选项</button><button>第二个选项</button></div>
      <button>查看结局</button>
    </SceneDialogue>);
    expect(html).not.toContain("雪落在");
    expect(html).toContain("显示完整旁白");
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


describe("whole narration blocks", () => {
  it("groups adjacent paragraphs, preserving line breaks, until speech or a choice", () => {
    const { steps } = sceneParts(<>
      <p className="hogwarts-narration">第一行。</p>
      <div><p className="hogwarts-narration">第二行。</p><p className="hogwarts-narration">第三行。</p></div>
      {message("池昌民", "到了。")}
      <p className="hogwarts-narration">下一段。</p>
      <div className="hogwarts-device-choices"><button>回答</button></div>
      <p className="hogwarts-narration">选择之后。</p>
    </>);
    expect(steps.map(step => step.text)).toEqual(["第一行。\n第二行。\n第三行。", "到了。", "下一段。", "选择之后。"]);
    expect(steps[0].speech).toBe(false);
    expect(renderToStaticMarkup(narrationBody(steps[0].node, 100))).toContain('<p class="hogwarts-narration">第二行。</p>');
  });
  it("continues from one line to the next on the same character budget, preserving emphasis and emoji", () => {
    const block = sceneParts(<>
      <p className="hogwarts-narration">雪<strong>🦉槲寄生</strong>。</p>
      <p className="hogwarts-narration">他转身。</p>
    </>).steps[0];
    const partial = renderToStaticMarkup(narrationBody(block.node, 3));
    expect(partial).toContain('<strong>🦉槲</strong>');
    expect(partial).not.toContain("他转身");
    const nextLine = renderToStaticMarkup(narrationBody(block.node, 8));
    expect(nextLine).toContain('<strong>🦉槲寄生</strong>。');
    expect(nextLine).toContain('>他</p>');
    const full = renderToStaticMarkup(narrationBody(block.node, Array.from(block.text).length));
    expect(full).toContain("他转身。");
    expect((full.match(/<p /g) ?? []).length).toBe(2);
  });
  it("never merges new branch paragraphs into an already-read runtime segment", () => {
    const before = <div data-scene-segment="before"><p className="hogwarts-narration">原来的旁白。</p></div>;
    const original = sceneParts(before);
    const appended = sceneParts(<>{before}<div data-scene-segment="after"><p className="hogwarts-narration">新增第一行。</p><p className="hogwarts-narration">新增第二行。</p></div></>);
    expect(appended.steps[0].text).toBe(original.steps[0].text);
    expect(appended.steps[1].text).toBe("新增第一行。\n新增第二行。");
  });
  it("applies the same narration block behavior before any of the seven characters speaks", () => {
    for (const name of ["裴俊英", "金泳勋", "李贤在", "李柱延", "池昌民", "金善旴", "孙英宰"]) {
      const { steps } = sceneParts(<><p className="hogwarts-narration">窗外落雪。</p><p className="hogwarts-narration">你走进长廊。</p>{message(name, "来了？")}</>);
      expect(steps).toHaveLength(2);
      expect(steps[0].text).toBe("窗外落雪。\n你走进长廊。");
      expect(steps[1].speech).toBe(true);
    }
  });
});
