import { describe, it, expect } from "vitest";
import example from "../../tests/fixtures/story-example/story.json";
import { compileStory } from "./compiler";
import { testStory } from "./testStory";
const copy = () => structuredClone(example);
describe("Hogwarts story compiler", () => {
  it("compiles stable IDs deterministically with the magical module catalog", () => {
    const a = compileStory(copy()), b = compileStory(copy());
    expect(a.work).toEqual(b.work);
    expect(a.work.apps).toHaveLength(6);
    expect(a.work.apps.filter((app) => app.installed)).toHaveLength(6);
    expect(a.work.data.owlpost[0].sender).toBe("同学");
  });
  it("passes both authored ending paths with password and hidden content", () => {
    const { story, work } = compileStory(copy());
    expect(testStory(story, work)).toEqual([]);
  });
  it("rejects dangling node and content references", () => {
    const s = copy();
    s.events[1].next = ["missing"];
    expect(() => compileStory(s)).toThrow("不存在的节点");
    const t = copy();
    t.events[1].actions![0].key = "missing";
    expect(() => compileStory(t)).toThrow("不存在的内容");
  });
  it("rejects duplicate IDs and absent participants", () => {
    const s = copy();
    s.chats[0].messages[0].id = "note-clue";
    expect(() => compileStory(s)).toThrow("重复 ID");
    const t = copy();
    t.chats[0].participants.push("missing");
    expect(() => compileStory(t)).toThrow("联系人不存在");
  });
  it("does not allow a test to bypass hidden content or wrong passwords", () => {
    const { story, work } = compileStory(copy());
    story.tests[0].steps[0].password = "wrong";
    expect(testStory(story, work).join()).toContain("密码不正确");
    story.tests[0].steps.unshift({ event: "read", target: "photo-hidden" });
    expect(testStory(story, work).join()).toContain("不可读");
  });
  it("rejects runtime scripts, arbitrary HTML rich text and remote media", () => {
    const s = copy();
    Object.assign(s, { scripts: ["alert(1)"] });
    expect(() => compileStory(s)).toThrow();
    const t = copy();
    Object.assign(t.content.wizardjournal[0], { richText: "<script>alert(1)</script>" });
    expect(() => compileStory(t)).toThrow("不能导入 HTML");
    const v = copy();
    Object.assign(v.content.magicphotos[0], { media: "javascript:alert(1)" });
    expect(() => compileStory(v)).toThrow("不允许脚本");
  });
  it("requires proof of every ending path", () => {
    const { story, work } = compileStory(copy());
    story.tests.pop();
    expect(testStory(story, work).join()).toContain("结局没有可通过的测试路径");
  });
});
it("blank default has no story and needs no ending test", () => {
  const { story, work } = compileStory({
    scriptVersion: 1,
    id: "blank-test",
    title: "霍格沃茨空白故事",
    phone: { owner: "学生" },
  });
  expect(work.nodes).toEqual([]);
  expect(Object.values(work.data).flat()).toEqual([]);
  expect(work.mode).toBe("explore");
  expect(testStory(story, work)).toEqual([]);
});
