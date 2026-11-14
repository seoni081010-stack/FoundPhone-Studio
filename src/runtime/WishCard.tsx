import { useEffect, useState } from "react";
import "./WishCard.css";

export function WishCard({ onSubmit }: { onSubmit: () => void }) {
  const [wish, setWish] = useState("");
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (!submitted) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1500 : 3650;
    const timer = window.setTimeout(onSubmit, duration);
    return () => window.clearTimeout(timer);
  }, [submitted, onSubmit]);

  return <dialog className={`younghoon-wish ${submitted ? "wish-submitted" : ""}`} aria-labelledby="younghoon-wish-title"
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}>
    <form onSubmit={event => {
      event.preventDefault();
      if (wish.trim()) setSubmitted(true);
    }}>
      <span className="younghoon-wish-sparks" aria-hidden="true">✧ ✦ ✧</span>
      <svg className="younghoon-wish-doodle" viewBox="0 0 88 30" aria-hidden="true">
        <path d="M15 26C5 24 7 16 11 13c0 5 4 6 4 1 0-4 2-7 5-10-1 5 1 8 4 12 4 7-2 11-9 10ZM60 25l10-13 6 5-10 12zM73 13l4-7m0 0 5-2m-5 2-1-5m1 5 6 4" />
      </svg>
      <h2 id="younghoon-wish-title">愿此刻永恒</h2>
      {submitted ? <div className="wish-receipt">
        <p className="wish-floating-text" aria-hidden="true">{wish}</p>
        <p className="wish-blessing" role="status">羊皮纸收到了你的愿望<br />希望它能伴你左右</p>
      </div> : <>
        <textarea aria-label="写下你的愿望" placeholder="写下你的愿望" maxLength={500} value={wish}
          onChange={event => setWish(event.target.value)} />
        <button type="submit" disabled={!wish.trim()}>提交</button>
      </>}
    </form>
    {submitted && <><span className="wish-roll-edge" aria-hidden="true" />
      <span className="wish-trailing-stars" aria-hidden="true">✦ · ✧</span></>}
  </dialog>;
}
