import { useEffect, useRef } from "react";
import "./JacobChristmasLetter.css";

export const jacobChristmasLetterAnchor = "原来你选的是这样的颜色。";
export const jacobChristmasLetterText = [
  "圣诞快乐。",
  "今年 12 月发生了很多值得记住，也有很多原本很普通变得特别特别的日子。",
  "谢谢你愿意把一些时间留给我。",
  "希望你在新的一年能够做自己很多喜欢的事情，遇到烦恼的时候也不总是一个人想办法。",
  "希望明年的圣诞节你也会过得很开心。",
  "Jacob",
] as const;
export const jacobChristmasLetterReveals = [4300, 5400, 6800, 8000, 9800, 11200];
export const jacobChristmasLetterWrittenAt = 12400;

export type ChristmasLetterContent = { label: string; front: string; text: readonly string[]; reveals: readonly number[]; writtenAt: number; className?: string };
const defaultLetter: ChristmasLetterContent = { label: "Jacob的圣诞来信", front: "Merry Christmas from Jacob", text: jacobChristmasLetterText, reveals: jacobChristmasLetterReveals, writtenAt: jacobChristmasLetterWrittenAt };

/** An independent letter from Jacob; it never reads the player's Day13 card. */
export function showJacobChristmasLetter(startedAt: number | undefined, onStart: (time: number) => void, onContinue: () => void, content: ChristmasLetterContent = defaultLetter): () => void {
  const dialog = document.createElement("dialog");dialog.className = `jacob-christmas-letter ${content.className ?? ""}`.trim();dialog.setAttribute("aria-label", content.label);
  const stage = document.createElement("section");stage.className = "jacob-letter-stage";stage.tabIndex = 0;stage.setAttribute("role", "button");stage.setAttribute("aria-label", "全部文字显示后，点击贺卡任意位置继续剧情");stage.setAttribute("aria-disabled", "true");
  const envelopePosition = document.createElement("div");envelopePosition.className = "jacob-letter-envelope-position";
  const envelope = document.createElement("div");envelope.className = "jacob-letter-envelope";
  const flap = document.createElement("span");flap.className = "jacob-letter-flap";flap.setAttribute("aria-hidden", "true");
  const front = document.createElement("p");front.className = "jacob-letter-front";front.textContent = content.front;
  const ribbon = document.createElement("span");ribbon.className = "jacob-letter-ribbon";ribbon.setAttribute("aria-hidden", "true");
  envelope.append(flap, front, ribbon);envelopePosition.append(envelope);
  const paper = document.createElement("article");paper.className = "jacob-letter-paper";
  const paragraphs = content.text.map((text, i) => { const p = document.createElement(i === 0 ? "h2" : "p");p.textContent = text;p.className = i === content.text.length - 1 ? "jacob-letter-signature" : "jacob-letter-paragraph";p.setAttribute("aria-live", "off");paper.append(p);return p; });
  stage.append(envelopePosition, paper);dialog.append(stage);document.body.append(dialog);
  let disposed = false, written = false, timer: number | undefined;
  const dispose = () => { if (disposed) return;disposed = true;window.clearInterval(timer);if (dialog.open) dialog.close();dialog.remove(); };
  const confirm = () => { if (!written || disposed) return;dispose();onContinue(); };
  dialog.addEventListener("cancel", event => event.preventDefault());
  dialog.addEventListener("click", event => { const b = dialog.getBoundingClientRect();if ((event.target instanceof Node && stage.contains(event.target)) || (event.clientX >= b.left && event.clientX <= b.right && event.clientY >= b.top && event.clientY <= b.bottom)) confirm(); });
  stage.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault();confirm(); } });
  dialog.showModal();stage.focus({ preventScroll: true });
  const run = () => {
    if (disposed) return;
    const start = startedAt ?? Date.now();if (startedAt === undefined) onStart(start);
    dialog.style.setProperty("--jacob-letter-elapsed", `${Math.max(0, Date.now() - start)}ms`);dialog.dataset.ready = "true";
    const tick = () => {
      if (disposed) return;
      const elapsed = Math.max(0, Date.now() - start);
      paragraphs.forEach((p, i) => { if (elapsed >= content.reveals[i] && !p.dataset.visible) { p.style.animationDelay = `${-(elapsed - content.reveals[i])}ms`;p.dataset.visible = "true"; } });
      if (elapsed >= content.writtenAt) { written = true;dialog.dataset.written = "true";stage.setAttribute("aria-disabled", "false");window.clearInterval(timer); }
    };
    timer = window.setInterval(tick, 50);tick();
  };
  void Promise.all([
    document.fonts.load('20px "Jacob Christmas Hand"', content.text.join("")),
    document.fonts.load('27px "Jacob Christmas English"', content.front + content.text.at(-1)),
  ]).then(run, run);
  return dispose;
}

export function JacobChristmasLetter({ startedAt, onStart, onContinue }: { startedAt?: number; onStart: (time: number) => void; onContinue: () => void }) {
  const callbacks = useRef({ onStart, onContinue }), initialStart = useRef(startedAt);
  useEffect(() => { callbacks.current = { onStart, onContinue }; }, [onStart, onContinue]);
  useEffect(() => showJacobChristmasLetter(initialStart.current, time => callbacks.current.onStart(time), () => callbacks.current.onContinue()), []);
  return null;
}
