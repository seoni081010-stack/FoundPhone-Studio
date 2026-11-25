import { quidditchStage } from "./quidditchStage";
import days01 from "../../stories/younghoon-01.json";
import days05 from "../../stories/younghoon-05.json";
import days09 from "../../stories/younghoon-09.json";
import days13 from "../../stories/younghoon-13.json";
import days17 from "../../stories/younghoon-17.json";
import days25 from "../../stories/younghoon-25.json";
import endings from "../../stories/younghoon-endings.json";
import days21 from "../../stories/younghoon-21.json";
import type { JcodeBeat, JcodeLine } from "./jcodeStory";

export type YounghoonMail = {
  day: number; time: string; title?: string; nextDay?: boolean;
  opening: JcodeLine[]; options: JcodeLine[][]; tail: JcodeLine[];
};
type YounghoonBeat = JcodeBeat | { kind: "mail"; mail: YounghoonMail };
type YounghoonDay = { day: number; title: string; schedule: string; time: string; place: string; beats: YounghoonBeat[] };

export const younghoonDays = [...days01, ...days05, ...days09, ...days13, ...days17, ...days21, ...days25] as YounghoonDay[];

export function younghoonMailSteps(mail: YounghoonMail, choice?: number) {
  return choice === undefined ? mail.opening : [...mail.opening, ...mail.options[choice], ...mail.tail];
}

export const younghoonEndings = endings;

// Keep scene metadata separate from dialogue and save cursors. Day 24's second
// heading existed in the approved archive but was omitted by the old compiler.
const ballArrival = { time: "19:00", place: "霍格沃茨礼堂外", body: "夜幕降临时，城堡里已经响起了音乐。" };
export function younghoonItinerary(day: number) {
  const story = younghoonDays[day - 1];
  if (!story) return [];
  const schedules = [story.schedule, ...story.beats.flatMap(beat => beat.kind === "lines" && beat.schedule ? [beat.schedule] : [])];
  const entries = schedules.map(schedule => {
    const [, time, place] = schedule.split(" · ");
    return { time, place };
  });
  if (day === 24) entries.push({ time: ballArrival.time, place: ballArrival.place });
  return [...new Map(entries.map(stage => [stage.time, stage])).values()].sort((a, b) => a.time.localeCompare(b.time));
}

export function younghoonStage(day: number, beatIndex: number, position: number) {
  const story = younghoonDays[day - 1];
  const match = quidditchStage(story, beatIndex, position);
  if (match) return match;
  const scheduled = story.beats.slice(0, beatIndex + 1).reverse().find(beat => beat.kind === "lines" && beat.schedule);
  let schedule = scheduled?.kind === "lines" ? scheduled.schedule ?? story.schedule : story.schedule;
  if (day === 24) {
    const arrivalBeat = story.beats.findIndex(beat => beat.kind === "lines" && beat.lines.some(line => line.body === ballArrival.body));
    const beat = story.beats[arrivalBeat];
    if (beat?.kind === "lines") {
      let step = -1, narration = false, arrivalStep = -1;
      for (const line of beat.lines) {
        if (line.speaker || !narration) step++;
        narration = !line.speaker;
        if (line.body === ballArrival.body) { arrivalStep = step; break; }
      }
      if (beatIndex > arrivalBeat || (beatIndex === arrivalBeat && position >= arrivalStep)) {
        schedule = `12月24日 · ${ballArrival.time} · ${ballArrival.place}`;
      }
    }
  }
  const [, time, place] = schedule.split(" · ");
  return { schedule, time, place };
}
