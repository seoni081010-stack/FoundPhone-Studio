import { useMemo, useState, type ReactNode } from "react";
import { choose, dispatch } from "../engine";
import { initialRuntime, type Work } from "../schema";
import { flowNodes, qExpanded, type QFlow } from "./qExpansion";
import { SceneDialogue } from "./SceneDialogue";
export function qConditionalLines(
  flow: QFlow,
  variables: Record<string, unknown>,
): string[] {
  return flow.flatMap((part) =>
    typeof part === "string"
      ? [part]
      : "if" in part
        ? qConditionalLines(
            variables[part.if] === part.value ? part.yes : part.no,
            variables,
          )
        : [],
  );
}
export function QMatchExpansion({
  work: original,
  variables,
  storageKey,
  renderLines,
  closing,
  onDone,
}: {
  work: Work;
  variables: Work["variables"];
  storageKey?: string;
  renderLines: (lines: readonly string[]) => ReactNode;
  closing: string[];
  onDone: () => void;
}) {
  const work = useMemo(() => {
    const fragment = flowNodes(
      qExpanded.matchPub as unknown as QFlow,
      "q-pub",
      [],
      "scene",
      12,
    );
    return {
      ...original,
      variables,
      nodes: [
        {
          ...original.nodes[0],
          id: "q-pub-start",
          type: "start" as const,
          conditions: [],
          actions: [],
          next: fragment.entry,
        },
        ...fragment.nodes,
      ],
    };
  }, [original, variables]);
  const [state, setState] = useState(() => {
    let state = dispatch(work, initialRuntime(work), "start");
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        for (const target of saved) state = choose(work, state, target);
      } catch {
        /* Keep current access if storage is unavailable. */
      }
    }
    return state;
  });
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return storageKey
        ? JSON.parse(localStorage.getItem(storageKey) ?? "[]")
        : [];
    } catch {
      return [];
    }
  });
  const select = (target: string) => {
    if (!state.choices.some((c) => c.target === target)) return;
    const next = [...history, target];
    setHistory(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
    setState(choose(work, state, target));
  };
  return (
    <SceneDialogue instantNarration>
      {renderLines(
        (state.messages.scene ?? []).map((m) =>
          m.body.replace(/^12月12日｜/, ""),
        ),
      )}
      {state.choices.length ? (
        <div className="hogwarts-device-choices">
          {state.choices.map((c) => (
            <button key={c.target} onClick={() => select(c.target)}>
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          {renderLines(closing)}
          <button onClick={onDone}>返回今日行程</button>
        </>
      )}
    </SceneDialogue>
  );
}
