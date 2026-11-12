import { describe, expect, it } from "vitest";
import { characterLocations } from "./characterLocations";
import { dailyLessons } from "./HogwartsSchedule";

describe("all-character map", () => {
  it.each(["11:00", "14:00"])("locates all seven using their own timetable at %s", time => {
    const locations = characterLocations(1, time, "q");
    expect(new Set(locations.map(person => person.id)).size).toBe(7);
    for (const person of locations) {
      const lesson = dailyLessons(person.year, person.house, 1).find(entry => entry.time === time);
      expect(person.activity).toBe(lesson?.subject);
    }
  });
  it("overrides only the selected character with the active story event", () => {
    const before = characterLocations(1, "11:00", "q");
    const during = characterLocations(1, "11:00", "q", "图书馆");
    expect(during.find(person => person.id === "q")?.place).toBe("图书馆");
    expect(during.filter(person => person.id !== "q")).toEqual(before.filter(person => person.id !== "q"));
  });
  it("places Q's first encounter in the library at 17:00", () => {
    expect(characterLocations(1, "17:00", "q").find(person => person.id === "q")?.place).toBe("图书馆");
  });
});
