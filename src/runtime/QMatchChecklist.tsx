import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./QMatchChecklist.css";
export type QChecklistChoice = "tea" | "chestnuts";
export const qChecklistItems = [
  "栗子",
  "糖果",
  "望远镜",
  "魔法斗篷",
  "银质小刀",
  "南瓜汁",
] as const;
export const qChecklistDuration = 5900;
export const qChecklistAnchors = {
  tea: "现在开始期待明天了。",
  chestnuts: "嗯，不过我的也可以分给你。",
} as const;
export function QMatchChecklist({
  choice,
  onComplete,
}: {
  choice: QChecklistChoice;
  onComplete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [inkReady, setInkReady] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    let disposed = false;
    let timer: number | undefined;
    const begin = () => {
      if (disposed) return;
      setInkReady(true);
      timer = window.setTimeout(() => setReady(true), qChecklistDuration);
    };
    const font = document.fonts?.load('30px "Q Checklist Hand"');
    if (font) void font.then(begin, begin); else begin();
    return () => { disposed = true; window.clearTimeout(timer); };
  }, []);
  const finish = () => {
    if (ready) onComplete();
  };
  return (
    <dialog
      ref={dialog}
      className="q-match-checklist"
      aria-label="池昌民的比赛准备清单"
      data-ink-ready={inkReady}
      data-choice={choice}
      data-ready={ready}
      onCancel={(event) => event.preventDefault()}
    >
      <div
        className="q-match-checklist-paper"
        role="button"
        tabIndex={0}
        aria-label="清单写完后，点击羊皮纸任意位置继续"
        aria-disabled={!ready}
        onClick={finish}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            finish();
          }
        }}
      >
        <ul>
          {qChecklistItems.map((item, index) => (
            <li
              key={item}
              style={{ "--row": index } as CSSProperties}
              data-crossed={index < 3}
              data-obliterated={index === 5}
            >
              <span className="q-list-word">
                {item}
                {(index < 3 || index === 5) && (
                  <svg
                    className="q-list-strikes"
                    viewBox="0 0 130 30"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M3 17 Q47 12 126 15" />
                    {index === 5 && (
                      <>
                        <path d="M1 9 Q67 19 128 11" />
                        <path d="M4 23 Q71 14 125 24" />
                        <path d="M2 15 L129 19" />
                      </>
                    )}
                  </svg>
                )}
                {index === 0 && choice === "chestnuts" && (
                  <svg
                    className="q-list-circle"
                    viewBox="0 0 150 70"
                    aria-hidden="true"
                  >
                    <path d="M124 18 C102 -3 23 1 10 28 C-4 61 96 71 131 47 C153 30 127 8 106 9" />
                  </svg>
                )}
              </span>
            </li>
          ))}
          {choice === "tea" && (
            <li className="q-list-tea">
              <span>热茶</span>
            </li>
          )}
        </ul>
      </div>
    </dialog>
  );
}
