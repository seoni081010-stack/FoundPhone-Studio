import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import type { JcodeEndingKind } from "./jcodeStory";
import { getJuyeonEndingLetter } from "./juyeonLetterContent";
import "./JuyeonGreetingCard.css";
import "./JuyeonEndingLetter.css";

export const LETTER_TEXT_START_MS = 7800;
export const LETTER_LINE_DELAY_MS = 1650;
export const endingLetterReadyMs = (count: number) => LETTER_TEXT_START_MS + (count - 1) * LETTER_LINE_DELAY_MS + 1600;
type Options = { kind: JcodeEndingKind; playerName: string; container?: HTMLElement; startedAt?: number; onContinueRequest?: () => void };
export type EndingLetterController = { hide: () => void; finished: Promise<boolean> };
const activeLetters = new WeakMap<HTMLElement, EndingLetterController>();

/** Start once; the story controls hide(). No automatic dismissal or ending calculation. */
export function startJuyeonEndingLetter({ container = document.body, ...options }: Options): EndingLetterController {
  activeLetters.get(container)?.hide();
  const host = document.createElement("div"); container.append(host);
  const root = createRoot(host);
  let hidden = false, settled = false;
  let settle: (value: boolean) => void = () => {};
  const finished = new Promise<boolean>(resolve => { settle = resolve; });
  const complete = (value: boolean) => { if (!settled) { settled = true; settle(value); } };
  const controller: EndingLetterController = {
    finished,
    hide() {
      if (hidden) return; hidden = true; complete(false);
      host.querySelector<HTMLDialogElement>("dialog")?.close(); host.hidden = true;
      if (activeLetters.get(container) === controller) activeLetters.delete(container);
      queueMicrotask(() => { root.unmount(); host.remove(); });
    },
  };
  activeLetters.set(container,controller);
  root.render(<EndingLetter {...options} onFinished={() => complete(true)} />);
  return controller;
}

function WaxStar() { return <svg viewBox="0 0 50 50" aria-hidden="true"><path d="m25 9 4.8 10 11 1.3-8 7.5 2.2 11L25 33.5l-10 5.3 2.2-11-8-7.5L20.2 19Z" /></svg>; }
function EndingLetter({ kind, playerName, startedAt, onContinueRequest, onFinished }: Omit<Options,"container"> & { onFinished: () => void }) {
  const initialTime = useRef(startedAt ?? Date.now());
  const elapsed = useRef(Math.max(0,Date.now()-initialTime.current));
  const { paragraphs } = getJuyeonEndingLetter(kind);
  const readyMs = endingLetterReadyMs(paragraphs.length);
  const [readable,setReadable]=useState(elapsed.current>=readyMs);
  const pointer = useRef({x:0,y:0,moved:false});
  useEffect(()=>{
    const timer=window.setTimeout(()=>{setReadable(true);onFinished();},Math.max(0,initialTime.current+readyMs-Date.now()));
    return ()=>window.clearTimeout(timer);
  },[readyMs,onFinished]);
  return <dialog className="juyeon-ending-letter" aria-label="李柱延的跨年信" data-ending={kind} data-readable={readable} tabIndex={0}
    ref={node=>{if(node&&!node.open)node.showModal();}} onCancel={event=>event.preventDefault()}
    onPointerDown={event=>{pointer.current={x:event.clientX,y:event.clientY,moved:false};}}
    onPointerUp={event=>{pointer.current.moved=Math.hypot(event.clientX-pointer.current.x,event.clientY-pointer.current.y)>8;}}
    onClick={()=>{if(readable&&!pointer.current.moved)onContinueRequest?.();pointer.current.moved=false;}}
    onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();if(readable)onContinueRequest?.();}}}>
    <div className="ending-letter-stage" style={{"--letter-elapsed":`-${elapsed.current}ms`} as CSSProperties}>
      <div className="ending-letter-paper">
        <img className="ending-letter-texture" src={`${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`} alt="" />
        <div className="ending-letter-ink">
          <p className="ending-letter-player">{playerName}</p>
          {paragraphs.map((text,index)=><p className="ending-letter-paragraph" key={index} style={{animationDelay:`${LETTER_TEXT_START_MS+index*LETTER_LINE_DELAY_MS-elapsed.current}ms`}}>{text.replaceAll("{{playerName}}",playerName)}</p>)}
          <div className="ending-letter-unwritten" aria-hidden="true" />
        </div>
      </div>
      <div className="ending-envelope">
        <div className="ending-envelope-back" />
        <div className="ending-envelope-lid"><div className="ending-envelope-lid-paper" /><div className="ending-wax wax-upper"><WaxStar /></div></div>
        <div className="ending-envelope-pocket" />
        <div className="ending-wax wax-lower"><WaxStar /></div>
        <div className="ending-wax wax-intact"><WaxStar /></div>
      </div>
    </div>
  </dialog>;
}
