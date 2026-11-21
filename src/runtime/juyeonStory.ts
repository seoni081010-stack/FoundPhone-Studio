import days from "../../stories/juyeon.json";
import endings from "../../stories/juyeon-endings.json";
import { sharedRules } from "./sharedRules";
import type { JcodeBeat, JcodeEndingKind, JcodeLine } from "./jcodeStory";

export type JuyeonSource = { file: string; line: number };
export type JuyeonLine = JcodeLine & { source?: JuyeonSource };
export type JuyeonBeat = (JcodeBeat | { kind: "wager-result" }) & { channel: "scene" | "mail"; time: string; place: string; sources?: JuyeonSource[]; endingGate?: boolean };
export type JuyeonDay = { day: number; title: string; schedule: string; time: string; place: string; beats: JuyeonBeat[]; ending?: { kind: JcodeEndingKind; title: string; text: string } };
export const juyeonDays = days as JuyeonDay[];
export const juyeonEndings = endings as Record<JcodeEndingKind, JuyeonDay & { ending: { kind: JcodeEndingKind; title: string; text: string } }>;
// The same 80/100 ending gate used by the other routes. Owl replies are optional.
export const juyeonEndingThresholds = { friends: sharedRules.friendsBelowAffinity, together: sharedRules.confessionAffinity } as const;
export function juyeonEndingFor(score: number): JcodeEndingKind {
  return score >= juyeonEndingThresholds.together ? "together" : score >= juyeonEndingThresholds.friends ? "friends" : "unspoken";
}
export function juyeonDay(day: number, ending: JcodeEndingKind = "together"): JuyeonDay {
  return day === 31 ? juyeonEndings[ending] : juyeonDays[day - 1];
}
export function juyeonStage(day: number, beatIndex: number, ending?: JcodeEndingKind) {
  const story = juyeonDay(day, ending);
  const beat = story.beats[Math.min(beatIndex, story.beats.length - 1)];
  return { time: beat?.time ?? story.time, place: beat?.place ?? story.place };
}
export function juyeonItinerary(day: number) {
  return [...new Map(juyeonDay(day).beats.filter(beat => beat.channel === "scene").map(beat => [beat.time, { time: beat.time, place: beat.place }])).values()];
}
export function juyeonName(text: string, player: string) {
  return text.replaceAll("{{playerName}}", player);
}
