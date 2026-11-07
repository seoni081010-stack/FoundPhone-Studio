import dateOptions from "../../stories/template/hogwarts-dates.json";

// Every route uses this calendar and these interaction rules. Character names,
// dialogue and discoveries belong to route content, never to a separate UI.
export const sharedRules = {
  firstSnowDay: 6,
  quidditchDay: 12,
  holidayStartDay: 22,
  ballDay: 24,
  confessionDay: 31,
  dayStartTime: "09:00",
  owlPostDays: [2, 5, 6, 13, 15, 17, 19, 20, 30] as readonly number[],
  manualSceneDays: [3, 4] as readonly number[],
  invitationAffinity: 45,
  giftJealousyAffinity: 40,
  strongJealousyAffinity: 70,
  messageMaxLength: 300,
  relationshipNoticeMs: 4500,
  wagerMin: 1,
  wagerMax: 10,
  matchDrinkPrice: 5,
} as const;

export function isHoliday(day: number) {
  return day >= sharedRules.holidayStartDay;
}

export function availableDateDays(fromDay: number) {
  return Array.from({ length: sharedRules.confessionDay - fromDay + 1 }, (_, offset) => fromDay + offset)
    .filter(day => day !== sharedRules.quidditchDay && day !== sharedRules.ballDay &&
      (isHoliday(day) || dateOptions.dateDays.includes(new Date(Date.UTC(2026, 11, day)).getUTCDay())));
}

export function acceptsInvitation(affinity: number) {
  return affinity > sharedRules.invitationAffinity;
}
