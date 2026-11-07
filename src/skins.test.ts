import { describe, it, expect } from "vitest";
import { registry } from "./registry";
import { catalogSkins } from "./skins/catalog";
import { makeItem, validateWork } from "./schema";
import { createWork } from "./demo";

describe("Hogwarts module coverage and authored attributes", () => {
  it("routes every registered magical module through a dedicated screen", () => {
    expect(Object.keys(catalogSkins)).toHaveLength(6);
    for (const app of registry) expect(app.id in catalogSkins).toBe(true);
  });

  it("defaults item metadata safely when reading older magical records", () => {
    const w = JSON.parse(JSON.stringify(createWork()));
    for (const items of Object.values(w.data) as Record<string, unknown>[][])
      for (const i of items) {
        delete i.meta;
        delete i.avatar;
      }
    const copy = validateWork(w);
    expect(copy.data.wizardjournal[0].meta).toEqual({});
    expect(copy.data.owlpost[0].avatar).toBe("");
  });

  it("roundtrips magical record metadata", () => {
    const w = createWork();
    w.data.schoolbook = [
      makeItem({
        title: "魔药课",
        meta: { classroom: "地下教室", status: "待完成" },
      }),
    ];
    w.data.maraudersmap = [
      makeItem({
        title: "庭院",
        meta: { location: "钟楼庭院", marker: "已标记" },
      }),
    ];
    const copy = validateWork(JSON.parse(JSON.stringify(w)));
    expect(copy.data.schoolbook[0].meta.classroom).toBe("地下教室");
    expect(copy.data.maraudersmap[0].meta.location).toBe("钟楼庭院");
  });

  it("rejects non-string or oversized authored attribute values", () => {
    expect(() =>
      makeItem({ meta: { score: 42 } as unknown as Record<string, string> }),
    ).toThrow();
    expect(() => makeItem({ meta: { note: "x".repeat(2001) } })).toThrow();
  });
});
