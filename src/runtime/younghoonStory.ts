import days01 from "../../stories/younghoon-01.json";
import days05 from "../../stories/younghoon-05.json";
import days09 from "../../stories/younghoon-09.json";
import days13 from "../../stories/younghoon-13.json";
import days17 from "../../stories/younghoon-17.json";
import days21 from "../../stories/younghoon-21.json";
import type { JcodeBeat, JcodeLine } from "./jcodeStory";

export type YounghoonMail = {
  day: number; time: string; title?: string; nextDay?: boolean;
  opening: JcodeLine[]; options: JcodeLine[][]; tail: JcodeLine[];
};
type YounghoonBeat = JcodeBeat | { kind: "mail"; mail: YounghoonMail };
type YounghoonDay = { day: number; title: string; schedule: string; time: string; place: string; beats: YounghoonBeat[] };

export const younghoonDays = [...days01, ...days05, ...days09, ...days13, ...days17, ...days21] as YounghoonDay[];

export function younghoonMailSteps(mail: YounghoonMail, choice?: number) {
  return choice === undefined ? mail.opening : [...mail.opening, ...mail.options[choice], ...mail.tail];
}
