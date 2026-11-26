import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import "./WinterWishTag.css";

export type WinterWishTagHandle = { reset: () => void };
type Props = {
  draft: string;
  submitted?: string;
  onDraft: (value: string) => void;
  onSubmit: (value: string) => void;
  onContinue: () => void;
  onReset: () => void;
  ref?: Ref<WinterWishTagHandle>;
};
/** Reusable wish tag. Reset is an API only; no extra control appears in the story. */
export function WinterWishTag({ draft, submitted, onDraft, onSubmit, onContinue, onReset, ref }: Props) {
  const locked = useRef(Boolean(submitted));
  const complete = useRef(onContinue);
  useEffect(() => { complete.current = onContinue; }, [onContinue]);
  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(() => complete.current(), 1500);
    return () => window.clearTimeout(timer);
  }, [submitted]);
  useImperativeHandle(ref, () => ({ reset: () => { locked.current = false; onReset(); } }), [onReset]);
  return <div className={`winter-wish-tag${submitted ? " is-submitted" : ""}`} data-submitted={Boolean(submitted)}>
    <div className="winter-wish-tag-cord" aria-hidden="true" />
    <form className="hyunjae-wish winter-wish-tag-paper" onSubmit={event => {
      event.preventDefault();
      if (locked.current || submitted || !draft.trim()) return;
      locked.current = true;
      onSubmit(draft.trim());
    }}>
      <span className="winter-wish-tag-hole" aria-hidden="true" />
      <svg className="winter-wish-tag-holly" viewBox="0 0 70 58" aria-hidden="true">
        <path d="M11 41Q23 21 46 12M29 28Q11 25 10 12Q27 7 34 23M35 22Q37 4 56 5Q59 20 40 27" fill="#697b5e" fillOpacity=".55" stroke="#657055" strokeWidth=".7" />
        <circle cx="31" cy="30" r="2.5" fill="#a8786c" /><circle cx="37" cy="32" r="2" fill="#a8786c" />
      </svg>
      <header className="winter-wish-tag-title">
        <p lang="en">make a wish</p>
        <h2 id="hyunjae-expanded-title">寄给冬天的愿望</h2>
      </header>
      <div className="winter-wish-tag-writing">
        {submitted ? <p className="winter-wish-tag-written" aria-live="polite">{submitted}</p>
          : <textarea aria-label="你的愿望" placeholder="写下你的冬日愿望……" value={draft} onChange={event => onDraft(event.target.value)} />}
      </div>
      <p className="winter-wish-tag-secret">这是一个只属于你的秘密。</p>
      <button disabled={Boolean(submitted) || !draft.trim()} type="submit">将愿望挂上圣诞树</button>
      <svg className="winter-wish-tag-stars" viewBox="0 0 72 66" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth=".8">
        <path d="m35 12 2 7 7 2-7 2-2 7-2-7-7-2 7-2zM15 38v16M7 46h16M9 40l12 12M21 40 9 52M53 42v10M48 47h10" />
      </svg>
    </form>
  </div>;
}
