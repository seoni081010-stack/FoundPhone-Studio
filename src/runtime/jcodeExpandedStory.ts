import data from "../../stories/jcode-expanded.json";
import type { Progress } from "./JcodeScene";
import type { JcodeEndingKind, JcodeClue, JcodeLine } from "./jcodeStory";
import type { SunwooDay } from "./sunwooStory";
import adaptations from "../../stories/jcode-expanded-approved-adaptations.json";
export type JacobProgress = Progress & {
  jacobFlags?: Record<string, boolean>;
  jacobChoices?: Record<string, number>;
  jacobRawAffinity?: number;
  jacobCard?: { color: string; decoration: string; draft: string; submitted?: boolean };
  jacobTradingCard?: string;
  jacobChristmasLetterOpen?: boolean;
  jacobChristmasLetterRead?: boolean;
  jacobChristmasLetterStartedAt?: number;
  jacobGingerbreadPhotoOpen?: boolean;
  jacobGingerbreadPhotoRead?: boolean;
  jacobChecklist21Read?: boolean;
  jacobChecklist21StartedAt?: number;
  jacobChecklistRead?: boolean;
  jacobChecklistStartedAt?: number;
};
export type JacobLine = JcodeLine & { when?: string[] };
export type JacobBeat = { id: string; kind: string; when: string[]; time: string; place: string; channel: string; legacyBeat?: number; jacobPresent?: boolean;
  lines?: JacobLine[]; clue?: JcodeClue; options?: { body: string; affinity: number; rawAffinity: number; lines: JacobLine[]; effects?: Record<string, boolean> }[] };
export type JacobDay = { day: number; title: string; time: string; place: string; schedule: string; beats: JacobBeat[]; ending?: { id: string; kind: JcodeEndingKind; title: string; text: string } };
export const jacobExpandedDays = data.days as unknown as SunwooDay[];
export const jacobExpandedEndings = data.endings as unknown as Record<JcodeEndingKind, SunwooDay & { ending: NonNullable<SunwooDay["ending"]> }>;
export function jacobExpandedDay(day: number, kind: JcodeEndingKind = "together"): SunwooDay { return (day === 31 ? data.endings[kind] : data.days[day - 1]) as unknown as SunwooDay; }
export function jacobCondition(condition: string, p: JacobProgress): boolean {
  if (condition.startsWith("!")) return !jacobCondition(condition.slice(1), p);
  if (condition === "team-gryffindor") return p.team === "格兰芬多";
  return p.jacobFlags?.[condition] === true;
}
export function jacobNextBeat(story: JacobDay, index: number, p: JacobProgress): number {
  while (index < story.beats.length && (!story.beats[index].when.every(c => jacobCondition(c, p)) || (story.beats[index].kind === "clue" && p.clues.includes(story.beats[index].clue!.id)))) index++;
  return index;
}
export function jacobScore(raw: number): number { return Math.round(raw / data.maximumRawAffinity * 100000000) / 1000000; }
export function jacobEndingFor(score: number): JcodeEndingKind { return score >= 100 ? "together" : score >= 80 ? "friends" : "unspoken"; }
export function jacobText(body: string, p: JacobProgress, player: string): string {
  let text = body.replaceAll("{{playerName}}", player);
  if (p.day === 21) {
    const changes = p.jacobFlags?.["second-cup"] ? adaptations.baseSceneReplacements["21"]["second-cup"] : adaptations.baseSceneReplacements["21"]["recipe-invitation"];
    text = (changes as Record<string, string>)[text] ?? text;
  }
  if (p.day === 18 && !p.jacobFlags?.["camera-lesson"]) {
    if (text === "昨天是教她拍照。") text = "昨天是带她看怎么洗照片。";
    if (text === "说在教你拍照。") text = "说在带你看怎么洗照片。";
  }
  if (p.day === 27 && p.jacobFlags?.marshmallow && text === "终于不是什么都不加了？") text = "这次不是只加棉花糖了？";
  const drink = p.jacobFlags?.["drink-肉桂牛奶"] ? "肉桂牛奶" : p.jacobFlags?.["drink-热苹果汁"] ? "热苹果汁" : "热巧克力";
  if (p.day === 15 && drink !== "热巧克力") {
    if (text === "厨房里的家养小精灵很快给你们准备了两杯热巧克力。") text = `厨房里的家养小精灵很快给你们准备了一杯${drink}和一杯热巧克力。`;
    if (text === "你们喝完热巧克力，窗外的雪还没有停。") text = "你们喝完热饮，窗外的雪还没有停。";
  }
  if (p.day === 20 && text === "他将其中一杯递给你。") text = `他将${drink}递给你。`;
  if (!p.jacobFlags?.["hot-chocolate"]) {
    if (p.day === 11) text = ({ "之前说过要请你喝热巧克力，不过一直没找到合适的时间。": "之前说过可以一起去厨房，不过一直没找到合适的时间。", "那不是我随口说的吗？": "你还记得啊。", "但我答应了。": "说过的事情，还是想做到。" } as Record<string,string>)[text] ?? text;
    if (p.day === 13 && text === "对了，你之前说要请我喝热巧克力。") text = "对了，你之前说可以一起去厨房。";
    if (p.day === 15 && text === "之前不是说好请你喝热巧克力？") text = "之前不是说好一起去厨房？";
  }
  if (p.day === 20 && text === "昨天那杯还没兑现呢。") text = "昨天那杯，刚才已经兑现了。";
  return text.replaceAll("**", "").replace(/^\*(.*)\*$/, "$1");
}
export function jacobExpandedStage(day: number, beat: number, kind: JcodeEndingKind = "together") {
  const story = jacobExpandedDay(day, kind) as unknown as JacobDay;
  const active = story.beats[Math.min(beat, story.beats.length - 1)];
  return { time: active?.time ?? story.time, place: active?.place ?? story.place };
}
export function jacobExpandedItinerary(day: number) {
  const story = jacobExpandedDay(day) as unknown as JacobDay;
  return [...new Map(story.beats.filter(b => b.channel === "scene" && b.kind !== "clue" && b.jacobPresent).map(b => [b.time, { time: b.time, place: b.place }])).values()];
}
export function jacobPreviewProgress(day: number, ending?: JcodeEndingKind, cards = false): Partial<JacobProgress> {
  const p: JacobProgress = { day: 1, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: true, jacobChoices: {}, jacobFlags: {}, jacobRawAffinity: 0 };
  for (let d = 1; d < day; d++) {
    p.day = d;
    for (const b of (jacobExpandedDay(d) as unknown as JacobDay).beats) {
      if (!b.when.every(c => jacobCondition(c, p))) continue;
      if (b.kind === "choice") { const oi = day === 18 && b.options![0].effects?.["swap-cards"] ? 0 : 1;const o = b.options![oi];p.jacobChoices![b.id] = oi;p.jacobRawAffinity! += o.rawAffinity;Object.assign(p.jacobFlags!, o.effects ?? {}); }
      if (b.kind === "clue") p.clues.push(b.clue!.id);
    }
  }
  return { ...p, day, ending, ...(cards && day === 18 ? { beat: (jacobExpandedDay(18) as unknown as JacobDay).beats.findIndex(b => b.kind === "trading-cards") } : {}), affinity: ending === "together" ? 100 : ending === "friends" ? 90 : jacobScore(p.jacobRawAffinity!) };
}

export function jacobPhysicalPlace(p: JacobProgress) {
  const story = jacobExpandedDay(p.day, p.ending) as unknown as JacobDay;
  const beat = story.beats[Math.min(jacobNextBeat(story, p.beat, p), story.beats.length - 1)];
  return beat?.channel === "scene" && beat.kind !== "clue" && beat.jacobPresent ? beat.place : undefined;
}
