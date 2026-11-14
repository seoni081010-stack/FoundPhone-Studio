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
      <svg className="younghoon-wish-doodle" viewBox="0 0 88 40" aria-hidden="true">
        <path className="wish-leaves" d="M44 9Q34 24 15 30M37 17Q19 4 11 15q9 8 26 2M31 23Q16 19 9 34q13 2 22-11M44 9Q58 8 67 18q-13 6-23-9"/>
        <path className="wish-bell" d="M44 10v9m-8 11q4-3 4-8a4 4 0 0 1 8 0q0 5 4 8zM42 33q2 4 4 0"/>
      </svg>
      <h2 id="younghoon-wish-title">愿此刻永恒</h2>
      {submitted ? <div className="wish-receipt">
        <p className="wish-floating-text" aria-hidden="true">{wish}</p>
        <p className="wish-blessing" role="status">
          <em className="wish-blessing-english" lang="en">The parchment has received your wish. May it stay with you always.</em>
          羊皮纸收到了你的愿望，希望它能伴你左右。
        </p>
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
