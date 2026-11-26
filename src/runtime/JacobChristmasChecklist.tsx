import { useEffect, useRef } from "react";
import type { JacobLine } from "./jcodeExpandedStory";
import "./JacobChristmasChecklist.css";

export const jacobChecklistAnchor = "上面列着这几天需要完成的事情，其中几项已经被划掉了。";
export const jacobChecklist21Anchor = "睡到自然醒。";
export const jacobChecklistItems = [
  { text: "确认本院留校名单", done: true },
  { text: "节日巡逻安排表", done: true },
  { text: "布置圣诞树", done: false },
  { text: "完成魔药课论文", done: false },
  { text: "把写好的圣诞贺卡寄出去", done: true },
  { text: "买一些巧克力和姜饼", done: true },
  { text: "睡到自然醒", done: false },
] as const;
export function jacobChecklistItemsFor(day: 16 | 21) { return jacobChecklistItems.map((item, index) => ({ ...item, done: day === 21 ? index < 6 : item.done })); }
export const jacobChecklistTiming = { title: 900, rows: 1500, character: 95, gap: 320, hold: 8000 };
export const jacobChecklistRowStarts = jacobChecklistItems.reduce<number[]>((starts, item, index) => {
  starts.push(index === 0 ? jacobChecklistTiming.rows : starts[index - 1] + Array.from(jacobChecklistItems[index - 1].text).length * jacobChecklistTiming.character + jacobChecklistTiming.gap);
  return starts;
}, []);
export const jacobChecklistWritingEnd = jacobChecklistRowStarts.at(-1)! + Array.from(jacobChecklistItems.at(-1)!.text).length * jacobChecklistTiming.character + 240;
export const jacobChecklistDuration = jacobChecklistWritingEnd + jacobChecklistTiming.hold;

/** Match SceneDialogue's consecutive-narration grouping without changing story/save IDs. */
export function jacobChecklistStep(lines: JacobLine[], anchor = jacobChecklistAnchor): number {
  let position = -1, narration = false;
  for (const line of lines) {
    if (line.speaker || !narration) position++;
    narration = !line.speaker;
    if (line.body === anchor) return position;
  }
  return -1;
}

/** Opens the isolated paper; cancelling it never completes the story checkpoint. */
export function showJacobChristmasChecklist(startedAt: number | undefined, onStart: (time: number) => void, onComplete: () => void, day: 16 | 21 = 16): () => void {
  const dialog = document.createElement("dialog");
  dialog.className = "jacob-christmas-checklist";dialog.dataset.day = String(day);
  dialog.setAttribute("aria-label", "裴俊英的圣诞待办清单");
  const sheet = document.createElement("section");sheet.className = "jacob-checklist-sheet";
  const title = document.createElement("h2");title.textContent = "things to do before Christmas";
  const list = document.createElement("ul");
  const rows = jacobChecklistItemsFor(day).map(item => {
    const row = document.createElement("li");row.dataset.done = String(item.done);
    const ink = document.createElement("span");ink.className = "jacob-checklist-ink";row.append(ink);list.append(row);
    return ink;
  });
  sheet.append(title, list);dialog.append(sheet);document.body.append(dialog);
  dialog.addEventListener("cancel", event => event.preventDefault());dialog.showModal();
  let disposed = false, timer: number | undefined;
  const dispose = () => { if (disposed) return;disposed = true;window.clearInterval(timer);if (dialog.open) dialog.close();dialog.remove(); };
  const run = () => {
    if (disposed) return;
    const start = startedAt ?? Date.now();if (startedAt === undefined) onStart(start);
    sheet.style.animationDelay = `${-Math.max(0, Date.now() - start)}ms`;
    dialog.dataset.ready = "true";
    const tick = () => {
      if (disposed) return;
      const elapsed = Math.max(0, Date.now() - start);
      if (elapsed >= jacobChecklistTiming.title) title.dataset.visible = "true";
      rows.forEach((ink, index) => {
        const count = Math.max(0, Math.min(Array.from(jacobChecklistItems[index].text).length, Math.floor((elapsed - jacobChecklistRowStarts[index]) / jacobChecklistTiming.character) + 1));
        if (count) ink.parentElement!.dataset.visible = "true";
        const letters = Array.from(jacobChecklistItems[index].text);
        while (ink.childNodes.length < count) { const letter = document.createElement("span");letter.textContent = letters[ink.childNodes.length];ink.append(letter); }
      });
      if (elapsed >= jacobChecklistWritingEnd) dialog.dataset.written = "true";
      if (elapsed >= jacobChecklistDuration) { dispose();onComplete(); }
    };
    timer = window.setInterval(tick, 40);tick();
  };
  // Both are bundled, real handwriting fonts; no system serif fallback during writing.
  void Promise.all([
    document.fonts.load('24px "Jacob Checklist Hand"', jacobChecklistItems.map(item => item.text).join("")),
    document.fonts.load('25px "Jacob Checklist English"', title.textContent),
  ]).then(run, run);
  return dispose;
}

export function JacobChristmasChecklist({ startedAt, onStart, onComplete, day = 16 }: { day?: 16 | 21; startedAt?: number; onStart: (time: number) => void; onComplete: () => void }) {
  const callbacks = useRef({ onStart, onComplete });
  useEffect(() => { callbacks.current = { onStart, onComplete }; }, [onStart, onComplete]);
  const initialStart = useRef(startedAt);
  const initialDay = useRef(day);
  useEffect(() => showJacobChristmasChecklist(initialStart.current, time => callbacks.current.onStart(time), () => callbacks.current.onComplete(), initialDay.current), []);
  return null;
}
