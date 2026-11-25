import { useId, useRef } from "react";
import type { JcodeLine } from "./jcodeStory";
import "./EricPaperStar.css";

export const ERIC_STAR_DURATION = 10000;
const opening = "你也完成了自己的第一颗星星。";
export function isEricPaperStarMoment(lines: JcodeLine[]) {
  return lines[0]?.body.startsWith(opening) && lines[1]?.body === "随着你的魔杖转动，它在空中慢慢划过一道弧线。";
}
// Replace just the two illustrated paragraphs. They were one narration step, so
// existing saved positions (including the next spoken line at step 1) stay valid.
export function ericPaperStarLines(lines: JcodeLine[]) {
  return isEricPaperStarMoment(lines) ? [{ ...lines[0], body: opening }, ...lines.slice(2)] : lines;
}

export function EricPaperStar({ startedAt }: { startedAt: number }) {
  const elapsed = useRef(Math.max(0, Date.now() - startedAt));
  const id = useId();
  const shape = "M120 24 Q124 24 127 33 L148 79 202 86 Q216 88 207 99 L168 138 177 194 Q179 207 167 201 L120 176 70 202 Q58 208 61 194 L71 138 30 99 Q20 89 35 86 L91 79 113 32 Q116 24 120 24Z";
  return <dialog className="eric-paper-star" aria-label="漂浮的浅蓝色纸星星"
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}>
    <div className="eric-paper-star-stage" style={{ animationDelay: `-${elapsed.current}ms` }}>
      <div className="eric-paper-star-float">
        <svg viewBox="0 0 240 240" role="img" aria-label="带细腻银色纹路的浅蓝色折纸五角星">
          <defs>
            <linearGradient id={`${id}-paper`} x2=".8" y2="1"><stop stopColor="#e2eef2" /><stop offset=".52" stopColor="#bed7e4" /><stop offset="1" stopColor="#94b6cb" /></linearGradient>
            <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="8" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope=".075" /></feComponentTransfer><feComposite in2="SourceAlpha" operator="in" /><feBlend in="SourceGraphic" mode="multiply" /></filter>
            <clipPath id={`${id}-clip`}><path d={shape} /></clipPath>
            <pattern id={`${id}-silver`} width="38" height="44" patternUnits="userSpaceOnUse"><path d="M-4 30Q14 5 29 20T48 8M5 48Q5 28 20 34M16 0Q32 5 28 14" fill="none" stroke="#e7ebee" strokeWidth=".65" opacity=".78" /></pattern>
          </defs>
          <g filter={`url(#${id}-grain)`}>
            <path d={shape} fill={`url(#${id}-paper)`} stroke="#9cb7c7" strokeWidth=".85" />
            <path d="M120 25 120 120 92 80Z M211 91 120 120 148 80Z M61 202 120 120 120 176Z" fill="#f0f6f7" opacity=".54" />
            <path d="M175 202 120 120 168 138Z M27 91 120 120 71 138Z" fill="#7099b2" opacity=".24" />
            <path d="m92 80 28 40 28-40m-77 58 49-18 48 18m-48-18v56" fill="none" stroke="#789eb6" opacity=".28" strokeWidth=".7" />
            <path d="M113 32Q117 25 120 24M35 86Q24 90 30 99M177 194Q179 207 167 201" fill="none" stroke="#f1f6f8" strokeWidth="1.8" />
            <rect width="240" height="240" clipPath={`url(#${id}-clip)`} fill={`url(#${id}-silver)`} />
          </g>
        </svg>
      </div>
      <p className="eric-paper-star-spell" lang="en">Wingardium Leviosa</p>
    </div>
  </dialog>;
}
