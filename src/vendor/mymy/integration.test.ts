import { describe, it, expect } from "vitest";
import { compileStory } from "../../story-engine/compiler";
import { testStory } from "../../story-engine/testStory";
import fixture from "../../../tests/fixtures/story-example/story.json";

describe("shared magical story engine", () => {
  it("compiles owl post, enchanted note, and magical photo flow", () => {
    const { story, work } = compileStory(fixture);
    expect(testStory(story, work)).toEqual([]);
    expect(work.data.owlpost[0].id).toBe("owl-hint");
    expect(work.data.wizardjournal[0].id).toBe("note-clue");
    expect(work.data.magicphotos[0].id).toBe("photo-hidden");
  });
});
