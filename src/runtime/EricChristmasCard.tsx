import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { JcodeLine } from "./jcodeStory";
import "./EricChristmasCard.css";

export const ERIC_CHRISTMAS_TEXT = "希望你度过一个很幸福的圣诞节，也希望明年后年我们还能一起看初雪。圣诞快乐！";
export const ERIC_CHRISTMAS_SIGNATURE = "Eric Sohn";
const intervals = [105,125,90,140,110,95,130];
let writtenAt = 3900;
export const ericChristmasLetters = [...ERIC_CHRISTMAS_TEXT,...ERIC_CHRISTMAS_SIGNATURE].map((character,index) => {
  writtenAt += intervals[index % intervals.length];
  return { character, at: writtenAt };
});
export const ERIC_CHRISTMAS_READY_MS = writtenAt + 240;
export function ericChristmasLeadIn(lines: JcodeLine[]) {
  const index = lines.findIndex(line => line.body === "卡片里面是他熟悉的字迹。");
  return index >= 1 && lines[index - 1].body === "你轻轻拆开信封。" ? lines.slice(0,index + 1) : undefined;
}

export function EricChristmasCard({ player, startedAt, onContinue }: { player: string; startedAt: number; onContinue: () => void }) {
  const id = useId();
  const initialElapsed = useRef(Math.max(0,Date.now()-startedAt));
  const [elapsed,setElapsed] = useState(() => Math.max(0,Date.now() - startedAt));
  const ready = elapsed >= ERIC_CHRISTMAS_READY_MS;
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = Math.max(0,Date.now() - startedAt);setElapsed(next);
      if (next >= ERIC_CHRISTMAS_READY_MS) window.clearInterval(timer);
    },40);
    return () => window.clearInterval(timer);
  },[startedAt]);
  const continueIfReady = () => { if (Date.now() - startedAt >= ERIC_CHRISTMAS_READY_MS) onContinue(); };
  const letters = (start: number,end: number) => ericChristmasLetters.slice(start,end).map((letter,index) =>
    <span className="eric-christmas-glyph" key={index} aria-hidden={elapsed < letter.at} style={{ opacity: Math.min(1,Math.max(0,(elapsed-letter.at)/220)) }}>{letter.character}</span>);
  return <dialog className="eric-christmas-card" aria-label="Eric Sohn 的圣诞贺卡" data-ready={ready} tabIndex={0}
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}
    onClick={continueIfReady} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault();continueIfReady(); } }}>
    <div className="eric-christmas-stage" style={{ animationDelay: `-${initialElapsed.current}ms`, "--eric-delay": `-${initialElapsed.current}ms` } as CSSProperties}>
      <div className="eric-christmas-envelope">
        <div className="eric-christmas-back" />
        <div className="eric-christmas-flap"><span /></div>
        <article className="eric-christmas-letter">
          <p className="eric-christmas-wishes">{letters(0,ERIC_CHRISTMAS_TEXT.length-5)}<span className="eric-christmas-last">{letters(ERIC_CHRISTMAS_TEXT.length-5,ERIC_CHRISTMAS_TEXT.length)}</span></p>
          <p className="eric-christmas-signature">{letters(ERIC_CHRISTMAS_TEXT.length,ericChristmasLetters.length)}</p>
        </article>
        <div className="eric-christmas-pocket" />
        <svg className="eric-christmas-holly" viewBox="0 0 100 70" aria-hidden="true">
          <path d="M21 58Q45 32 79 16" stroke="#596d49" strokeWidth="1.8" fill="none" />
          <path d="M47 40Q23 42 11 26L22 27 19 15 31 18 35 6Q56 21 47 40ZM49 40Q51 15 72 9L69 21 83 19 80 29 94 33Q72 51 49 40Z" fill="#405c43" stroke="#71816b" strokeWidth=".7" />
          <path d="M19 21 46 39M51 38 80 23" fill="none" stroke="#9ba688" strokeWidth=".6" />
          <g fill="#974b43" stroke="#743e37" strokeWidth=".7"><circle cx="44" cy="43" r="4"/><circle cx="52" cy="46" r="4.2"/><circle cx="48" cy="51" r="3.8"/></g>
        </svg>
        <svg className="eric-christmas-name" viewBox="0 0 380 72" aria-label={`信封收件人：${player}`}>
          <defs><path id={`${id}-edge`} d="M26 49Q185 68 354 39" /></defs>
          <text fontSize={Math.max(8,Math.min(25,310/Math.max(1,[...player].length)))} fill="#a6874c"><textPath href={`#${id}-edge`} startOffset="50%" textAnchor="middle">{player}</textPath></text>
        </svg>
        <div className="eric-christmas-seam" />
      </div>
    </div>
  </dialog>;
}
