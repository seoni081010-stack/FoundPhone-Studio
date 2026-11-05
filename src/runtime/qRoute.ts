import story from "../../stories/q/day01.json";
import { makeItem, nodeSchema, type Work } from "../schema";

// Reuse the normal phone and event engine; only the authored route data changes.
export function qRouteWork(original: Work): Work {
  const node = (id: string, label: string, type: string, actions: unknown[], next: string[]) => nodeSchema.parse({
    id, label, type, actions, next, event: "", target: "", conditions: [], once: true, x: 0, y: 0,
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
        { type: "message", key: "owlpost", value: "12月1日｜" + story.opening.join("\n") },
      ], ["q-day01-choice"]),
      node("q-day01-choice", "你的回答", "choice", [], ["q-day01-0", "q-day01-1"]),
      ...story.choices.map((choice, index) => node(`q-day01-${index}`, choice.label, "action", [
        { type: "message", key: "owlpost", value: choice.lines.join("\n") },
        { type: "variable", key: "q_day1_choice", value: index },
        { type: "variable", key: "q_day1_complete", value: true },
        { type: "increment", key: "q_affection", value: 3 },
      ], [])),
    ],
  };
}

export const qFirstDayMail = story.mail.map((entry, index) => ({
  recipient: "q", body: entry.text, outgoing: entry.speaker === "你", day: 1, order: index,
}));

export function qProgressKey(identity?: { name: string; house: string; year: number; runId?: string } | null) {
  return `foundphone-q-day01-${identity?.runId ?? [identity?.name, identity?.house, identity?.year].join("-")}`;
}

export function savedQChoice(key: string): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    return saved?.finished === true && [0, 1].includes(saved.choice) ? saved.choice : null;
  } catch { return null; }
}
