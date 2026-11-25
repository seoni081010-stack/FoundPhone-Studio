import data from "../../stories/hyunjae-expanded.json";
import type { JcodeClue, JcodeEndingKind, JcodeLine } from "./jcodeStory";
import type { Progress } from "./JcodeScene";
import type { SunwooDay } from "./sunwooStory";

export type HyIdentity = { house: string; year: number };
export type HyProgress = Progress & {
  hyunjaeChoices?: Record<string, number>;
  hyunjaeLibraryNoteRead?: boolean;
  hyunjaeWish?: { draft: string; submitted?: string; via?: "tree" | "message" };
  hyunjaeEndingId?: string;
  hyunjaeVoucherAt19?: boolean;
  hyunjaeMigrated?: boolean;
  hyunjaeLegacyWager?: boolean;
};
export type HyLine = JcodeLine & { source?: { file: string; line: number } };
export type HyBeat = {
  kind: "lines" | "choice" | "clue" | "wager" | "wager-result" | "wish" | "meal";
  id?: string; hyunjaePresent?: boolean; when: string[]; time: string; place: string; channel: "scene" | "mail";
  lines?: HyLine[]; meal?: "breakfast" | "lunch"; clue?: JcodeClue;
  options?: { body: string; affinity: number; rawAffinity: number; lines: HyLine[] }[];
};
export type HyDay = Omit<SunwooDay, "beats"> & { beats: HyBeat[]; ending?: { kind: JcodeEndingKind; id: string; title: string; text: string } };
const rawDays = data.days as HyDay[];
const rawEndings = data.endings as Record<JcodeEndingKind, HyDay & { ending: NonNullable<HyDay["ending"]> }>;
export const hyunjaeDays = rawDays as unknown as SunwooDay[];
export const hyunjaeEndings = rawEndings as unknown as Record<JcodeEndingKind, SunwooDay & { ending: NonNullable<SunwooDay["ending"]> }>;
export function hyunjaeEndingFor(score: number): JcodeEndingKind { return score >= 100 ? "together" : "unspoken"; }
export function hyunjaeDay(day: number, ending: JcodeEndingKind = "together"): SunwooDay {
  return (day === 31 ? rawEndings[ending] : rawDays[day - 1]) as unknown as SunwooDay;
}
export function hyunjaeCondition(name: string, p: HyProgress, identity: HyIdentity): boolean {
  if (name.startsWith("!")) return !hyunjaeCondition(name.slice(1), p, identity);
  const c = p.hyunjaeChoices ?? {};
  const conditions: Record<string, boolean> = {
    "same-house-year": identity.house === "gryffindor" && identity.year === 7,
    "same-year-other-house": identity.house !== "gryffindor" && identity.year === 7,
    "same-house-other-year": identity.house === "gryffindor" && identity.year !== 7,
    "other-house-year": identity.house !== "gryffindor" && identity.year !== 7,
    "snow-together": c["06:1"] === 0,
    "snow-scarf": c["06:1"] === 0 && c["06:3A"] === 0,
    "dinner-meet": c["09:2"] === 0,
    "food-roast": c["08:3"] === 0,
    "food-light": c["08:3"] === 1,
    "food-known": c["08:3"] !== undefined,
    "third-row": c["11:4"] === 0,
    "team-gryffindor": p.team === "格兰芬多",
    "voucher-won": p.team === "斯莱特林",
    "voucher-held": p.day === 19 && p.hyunjaeVoucherAt19 !== undefined ? p.hyunjaeVoucherAt19 : p.team === "斯莱特林" && !p.wagerClaimed,
    "dinner-now": c["15:5"] === 0,
    "tree-together": c["17:2"] === 0,
    "holiday-breakfast": c["18:4"] === 0,
    "scarf-active": c["19:3"] === 0,
    "wanted-sugar-face": c["13:3"] === 0,
    "sugar-face": c["13:3"] === 0 || c["13:4"] === 0,
    "chocolate-together": c["20:4"] === 0,
    "library-afternoon": c["22:2"] === 0,
    "library-pie": c["22:3A"] === 1,
    "ball-happy": c["24:6"] === 0,
    "lunch-promise": c["26:4"] === 0,
    "lantern-early": c["29:2"] === 0,
    "lamp-promise": c["29:5"] === 0,
  };
  if (!(name in conditions)) throw new Error(`Unknown Hyunjae condition: ${name}`);
  return conditions[name];
}
export function hyunjaeNextBeat(story: HyDay, index: number, p: HyProgress, identity: HyIdentity) {
  while (index < story.beats.length && (!story.beats[index].when.every(name => hyunjaeCondition(name, p, identity)) || (story.beats[index].kind === "clue" && p.clues.includes(story.beats[index].clue!.id)) || (story.beats[index].kind === "wager" && p.hyunjaeLegacyWager === true))) index++;
  return index;
}
export function hyunjaeText(text: string, p: HyProgress, player: string) {
  const c = p.hyunjaeChoices ?? {};
  const replacements: Record<string, string> = {
    playerName: player,
    snowScarfReply: c["06:3A"] === 0 ? "你昨天还说想穿着干衣服回去呢。" : "你昨天还说出来的时候忘了戴手套呢。",
    snowScarfAnswer: c["06:3A"] === 0 ? "衣服是干的，围巾不算。" : "",
    snowCorridorRecall: c["06:2B"] === 1 ? "我刚才走了你昨天说的那条回廊。" : "我刚才从外侧回廊走了一趟。",
    wishTieReply: c["17:2"] === 0 ? "看来我们那天系得还挺牢的。" : "看来你那天系得还挺牢的。",
    foodNote: c["08:3"] === 0 ? "烤鸡，喜欢上次那个酱。" : "汤不用加胡椒，清淡一点。",
  };
  if (p.day === 7) {
    text = text.replace("你昨天还说想穿着干衣服回去呢。", replacements.snowScarfReply)
      .replace("衣服是干的，围巾不算。", replacements.snowScarfAnswer)
      .replace("我刚才走了你昨天说的那条回廊。", replacements.snowCorridorRecall);
  }
  if (p.day === 24) text = text.replace("看来我们那天系得还挺牢的。", replacements.wishTieReply);
  return text.replace(/\{\{(\w+)\}\}/g, (token, key: string) => replacements[key] ?? token).replace(/^> ?/gm, "").replaceAll("**", "");
}
export function hyunjaeStage(day: number, beat: number, ending: JcodeEndingKind = "together") {
  const story = hyunjaeDay(day, ending);
  const active = story.beats[Math.min(beat, story.beats.length - 1)];
  return { time: active?.time ?? story.time, place: active?.place ?? story.place };
}
export function hyunjaeItinerary(day: number) {
  return [...new Map((hyunjaeDay(day) as unknown as HyDay).beats.filter(beat => beat.channel === "scene" && beat.hyunjaePresent && !beat.place.includes("魔法相册")).map(beat => [beat.time, { time: beat.time, place: beat.place }])).values()];
}
export function hyunjaePreviewProgress(day: number, ending?: JcodeEndingKind): Partial<HyProgress> {
  const p: HyProgress = { day: 1, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: true, hyunjaeChoices: {} };
  const identity = { year: 6, house: "ravenclaw" };
  for (let d = 1; d < day; d++) {
    p.day = d;
    const story = hyunjaeDay(d) as unknown as HyDay;
    for (let i = 0; i < story.beats.length; i++) {
      const b = story.beats[i];
      if (!b.when.every(name => hyunjaeCondition(name, p, identity))) continue;
      if (b.kind === "choice" && b.options) { p.hyunjaeChoices![b.id!] = 1; p.affinity += b.options[1].affinity; }
      if (b.kind === "wager") { p.team = "格兰芬多"; p.wagerStake = 1; }
      if (b.kind === "wish") p.hyunjaeWish = { draft: "", submitted: "", via: "message" };
      if (b.kind === "clue" && b.clue) p.clues.push(b.clue.id);
    }
  }
  return { ...p, day, ending, affinity: ending === "together" ? 100 : p.affinity };
}

export function hyunjaePhysicalPlace(p: HyProgress, identity: HyIdentity) {
  const story = hyunjaeDay(p.day, p.ending) as unknown as HyDay;
  const current = story.beats[p.beat];
  if (!current || current.channel === "mail" || current.kind === "clue" || !current.hyunjaePresent) return undefined;
  return current.when.every(name => hyunjaeCondition(name, p, identity)) ? current.place : undefined;
}

export function hyunjaeLegacyMatch(value: unknown): Partial<HyProgress> {
  if (!value || typeof value !== "object") return {};
  const m = value as { step?: string; team?: string; stake?: number };
  if (!m.step || !["ready", "result", "pub", "buy", "stay", "done"].includes(m.step) || !["格兰芬多", "斯莱特林"].includes(m.team ?? "") || !Number.isInteger(m.stake) || m.stake! < 1 || m.stake! > 10) return {};
  return { team: m.team, wagerStake: m.stake, wagerClaimed: m.step === "done", hyunjaeLegacyWager: true };
}
