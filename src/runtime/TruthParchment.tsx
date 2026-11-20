import { useRef } from "react";
import "./TruthParchment.css";

/** A timed illustration only; story progression and its persisted deadline live in SunwooScene. */
export function TruthParchment({ until }: { until?: number }) {
  const elapsed = useRef(Math.max(0, 2500 - ((until ?? Date.now() + 2500) - Date.now())));
  return <dialog className="truth-parchment" aria-label="不会说谎的羊皮纸"
    ref={node => { if (node && !node.open) node.showModal(); }}
    onCancel={event => event.preventDefault()}>
    <div className="truth-parchment-sheet">
      <img src={`${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`} alt="边缘磨损、微微褶皱的泛黄羊皮纸" />
      <div className="truth-parchment-ink" style={{ animationDelay: `-${elapsed.current}ms` }}>
        <p lang="zh-CN">请勿直接接触墨迹。</p>
        <p lang="en">Do not touch the ink directly.</p>
      </div>
    </div>
  </dialog>;
}
