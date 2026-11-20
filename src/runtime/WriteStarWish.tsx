import { useRef } from "react";
import { FoldedPaperStar } from "./StarWishPaper";
import "./WriteStarWish.css";

export const WRITE_STAR_FOLD_DURATION = 2200;
export function WriteStarWish({ draft, submitted, foldUntil, onDraft, onSubmit }: {
  draft: string; submitted?: string; foldUntil?: number; onDraft: (value: string) => void; onSubmit: () => void;
}) {
  const elapsed = useRef(Math.max(0, WRITE_STAR_FOLD_DURATION - ((foldUntil ?? Date.now() + WRITE_STAR_FOLD_DURATION) - Date.now())));
  return <dialog className={`write-star-wish${submitted !== undefined ? " is-folding" : ""}`} aria-label="写下你的愿望"
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}>
    <div className="write-star-stage" style={{ animationDelay: `-${elapsed.current}ms` }}>
      <form className="write-star-strip" onSubmit={event => { event.preventDefault(); if (draft.trim() && submitted === undefined) onSubmit(); }}>
        <label htmlFor="star-wish-input">请写下你的愿望</label>
        {submitted === undefined ? <>
          <textarea id="star-wish-input" aria-label="你的愿望" rows={1} maxLength={120} value={draft}
            onChange={event => onDraft(event.target.value)} placeholder="……" autoComplete="off" />
          <button type="submit" disabled={!draft.trim()}>写好了</button>
        </> : <p className="write-star-submitted">{submitted}</p>}
      </form>
      {submitted !== undefined && <FoldedPaperStar cream className="write-star-folded" />}
    </div>
  </dialog>;
}
