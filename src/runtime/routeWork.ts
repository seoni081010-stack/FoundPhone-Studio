import { choose, dispatch } from "../engine";
import { people } from "./HogwartsCharacters";
import story from "../../stories/q/day01.json";
import earlyDays from "../../stories/q/days02-06.json";
import laterDays from "../../stories/q/days07-16.json";
import middleDays from "../../stories/q/days17-22.json";
import holidayDays from "../../stories/q/days23-26.json";
import { initialRuntime, makeItem, nodeSchema, type Work } from "../schema";

const followingDays: { day: number; label: string; match?: { opening: string[]; gryffindor: string[]; slytherin: string[]; won: string[]; lost: string[]; closing: string[] }; album?: { id: string; title: string; body: string; requiresChoice?: string }; stages: {
  channel: string; time: string; place: string; opening: string[]; choices: { label: string; lines: string[]; affinity?: number }[];
  tail: string[]; openingVariant?: { key: string; value: number; accepted: string; otherwise: string }; endPlace?: string; endTime?: string;
}[] }[] = [...earlyDays, ...laterDays, ...middleDays, ...holidayDays];

// Reuse the normal phone and event engine; only the authored route data changes.
export function qRouteWork(original: Work): Work {
  const node = (id: string, label: string, type: string, actions: unknown[], next: string[], conditions: unknown[] = []) => nodeSchema.parse({
    id, label, type, actions, next, event: "", target: "", conditions, once: true, x: 0, y: 0,
  });
  return {
    ...original,
    id: "hogwarts-q-december", title: "霍格沃茨十二月 · 池昌民",
    data: { ...original.data, owlpost: [], magicphotos: [], wizardjournal: [makeItem({ id: "journal-route", body: "" })] },
    variables: { q_affection: 0, q_jealousy: 0, q_day1_complete: false, q_mail_unlocked: false },
    nodes: [
      node("q-start", "十二月开始", "start", [], ["q-day01-scene"]),
      node("q-day01-scene", "图书馆的黄铜甲虫", "action", [
        { type: "date", key: "", value: "2026-12-01" },
        { type: "variable", key: "story_delivery", value: "scene" },
        { type: "variable", key: "scene_time", value: "17:00" },
        { type: "variable", key: "scene_place", value: "图书馆" },
        { type: "message", key: "scene", value: "12月1日｜" + story.opening.join("\n") },
      ], ["q-day01-choice"]),
      node("q-day01-choice", "你的回答", "choice", [], ["q-day01-0", "q-day01-1"]),
      ...story.choices.map((choice, index) => node(`q-day01-${index}`, choice.label, "action", [
        { type: "message", key: "scene", value: choice.lines.join("\n") },
        { type: "variable", key: "q_day1_choice", value: index },
        { type: "variable", key: "q_day1_complete", value: true },
        { type: "increment", key: "q_affection", value: 1 },
      ], ["q-day02-stage0"])),
      ...followingDays.flatMap((day, dayIndex) => day.stages.flatMap((stage, stageIndex) => {
        const prefix = `q-day${String(day.day).padStart(2, "0")}-stage${stageIndex}`;
        const hasNextStage = stageIndex + 1 < day.stages.length;
        const travel = hasNextStage && stage.channel === "mail";
        const nextStage = hasNextStage ? travel ? `${prefix}-travel` : `q-day${String(day.day).padStart(2, "0")}-stage${stageIndex + 1}` : undefined;
        const nextDay = followingDays[dayIndex + 1];
        const next = nextStage ? [nextStage] : nextDay ? [`q-day${String(nextDay.day).padStart(2, "0")}-stage0`] : [];
        const channel = stage.channel === "mail" ? "owlpost" : "scene";
        const completedActions = nextStage ? [] : [
          { type: "variable", key: "q_completed_day", value: day.day },
          { type: "variable", key: "story_delivery", value: "done" },
        ];
        const choiceNode = `${prefix}-choice`;
        const variant = stage.openingVariant;
        const variantNodes = variant ? [
          node(`${prefix}-accepted`, day.label, "action", [
            { type: "message", key: channel, value: variant.accepted },
          ], [choiceNode], [{ key: variant.key, op: "eq", value: variant.value }]),
          node(`${prefix}-undecided`, day.label, "action", [
            { type: "message", key: channel, value: variant.otherwise },
          ], [choiceNode], [{ key: variant.key, op: "neq", value: variant.value }]),
        ] : [];
        return [
          node(prefix, day.label, "action", [
            ...(stageIndex === 0 ? [{ type: "date", key: "", value: `2026-12-${String(day.day).padStart(2, "0")}` }] : []),
            { type: "variable", key: "story_delivery", value: stage.channel },
            { type: "variable", key: "scene_time", value: stage.time },
            { type: "variable", key: "scene_place", value: stage.place },
            ...(stage.opening.length ? [{ type: "message", key: channel, value: `12月${day.day}日｜` + stage.opening.join("\n") }] : []),
          ], variant ? variantNodes.map(entry => entry.id) : [choiceNode]),
          ...variantNodes,
          node(choiceNode, "你的回答", "choice", [], stage.choices.map((_, index) => `${prefix}-${index}`)),
          ...stage.choices.map((choice, index) => node(`${prefix}-${index}`, choice.label, "action", [
            { type: "message", key: channel, value: choice.lines.join("\n") },
            { type: "variable", key: `${prefix}-selected`, value: index },
            { type: "increment", key: "q_affection", value: choice.affinity ?? (stage.choices.length > 1 ? 1 : 0) },
          ], [`${prefix}-tail`])),
          node(`${prefix}-tail`, "继续", "action", [
            ...(stage.tail.length ? [{ type: "message", key: channel, value: stage.tail.join("\n") }] : []),
            ...("endPlace" in stage ? [{ type: "variable", key: "scene_place", value: stage.endPlace }] : []),
            ...completedActions,
          ], next),
          ...(travel && nextStage ? [node(nextStage, "前往见面地点", "choice", [
            { type: "variable", key: "story_delivery", value: "travel" },
          ], [`q-day${String(day.day).padStart(2, "0")}-stage${stageIndex + 1}`])] : []),
        ];
      })),
    ],
  };
}

export function gateRouteDays(route: Work): Work {
  const boundaries = route.nodes.filter(node => node.actions.some(action =>
    action.type === "date" && /^2026-12-(?!01$)\d{2}$/.test(String(action.value))));
  const ids = new Set(boundaries.map(node => node.id));
  return { ...route, nodes: [
    ...route.nodes.map(node => ({ ...node, next: node.next.map(id => ids.has(id) ? `end-day:${id}` : id) })),
    ...boundaries.map(node => ({ ...node, id: `end-day:${node.id}`, type: "choice" as const,
      actions: [], conditions: [], next: [node.id] })),
  ] };
}

export const qDays = followingDays;

export function qAlbumClues(readDays: readonly number[], completed: readonly string[]) {
  return qDays.flatMap(({ day, album }) =>
    album && readDays.includes(day) && (!album.requiresChoice || completed.includes(album.requiresChoice))
      ? [{ id: album.id, title: album.title, body: album.body, unlocked: true }]
      : []);
}

export const qSceneSpeakers = new Set(["池昌民", "你", "学生", "画像里的老巫师", "皮皮鬼", "猎犬画像", "国王", "黑国王", "同学", "室友"]);

export function qLetters(messages: Work["data"][string]) {
  let day = 1;
  let order = 0;
  return messages.flatMap(entry => {
    const heading = entry.body.match(/^12月(\d+)日｜/);
    if (heading) day = Number(heading[1]);
    return entry.body.replace(/^12月\d+日｜/, "").split("\n").filter(Boolean).map(line => {
      const speaker = line.match(/^(池昌民|你)：(.+)$/);
      return { body: speaker ? speaker[2] : line, outgoing: speaker?.[1] === "你", narration: !speaker, day, order: order++ };
    });
  });
}

export const qFirstDayMail = story.mail.map((entry, index) => ({
  recipient: "q", body: entry.text, outgoing: entry.speaker === "你", day: 1, order: index,
}));

export function qProgressKey(identity?: { name: string; house: string; year: number; runId?: string } | null) {
  return `foundphone-q-day01-${identity?.runId ?? [identity?.name, identity?.house, identity?.year].join("-")}`;
}

export type QMail = { recipient: string; body: string; outgoing: boolean; day: number; order: number };
export type QMatchProgress = { step: "bet" | "ready" | "result" | "pub" | "buy" | "stay" | "done"; team: string; stake: number; visitedPub: boolean; conversation?: "intro" | "reaction" };
export type QProgress = {
  match?: QMatchProgress; mailRead?: Record<string, number>;
  choices: string[]; readDays: number[]; attended: Record<string, boolean>; time: string;
  mailUnlocked: boolean; extraMail: QMail[]; acknowledgedClues: string[]; legacy: boolean; jealousy?: number;
};

export function readQProgress(key: string): QProgress {
  const empty: QProgress = { choices: [], readDays: [], attended: {}, time: "09:00", mailUnlocked: false, extraMail: [], acknowledgedClues: [], legacy: false };
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (saved?.version === 2 && Array.isArray(saved.choices) && Array.isArray(saved.readDays)) {
      return {
        choices: saved.choices.filter((value: unknown) => typeof value === "string").slice(0, 500),
        readDays: saved.readDays.filter((value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 31),
        attended: Object.fromEntries(Object.entries(saved.attended ?? {}).filter(([, value]) => value === true).map(([key]) => [key, true])),
        time: /^\d{2}:\d{2}$/.test(saved.time) ? saved.time : "09:00",
        mailUnlocked: saved.mailUnlocked === true,
        extraMail: Array.isArray(saved.extraMail) ? saved.extraMail.filter((value: QMail) => value && typeof value.body === "string" && typeof value.recipient === "string" && typeof value.outgoing === "boolean" && Number.isFinite(value.day) && Number.isFinite(value.order)) : [],
        acknowledgedClues: Array.isArray(saved.acknowledgedClues) ? saved.acknowledgedClues.filter((value: unknown) => typeof value === "string") : [],
        legacy: false,
        mailRead: Object.fromEntries(Object.entries(saved.mailRead ?? {}).filter(([, value]) => Number.isInteger(value) && Number(value) >= 0).map(([key, value]) => [key, Number(value)])),
        match: saved.match && ["bet", "ready", "result", "pub", "buy", "stay", "done"].includes(saved.match.step)
          && ["", "格兰芬多", "斯莱特林"].includes(saved.match.team) && Number.isInteger(saved.match.stake)
          && saved.match.stake >= 1 && saved.match.stake <= 10
          ? { ...saved.match, visitedPub: saved.match.visitedPub === true, conversation: ["intro", "reaction"].includes(saved.match.conversation) ? saved.match.conversation : undefined } : undefined,
        jealousy: Number.isFinite(saved.jealousy) ? saved.jealousy : undefined,
      };
    }
    if (saved?.finished === true && [0, 1].includes(saved.choice)) return {
      ...empty, choices: [`q-day01-${saved.choice}`], readDays: [1], time: "20:00",
      mailUnlocked: true, extraMail: qFirstDayMail, legacy: true,
    };
  } catch { /* Preserve access to the game when browser storage is unavailable. */ }
  return empty;
}

export function characterRouteWork(original: Work, characterId: string): Work {
  if (characterId === "hyunjae") return original;
  if (characterId === "q") return qRouteWork(original);
  const person = people.find(character => character.id === characterId);
  return {
    ...original,
    id: `hogwarts-${characterId}-december`, title: `霍格沃茨十二月 · ${person?.name ?? ""}`,
    data: { ...original.data, owlpost: [], magicphotos: [], wizardjournal: [makeItem({ id: "journal-route", body: "" })] },
    variables: { [`${characterId}_affection`]: 0, [`${characterId}_jealousy`]: 0 },
    nodes: [nodeSchema.parse({
      id: `${characterId}-start`, label: "十二月开始", type: "start", event: "", target: "",
      conditions: [], actions: [], next: [], once: true, x: 0, y: 0,
    })],
  };
}


// Read-only review starts on the requested authored day, never by changing the real save.
export function qDayPreviewProgress(original: Work, day: number): QProgress {
  const work = gateRouteDays(qRouteWork(original));
  let state = dispatch(work, initialRuntime(work), "start");
  const history: string[] = [];
  const date = `2026-12-${String(day).padStart(2, "0")}`;
  for (let step = 0; state.date !== date && state.choices.length && step < 500; step++) {
    const target = state.choices[0].target;
    history.push(target);
    state = choose(work, state, target);
  }
  if (state.date !== date) throw new Error("该日期尚未开放预览。");
  const readDays = Array.from({ length: day - 1 }, (_, index) => index + 1);
  return { choices: history, readDays,
    attended: {}, time: day === 12 ? "14:00" : "16:00", mailUnlocked: true, extraMail: [],
    acknowledgedClues: qAlbumClues(readDays, state.completed).map(clue => clue.id), legacy: false };
}
