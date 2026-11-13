import { describe, expect, test } from "vitest";
import { jcodeDays, jcodeEndingFor, jcodeEndings } from "./jcodeStory";

describe("confirmed Jcode archive", () => {
  test("has all days, the authored number of choices and exactly four clues", () => {
    expect(jcodeDays.map(day => day.day)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect(jcodeDays.map(day => day.beats.filter(beat => beat.kind === "choice").length))
      .toEqual([3, 2, 2, 2, 1, 3, 1, 2, 2, 1, 1, 2, 1, 1, 1, 1, 2, 3, 2, 2, ...Array(10).fill(2), 1]);
    expect(jcodeDays.flatMap(day => day.beats.flatMap(beat => beat.kind === "clue" ? [[day.day, beat.clue.title]] : [])))
      .toEqual([[1, "胶卷编号"], [6, "取景框里的初雪"], [17, "没有寄出的照片"], [24, "未说出口的圣诞夜"]]);
  });

  test.each(jcodeDays)("Day $day can replay either choice without leaking archive markers", day => {
    for (const option of [0, 1]) {
      const lines = day.beats.flatMap(beat => {
        if (beat.kind === "lines") return beat.lines;
        if (beat.kind === "choice") return [{ speaker: "你", body: beat.options[option].body }, ...beat.options[option].lines];
        if (beat.kind === "team") return beat.options[option];
        return [];
      });
      expect(lines.length).toBeGreaterThan(10);
      expect(lines.some(line => line.speaker === "你")).toBe(true);
      expect(lines.every(line => !/^(若选择|若玩家|若竞猜|[AB][.｜]「|###|【|——|玩家选项|固定回答｜)/.test(line.body))).toBe(true);
    }
  });

  test("only explicitly scored options gain points, and Day 12 branches for both teams", () => {
    const day12 = jcodeDays[11];
    const teams = day12.beats.filter(beat => beat.kind === "team");
    expect(teams).toHaveLength(2);
    expect(teams[0].options[0].some(line => line.body === "支持格兰芬多？")).toBe(true);
    expect(teams[1].options[1].some(line => line.body.includes("免费的饮料"))).toBe(true);
    for (const day of jcodeDays) {
      for (const beat of day.beats) {
        if (beat.kind === "choice") {
          expect(beat.options.map(option => option.affinity))
            .toEqual(day.day >= 12 ? [2, 1] : [undefined, undefined]);
        }
      }
    }
  });
});

test("Day 31 resolves one authored ending at the shared score boundaries", () => {
  expect([0, 79, 80, 99, 100].map(jcodeEndingFor)).toEqual(["unspoken", "unspoken", "friends", "friends", "together"]);
  expect(jcodeDays[30].beats.at(-1)?.kind).toBe("ending");
  expect(Object.values(jcodeEndings).map(ending => ending.title)).toEqual(["END·恋人", "END·朋友", "END·未说出口"]);
  expect(Object.values(jcodeEndings).every(ending => ending.lines.some(line => line.speaker === "裴俊英"))).toBe(true);
});
