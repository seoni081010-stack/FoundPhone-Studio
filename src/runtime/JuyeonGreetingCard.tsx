import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import "./JuyeonGreetingCard.css";

export const GREETING_TEXT_READY_MS = 12000;
export const GREETING_ANIMATION_MS = 13200;
export const GREETING_LINES = ["圣诞快乐。", "希望以后还有机会", "一起去看看不一样的星空。", "by Juyeon"] as const;

type Options = {
  playerName: string;
  container?: HTMLElement;
  startedAt?: number;
  onContinueRequest?: () => void;
};
export type GreetingCardController = { hide: () => void; finished: Promise<boolean> };
const activeCards = new WeakMap<HTMLElement, GreetingCardController>();

/** One call opens the card. It never hides itself; the story owns hide(). */
export function startJuyeonGreetingCard({ container = document.body, ...options }: Options): GreetingCardController {
  activeCards.get(container)?.hide();
  const host = document.createElement("div"); container.append(host);
  const root = createRoot(host);
  let hidden = false, settled = false;
  let settle: (finished: boolean) => void = () => {};
  const finished = new Promise<boolean>(resolve => { settle = resolve; });
  const complete = (value: boolean) => { if (!settled) { settled = true; settle(value); } };
  const controller: GreetingCardController = {
    finished,
    hide() {
      if (hidden) return;
      hidden = true; complete(false);
      host.querySelector<HTMLDialogElement>("dialog")?.close();
      host.hidden = true;
      if (activeCards.get(container) === controller) activeCards.delete(container);
      // Also safe when called by the cleanup of a parent React effect.
      queueMicrotask(() => { root.unmount(); host.remove(); });
    },
  };
  activeCards.set(container, controller);
  root.render(<GreetingCard {...options} onFinished={() => complete(true)} />);
  return controller;
}

function SilverStar({ className = "" }: { className?: string }) {
  return <svg className={`greeting-silver-star ${className}`} viewBox="0 0 40 40" aria-hidden="true">
    <path d="m20 5 4.5 10 11 1-8.4 7.5 2.8 11L20 29l-10 5.5 2.7-11L4.5 16l11-1Z" />
  </svg>;
}

function GreetingCard({ playerName, startedAt, onContinueRequest, onFinished }: Omit<Options,"container"> & { onFinished: () => void }) {
  const initialTime = useRef(startedAt ?? Date.now());
  const elapsed = useRef(Math.max(0, Date.now() - initialTime.current));
  const [readable, setReadable] = useState(elapsed.current >= GREETING_TEXT_READY_MS);
  useEffect(() => {
    const readyTimer = window.setTimeout(() => setReadable(true), Math.max(0, initialTime.current + GREETING_TEXT_READY_MS - Date.now()));
    const finishTimer = window.setTimeout(onFinished, Math.max(0, initialTime.current + GREETING_ANIMATION_MS - Date.now()));
    return () => { window.clearTimeout(readyTimer); window.clearTimeout(finishTimer); };
  }, [onFinished]);
  const requestContinue = () => { if (readable) onContinueRequest?.(); };
  return <dialog className="juyeon-greeting-modal" aria-label="李柱延的圣诞贺卡"
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}>
    <article className="greeting-card-stage" role="button" tabIndex={0} aria-label="圣诞贺卡" aria-disabled={!readable}
      data-readable={readable} onClick={event => {
        // Browsers can retarget clicks on a 3D paper face to its assembly.
        const insidePaper = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(".greeting-paper")).some(paper => {
          const box = paper.getBoundingClientRect();
          return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        });
        if ((event.target as Element).closest(".greeting-paper") || insidePaper) requestContinue();
      }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); requestContinue(); } }}
      style={{ "--greeting-elapsed": `-${elapsed.current}ms` } as CSSProperties}>
      <div className="greeting-card-assembly">
        <div className="greeting-inner greeting-paper">
          <div className="greeting-writing">
            {GREETING_LINES.slice(0,3).map((line,index) => <p key={line} className={`greeting-line greeting-line-${index}`}>{line}</p>)}
            <p className="greeting-signature">{GREETING_LINES[3]}</p>
          </div>
          <SilverStar className="greeting-inner-star" />
        </div>
        <div className="greeting-cover">
          <div className="greeting-cover-front greeting-paper">
            <SilverStar className="greeting-edge-star edge-one" /><SilverStar className="greeting-edge-star edge-two" />
            <SilverStar className="greeting-edge-star edge-three" /><SilverStar className="greeting-edge-star edge-four" />
            <span className={`greeting-player-name${Array.from(playerName).length>12 ? " long-name" : ""}`}>{playerName}</span>
            <div className="greeting-bottom-crease" />
          </div>
          <div className="greeting-cover-back greeting-paper"><SilverStar className="greeting-back-star" /></div>
          <div className="greeting-bend-shadow" />
        </div>
      </div>
    </article>
  </dialog>;
}
