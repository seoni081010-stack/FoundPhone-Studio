import { describe, it, expect } from "vitest";
import blank from "../../stories/blank/story.json";
import { compileStory } from "../story-engine/compiler";
import { defaultLayout, validateLayout, packHome, homeEntries, moveHome } from "./layout";
const work = () => compileStory(blank).work;
describe("Hogwarts folio layout", () => {
  it("keeps exactly the six authored magical modules", () => {
    const l = defaultLayout(work());
    expect(l.apps).toHaveLength(6);
    expect(l.apps.every((a) => a.installed && a.visible)).toBe(true);
    expect(l.apps.map((a) => a.id).sort()).toEqual([
      "heartarchive","magicphotos","maraudersmap","owlpost","schoolbook","wizardjournal"
    ]);
  });
  it("packs magical modules and parchment widgets without overlap", () => {
    const l = defaultLayout(work());
    l.widgets = [
      { id: "widget-calendar", type: "calendar", size: "medium" },
      { id: "widget-notes", type: "notes", size: "large" },
    ];
    l.order = l.widgets.map((w) => w.id);
    const pages = packHome(homeEntries(l));
    for (const page of pages) {
      const cells = new Set<string>();
      for (const entry of page)
        for (let y = entry.y; y < entry.y + entry.h; y++)
          for (let x = entry.x; x < entry.x + entry.w; x++) {
            expect(x).toBeLessThan(4);
            expect(y).toBeLessThan(6);
            expect(cells.has(x + "," + y)).toBe(false);
            cells.add(x + "," + y);
          }
    }
  });
  it("reorders entries and round-trips layout state", () => {
    const w = work(), l = defaultLayout(w);
    l.widgets = [{ id: "widget-clock", type: "clock", size: "small" }];
    const before = homeEntries(l).map((e) => e.key);
    moveHome(l, before[0], before[1]);
    expect(homeEntries(l)[0].key).toBe(before[1]);
    expect(validateLayout(JSON.parse(JSON.stringify(l)), w)).toEqual(l);
  });
  it("rejects foreign work, unknown modules and overfilled dock", () => {
    const w = work(), l = defaultLayout(w);
    l.workId = "wrong";
    expect(() => validateLayout(l, w)).toThrow();
    l.workId = w.id;
    l.apps[0].id = "arbitrary";
    expect(() => validateLayout(l, w)).toThrow();
    const t = defaultLayout(w);
    t.apps.slice(0, 5).forEach((a) => { a.dock = true; });
    expect(() => validateLayout(t, w)).toThrow("Dock");
  });
  it("preserves free grid gaps and rejects colliding fixed placements", () => {
    const w = work(), l = defaultLayout(w);
    l.positions.magicphotos = { page: 0, x: 2, y: 4 };
    const pages = packHome(homeEntries(l), l.positions);
    expect(pages[0].find((c) => c.entry.key === "magicphotos")).toMatchObject({ x: 2, y: 4 });
    l.positions.wizardjournal = { page: 0, x: 2, y: 4 };
    expect(() => validateLayout(l, w)).toThrow("位置冲突");
  });
});
