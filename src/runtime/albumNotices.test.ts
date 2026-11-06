import { afterEach, describe, expect, it, vi } from "vitest";
import { people } from "./HogwartsCharacters";
import { albumNoticeKey, albumSceneRead, nextAlbumNotice, readAlbumNotices, saveAlbumNotices, type AlbumNotice } from "./albumNotices";

const clue = (id: string, unlocked = true): AlbumNotice => ({ id, title: id, body: "已确认的原文", unlocked });
afterEach(() => vi.unstubAllGlobals());

describe("shared new-album notices for all seven routes", () => {
  it.each(people.map(person => person.id))("queues each newly unlocked clue for %s, regardless of album size", character => {
    const clues = [clue(`${character}-snow`), clue(`${character}-ball`), clue(`${character}-arch`), clue(`${character}-final`)];
    const acknowledged: string[] = [];
    for (const current of clues) {
      expect(nextAlbumNotice(clues, acknowledged, true)).toBeUndefined();
      expect(nextAlbumNotice(clues, acknowledged, false)?.id).toBe(current.id);
      acknowledged.push(current.id);
    }
    expect(nextAlbumNotice(clues, acknowledged, false)).toBeUndefined();
    expect(nextAlbumNotice([...clues, clue(`${character}-new`)], acknowledged, false)?.id).toBe(`${character}-new`);
  });
  it("never treats an unearned or merely selected scene as a new clue", () => {
    expect(nextAlbumNotice([clue("not-earned", false)], [], false)).toBeUndefined();
    for (const milestone of [6, 24]) {
      expect(albumSceneRead(milestone - 1, milestone, [])).toBe(false);
      expect(albumSceneRead(milestone, milestone, [])).toBe(false);
      expect(albumSceneRead(milestone, milestone, [milestone])).toBe(true);
      expect(albumSceneRead(milestone + 1, milestone, [])).toBe(true);
    }
  });
  it("retains unread notices across refresh, and isolates characters and new playthroughs", () => {
    const records = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => records.set(key, value) });
    const identity = { name: "试玩", house: "ravenclaw", year: 6, runId: "test-run" };
    for (const person of people) {
      const key = albumNoticeKey({ ...identity, loveInterest: person.id });
      expect(saveAlbumNotices(key, { acknowledged: ["first"], completedDays: [6] })).toBe(true);
      const restored = readAlbumNotices(key);
      expect(restored.completedDays).toEqual([6]);
      expect(nextAlbumNotice([clue("first"), clue("unread")], restored.acknowledged, false)?.id).toBe("unread");
      expect(readAlbumNotices(albumNoticeKey({ ...identity, runId: "new-run", loveInterest: person.id })).acknowledged).toEqual([]);
    }
    expect(records.size).toBe(7);
    expect(new Set(people.map(person => albumNoticeKey({ ...identity, runId: undefined, loveInterest: person.id }))).size).toBe(7);
  });
  it("ignores broken storage without hiding notices", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{broken", setItem: () => { throw new Error("full"); } });
    expect(readAlbumNotices("test")).toEqual({ acknowledged: [], completedDays: [] });
    expect(saveAlbumNotices("test", { acknowledged: [], completedDays: [] })).toBe(false);
    expect(nextAlbumNotice([clue("snow")], [], false)?.id).toBe("snow");
  });
});
