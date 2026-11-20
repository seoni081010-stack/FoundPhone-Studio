import { useId, useRef } from "react";
import type { SunwooLine } from "./sunwooStory";
import "./StarWishPaper.css";

export const STAR_WISH_DURATION = 7000;

// Count the existing SceneDialogue steps without splitting or changing saved cursors.
export function starWishMoment(lines: SunwooLine[]) {
  let position = -1;
  let previousSpeech = true;
  for (const line of lines) {
    if (line.speaker || previousSpeech) position++;
    if (!line.speaker && line.body.startsWith("你也展开自己的纸条。")) {
      return { position, text: line.body.split("上面写着：")[1]?.replace(/^\*/, "") ?? "" };
    }
    previousSpeech = Boolean(line.speaker);
  }
}

export function StarWishPaper({ until, text }: { until?: number; text: string }) {
  const elapsed = useRef(Math.max(0, STAR_WISH_DURATION - ((until ?? Date.now() + STAR_WISH_DURATION) - Date.now())));
  const paperId = useId();
  return <dialog className="star-wish-paper" aria-label="匿名星星纸条"
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}>
    <div className="star-wish-stage" style={{ animationDelay: `-${elapsed.current}ms` }}>
      <svg className="star-wish-folded" viewBox="0 0 240 240" aria-label="折好的淡蓝色纸星星" role="img">
        <defs>
          <linearGradient id={paperId} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e0edf0" /><stop offset=".5" stopColor="#b9d4e1" /><stop offset="1" stopColor="#8fb7cd" />
          </linearGradient>
        </defs>
        <path d="M120 24 Q124 24 127 33 L148 79 202 86 Q216 88 207 99 L168 138 177 194 Q179 207 167 201 L120 176 70 202 Q58 208 61 194 L71 138 30 99 Q20 89 35 86 L91 79 113 32 Q116 24 120 24Z"
          fill={`url(#${paperId})`} stroke="#97b7c9" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M120 26 120 120 92 80Z" fill="#f0f6f6" opacity=".65" />
        <path d="M211 91 120 120 148 80Z" fill="#e5f0f4" opacity=".7" />
        <path d="M175 202 120 120 168 138Z" fill="#719db7" opacity=".35" />
        <path d="M61 202 120 120 120 176Z" fill="#f0f7f6" opacity=".42" />
        <path d="M27 91 120 120 71 138Z" fill="#7aa3bb" opacity=".27" />
        <path d="m92 80 56 0 20 58-48 38-49-38Z" fill="#c4dce6" opacity=".45" stroke="#8eafc3" strokeWidth=".65" />
        <path d="m92 80 28 40 28-40m-77 58 49-18 48 18m-48-18v56" fill="none" stroke="#7197ae" opacity=".3" strokeWidth=".8" />
      </svg>
      <div className="star-wish-strip" aria-label="展开的淡蓝色纸条">
        <div className="star-wish-creases" />
        <p>{text}</p>
      </div>
    </div>
  </dialog>;
}
