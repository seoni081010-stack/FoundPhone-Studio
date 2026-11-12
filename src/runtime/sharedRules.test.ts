import { describe, expect, it } from "vitest";
import { acceptsInvitation, availableDateDays, isHoliday, sharedRules } from "./sharedRules";
import { dailyLessons } from "./HogwartsSchedule";
import { people } from "./HogwartsCharacters";

describe("one calendar and interaction policy for all routes", () => {
  it("keeps the five reviewed December milestones", () => {
    expect([sharedRules.firstSnowDay, sharedRules.quidditchDay, sharedRules.holidayStartDay,
      sharedRules.ballDay, sharedRules.confessionDay]).toEqual([6, 12, 22, 24, 31]);
  });
  it("blocks match and ball dates, permits weekends before the holiday and weekdays during it", () => {
    expect(availableDateDays(1)).toEqual([5, 6, 13, 19, 20, 22, 23, 25, 26, 27, 28, 29, 30, 31]);
    expect(availableDateDays(24)).toEqual([25, 26, 27, 28, 29, 30, 31]);
  });
  it("starts the same holiday for every character", () => {
    expect(isHoliday(21)).toBe(false);
    expect(isHoliday(22)).toBe(true);
    for (const person of people) expect(dailyLessons(person.year, person.house, 22)).toEqual([]);
  });
  it("preserves the reviewed invitation threshold and wager range", () => {
    expect(acceptsInvitation(45)).toBe(false);
    expect(acceptsInvitation(46)).toBe(true);
    expect([sharedRules.wagerMin, sharedRules.wagerMax]).toEqual([1, 10]);
  });
});
