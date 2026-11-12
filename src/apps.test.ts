import { describe, it, expect } from "vitest";
import { createWork, createEmptyWork } from "./demo";
import { validateWork } from "./schema";
import {
  essentialApps,
  installApp,
  removeFromHome,
  uninstallApp,
  moveApp,
  newCustomApp,
} from "./apps";
describe("optional app lifecycle", () => {
  it("starts newly authored projects without seeded optional content or story", () => {
    const w = createEmptyWork();
    expect(w.nodes).toEqual([]);
    expect(Object.keys(w.data).sort()).toEqual([...essentialApps].sort());
    expect(Object.values(w.data).every((items) => items.length === 0)).toBe(
      true,
    );
  });
  it("installs only six necessary system apps in new works", () => {
    const w = createWork();
    expect(
      w.apps
        .filter((a) => a.installed)
        .map((a) => a.id)
        .sort(),
    ).toEqual([...essentialApps].sort());
    expect(w.apps.filter((a) => a.installed).map((a) => a.id).sort()).toEqual([...essentialApps].sort());
  });
  it("upgrades old format v1 app records without uninstalling existing apps", () => {
    const old = createWork();
    const raw = JSON.parse(JSON.stringify(old));
    for (const a of raw.apps) delete a.installed;
    expect(validateWork(raw).apps.every((a) => a.installed)).toBe(true);
  });
  it("distinguishes home removal from uninstall and keeps content on request", () => {
    const w = createWork();
    installApp(w, "owlpost");
    const data = structuredClone(w.data.owlpost);
    removeFromHome(w, "owlpost");
    expect(w.apps.find((a) => a.id === "owlpost")).toMatchObject({
      installed: true,
      visible: false,
    });
    expect(w.data.owlpost).toEqual(data);
    uninstallApp(w, "owlpost", true);
    expect(w.apps.find((a) => a.id === "owlpost")?.installed).toBe(false);
    installApp(w, "owlpost");
    expect(w.apps.find((a) => a.id === "owlpost")).toMatchObject({
      installed: true,
      visible: true,
    });
    expect(w.data.owlpost).toEqual(data);
  });
  it("deletes app data only when selected and reinstall starts empty", () => {
    const w = createWork();
    installApp(w, "magicphotos");
    uninstallApp(w, "magicphotos", false);
    expect(w.data.magicphotos).toBeUndefined();
    installApp(w, "magicphotos");
    expect(w.data.magicphotos).toEqual([]);
  });
  it("preserves icon, name, folders, order and install state on roundtrip", () => {
    const w = createWork();
    installApp(w, "owlpost");
    const a = w.apps.find((a) => a.id === "owlpost")!;
    a.name = "私人消息";
    a.icon = "信";
    a.folder = "书信";
    moveApp(w, "owlpost", "schoolbook");
    uninstallApp(w, "schoolbook", true);
    const copy = validateWork(JSON.parse(JSON.stringify(w)));
    expect(copy).toEqual(w);
    expect(copy.apps.some((a) => a.id === "owlpost")).toBe(true);
    expect(copy.apps.find((a) => a.id === "schoolbook")?.installed).toBe(false);
  });
  it("retains custom app identity across uninstall and reinstall", () => {
    const w = createWork();
    const id = newCustomApp(w, "调查");
    uninstallApp(w, id, true);
    installApp(w, id);
    expect(w.apps.find((a) => a.id === id)?.name).toBe("调查");
  });
});
