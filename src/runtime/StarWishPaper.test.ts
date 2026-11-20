import { describe, expect, it } from "vitest";
import { starWishMoment } from "./StarWishPaper";
import { sunwooDay } from "./sunwooStory";

describe("Day 19 anonymous paper interruption", () => {
  it("locates the player's paper after Sunwoo's different paper without changing saved step numbers", () => {
    const beat = sunwooDay(19).beats[5];
    if (beat.kind !== "lines") throw new Error("Missing shared paper scene");
    const moment = starWishMoment(beat.lines);
    expect(moment).toEqual({ position: 12, text: "我希望有一天，能勇敢一点。" });
    expect(beat.lines[14]).toMatchObject({ speaker: "金善旴", body: "你那个写了什么？" });
  });
  it("does not interrupt earlier dialogue or unrelated days", () => {
    for (const day of [5, 18, 20, 31]) {
      for (const beat of sunwooDay(day).beats) {
        if (beat.kind === "lines") expect(starWishMoment(beat.lines)).toBeUndefined();
      }
    }
  });
});
