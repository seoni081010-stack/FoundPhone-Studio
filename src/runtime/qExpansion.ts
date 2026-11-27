import expanded from "../../stories/q-expanded.json";
import {
  nodeSchema,
  type Work,
  type StoryNode,
  type Action,
  type Runtime,
} from "../schema";
import { choose } from "../engine";
export type QFlow = (
  | string
  | { choice: { label: string; flow: QFlow }[]; key: string }
  | { if: string; value: number; yes: QFlow; no: QFlow }
)[];
type Operation = {
  id: string;
  day: number;
  node: string;
  anchor: string | null;
  where: string;
  flow: QFlow;
  time: string | null;
  place: string | null;
  channel: string;
  append?: Operation[];
};
export const qExpanded = expanded;
const make = (
  id: string,
  type: string,
  actions: unknown[],
  next: string[],
  conditions: unknown[] = [],
  label = "继续",
) =>
  nodeSchema.parse({
    id,
    type,
    label,
    actions,
    next,
    conditions,
    event: "",
    target: "",
    once: true,
    x: 0,
    y: 0,
  });
// New choices have separate IDs and zero additional points. Original IDs remain intact.
export function flowNodes(
  flow: QFlow,
  prefix: string,
  next: string[],
  channel = "scene",
  day = 1,
): { nodes: StoryNode[]; entry: string[] } {
  let serial = 0;
  const nodes: StoryNode[] = [];
  function compile(raw: QFlow, exit: string[]): string[] {
    const parts: QFlow = [];
    for (const [index, originalItem] of raw.entries()) {
      const item =
        channel === "owlpost" &&
        typeof originalItem === "string" &&
        originalItem.startsWith("你：")
          ? {
              choice: [{ label: originalItem.slice(2), flow: [] }],
              key: `${prefix}-fixed-${index}`,
            }
          : originalItem;
      if (typeof item === "string" && typeof parts.at(-1) === "string")
        parts[parts.length - 1] = String(parts.at(-1)) + "\n" + item;
      else parts.push(item);
    }
    let tail = exit;
    for (let i = parts.length - 1; i >= 0; i--) {
      const item = parts[i];
      const id = `${prefix}-n${serial++}`;
      if (typeof item === "string") {
        nodes.push(
          make(
            id,
            "action",
            [{ type: "message", key: channel, value: `12月${day}日｜${item}` }],
            tail,
          ),
        );
        tail = [id];
      } else if ("choice" in item) {
        const targets = item.choice.map((option, index) => {
          const target = `${id}-option${index}`;
          const entry = compile(option.flow, tail);
          nodes.push(
            make(
              target,
              "action",
              [
                { type: "variable", key: item.key, value: index },
                {
                  type: "message",
                  key: channel,
                  value: `12月${day}日｜你：${option.label}`,
                },
              ],
              entry,
              [],
              option.label,
            ),
          );
          return target;
        });
        nodes.push(make(id, "choice", [], targets));
        tail = [id];
      } else {
        const yes = compile(item.yes, tail),
          no = compile(item.no, tail);
        const a = `${id}-yes`,
          b = `${id}-no`;
        nodes.push(
          make(a, "action", [], yes, [
            { key: item.if, op: "eq", value: item.value },
          ]),
        );
        nodes.push(
          make(b, "action", [], no, [
            { key: item.if, op: "neq", value: item.value },
          ]),
        );
        nodes.push(make(id, "action", [], [a, b]));
        tail = [id];
      }
    }
    return tail;
  }
  const entry = compile(flow, next);
  return { nodes, entry };
}
export function applyQExpansion(work: Work): Work {
  const nodes = work.nodes.map((n) => ({
    ...n,
    actions: [...n.actions],
    next: [...n.next],
  }));
  const operations = expanded.operations as unknown as Operation[];
  // Reverse ensures adjacent additions occur in manuscript order at the same anchor.
  for (const op of [...operations].reverse()) {
    const original = nodes.find((n) => n.id === op.node);
    if (!original) throw Error(`Q anchor missing: ${op.node}`);
    let index = original.actions.findIndex((a) => a.type === "message");
    if (op.anchor) {
      index = original.actions.findIndex(
        (a) => a.type === "message" && String(a.value).includes(op.anchor!),
      );
      if (index < 0)
        throw Error(`Q text anchor missing: ${op.id}: ${op.anchor}`);
    }
    const before: Action[] = [];
    const after: Action[] = [];
    if (op.where === "after" && !op.anchor) {
      before.push(...original.actions);
    } else if (op.where === "end") {
      // Completion remains after the added scene, never before its choices.
      for (const action of original.actions)
        ((action.type === "variable" &&
          (action.key === "q_completed_day" ||
            action.key === "story_delivery") &&
          action.value === "done") ||
        action.key === "q_completed_day"
          ? after
          : before
        ).push(action);
    } else if (index < 0) {
      for (const action of original.actions) {
        if (
          action.key === "q_completed_day" ||
          (action.key === "story_delivery" && action.value === "done")
        )
          after.push(action);
        else before.push(action);
      }
    } else {
      before.push(...original.actions.slice(0, index));
      const action = original.actions[index];
      const text = String(action.value);
      let at = 0;
      if (op.anchor)
        at =
          text.indexOf(op.anchor) +
          (op.where === "after" ? op.anchor.length : 0);
      const head = text.slice(0, at).replace(/\n$/, "");
      const rest = text.slice(at).replace(/^\n/, "");
      if (head) before.push({ ...action, value: head });
      if (rest) after.push({ ...action, value: rest });
      after.push(...original.actions.slice(index + 1));
    }
    const suffix = `${op.id}-resume-at-${op.node}`;
    const time = original.actions.find(
      (a) => a.type === "variable" && a.key === "scene_time",
    );
    const place = original.actions.find(
      (a) => a.type === "variable" && a.key === "scene_place",
    );
    // Restore the original scene after a preceding added visit; avoid clock regression for after/tail insertions.
    const restores =
      op.where === "start" || (op.anchor && op.where === "before")
        ? [time, place].filter((a): a is Action => !!a)
        : [];
    nodes.push(
      make(
        suffix,
        original.type === "choice" ? "choice" : "action",
        [...restores, ...after],
        original.next,
        [],
        original.label,
      ),
    );
    let exit = [suffix];
    const chunks = [op, ...(op.append ?? [])];
    for (const chunk of [...chunks].reverse()) {
      const flow = flowNodes(
        chunk.flow,
        `${chunk.id}-at-${op.node}`,
        exit,
        chunk.channel === "mail" ? "owlpost" : "scene",
        chunk.day,
      );
      nodes.push(...flow.nodes);
      const entry = `${chunk.id}-enter-at-${op.node}`;
      nodes.push(
        make(
          entry,
          "action",
          [
            { type: "variable", key: "story_delivery", value: chunk.channel },
            ...(chunk.time
              ? [{ type: "variable", key: "scene_time", value: chunk.time }]
              : []),
            ...(chunk.place
              ? [{ type: "variable", key: "scene_place", value: chunk.place }]
              : []),
          ],
          flow.entry,
        ),
      );
      exit = [entry];
    }
    original.type = "action";
    original.actions = before;
    original.next = exit;
  }
  return { ...work, nodes };
}
// Replay old saves through newly inserted, score-neutral choices without resetting the run.
export function replayQChoice(
  work: Work,
  state: Runtime,
  target: string,
): Runtime {
  let next = state;
  for (
    let i = 0;
    i < 100 && !next.choices.some((c) => c.target === target);
    i++
  ) {
    if (
      !next.choices.length ||
      !next.choices.every((c) => c.target.startsWith("q-expanded-"))
    )
      break;
    next = choose(work, next, next.choices[0].target);
  }
  return choose(work, next, target);
}

export function qExpandedItinerary(day: number) {
  const all = (expanded.operations as unknown as Operation[]).flatMap((o) => [
    o,
    ...(o.append ?? []),
  ]);
  return all
    .filter((o) => o.day === day && o.channel === "scene" && o.time && o.place)
    .map((o) => ({ time: o.time!, place: o.place! }));
}
