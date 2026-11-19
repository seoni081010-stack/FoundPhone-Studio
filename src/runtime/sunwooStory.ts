import days from "../../stories/sunwoo.json";
import endings from "../../stories/sunwoo-endings.json";
import { sharedRules } from "./sharedRules";
import type { JcodeBeat, JcodeEndingKind, JcodeLine } from "./jcodeStory";

export type SunwooSource = { file: string; line: number };
export type SunwooLine = JcodeLine & { source?: SunwooSource };
export type SunwooBeat = (JcodeBeat | { kind: "wager-result" }) & { channel: "scene" | "mail"; time: string; place: string; sources?: SunwooSource[] };
export type SunwooDay = { day: number; title: string; schedule: string; time: string; place: string; beats: SunwooBeat[]; ending?: { kind: JcodeEndingKind; title: string; text: string } };
export const sunwooDays = days as SunwooDay[];
export const sunwooEndings = endings as Record<JcodeEndingKind, SunwooDay & { ending: { kind: JcodeEndingKind; title: string; text: string } }>;
// The same 80/100 ending gate used by the other routes. Owl replies are optional.
export const sunwooEndingThresholds = { friends: sharedRules.friendsBelowAffinity, together: sharedRules.confessionAffinity } as const;
export function sunwooEndingFor(score: number): JcodeEndingKind {
  return score >= sunwooEndingThresholds.together ? "together" : score >= sunwooEndingThresholds.friends ? "friends" : "unspoken";
}
export function sunwooDay(day: number, ending: JcodeEndingKind = "together"): SunwooDay {
  return day === 31 ? sunwooEndings[ending] : sunwooDays[day - 1];
}
export function sunwooStage(day: number, beatIndex: number, ending?: JcodeEndingKind) {
  const story = sunwooDay(day, ending);
  const beat = story.beats[Math.min(beatIndex, story.beats.length - 1)];
  return { time: beat?.time ?? story.time, place: beat?.place ?? story.place };
}
export function sunwooItinerary(day: number) {
  return [...new Map(sunwooDay(day).beats.filter(beat => beat.channel === "scene").map(beat => [beat.time, { time: beat.time, place: beat.place }])).values()];
}
export function sunwooName(text: string, player: string) {
  return text.replaceAll("{{playerName}}", player);
}
