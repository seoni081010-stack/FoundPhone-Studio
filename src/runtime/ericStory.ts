import days from "../../stories/eric.json";
import endings from "../../stories/eric-endings.json";
import { sharedRules } from "./sharedRules";
import type { JcodeBeat, JcodeEndingKind, JcodeLine } from "./jcodeStory";

export type EricSource = { file: string; line: number };
export type EricLine = JcodeLine & { source?: EricSource };
export type EricBeat = (JcodeBeat | { kind: "wager-result" }) & { channel: "scene" | "mail"; time: string; place: string; sources?: EricSource[]; endingGate?: boolean };
export type EricDay = { day: number; title: string; schedule: string; time: string; place: string; beats: EricBeat[]; ending?: { kind: JcodeEndingKind; title: string; text: string } };
export const ericDays = days as EricDay[];
export const ericEndings = endings as Record<JcodeEndingKind, EricDay & { ending: { kind: JcodeEndingKind; title: string; text: string } }>;
// The same 80/100 ending gate used by the other routes. Owl replies are optional.
export const ericEndingThresholds = { friends: sharedRules.friendsBelowAffinity, together: sharedRules.confessionAffinity } as const;
export function ericEndingFor(score: number): JcodeEndingKind {
  return score >= ericEndingThresholds.together ? "together" : score >= ericEndingThresholds.friends ? "friends" : "unspoken";
}
export function ericDay(day: number, ending: JcodeEndingKind = "together"): EricDay {
  return day === 31 ? ericEndings[ending] : ericDays[day - 1];
}
export function ericStage(day: number, beatIndex: number, ending?: JcodeEndingKind) {
  const story = ericDay(day, ending);
  const beat = story.beats[Math.min(beatIndex, story.beats.length - 1)];
  return { time: beat?.time ?? story.time, place: beat?.place ?? story.place };
}
export function ericItinerary(day: number) {
  return [...new Map(ericDay(day).beats.filter(beat => beat.channel === "scene").map(beat => [beat.time, { time: beat.time, place: beat.place }])).values()];
}
export function ericName(text: string, player: string) {
  return text.replaceAll("{{playerName}}", player);
}

// Preserve the manuscript's sentence while avoiding the premise unique to option 1B on path A.
export function ericVisibleLines(lines: JcodeLine[], history: Record<string, number> = {}) {
  return lines.filter(line => {
    const condition = (line as JcodeLine & { requiresChoice?: { key: string; option: number } }).requiresChoice;
    return !condition || history[condition.key] === condition.option;
  });
}
