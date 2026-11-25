import type { JcodeLine } from "./jcodeStory";
import { sharedRules } from "./sharedRules";

// Derive scene time from existing cursors, preserving beat IDs and old saves.
export function quidditchStage(day: { day: number; schedule: string; beats: { kind: string; lines?: JcodeLine[] }[] }, beatIndex: number, position: number) {
  if (day.day !== sharedRules.quidditchDay) return undefined;
  let time = day.schedule.split(" · ")[1];
  const wager = day.beats.findIndex(beat => beat.kind === "wager");
  if (beatIndex > wager) time = sharedRules.quidditchStart;
  const result = day.beats.findIndex(beat => beat.kind === "lines" && beat.lines?.some(line => /比赛结束.*斯莱特林获胜/.test(line.body)));
  const beat = day.beats[result];
  if (beat?.kind === "lines") {
    let step = -1, narration = false, resultStep = -1;
    for (const line of beat.lines ?? []) {
      if (line.speaker || !narration) step++;
      narration = !line.speaker;
      if (/比赛结束.*斯莱特林获胜/.test(line.body)) { resultStep = step; break; }
    }
    if (beatIndex > result || (beatIndex === result && position >= resultStep)) time = sharedRules.quidditchResult;
  }
  const place = day.schedule.split(" · ").at(-1)!;
  return { time, place, schedule: `12月12日 · ${time} · ${place}` };
}
