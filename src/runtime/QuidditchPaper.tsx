import { sharedRules } from "./sharedRules";

// The paper deliberately accepts no story text, portraits or dialogue children.
export function QuidditchPaper({ team, stake, error, onTeam, onStake, onSubmit, onReturn }: {
  team: string; stake: number; error: string; onTeam: (team: string) => void;
  onStake: (stake: number) => void; onSubmit: () => void; onReturn: () => void;
}) {
  return <dialog ref={element => { if (element && !element.open) element.showModal(); }}
    onCancel={event => event.preventDefault()} className="hogwarts-scene hogwarts-wager" aria-labelledby="match-wager-title">
    <small className="wager-stamp">弗雷德 &amp; 乔治 · 看台特刊</small>
    <h2 id="match-wager-title">谁的扫帚先得意？</h2>
    <div className="wager-teams">{["格兰芬多", "斯莱特林"].map(name => <button key={name} data-team={name}
      aria-pressed={team === name} onClick={() => onTeam(name)}>{name}{team === name ? " ✓" : ""}</button>)}</div>
    <p><label>押 {stake} 加隆 <input type="range" min={sharedRules.wagerMin} max={sharedRules.wagerMax}
      value={stake} onChange={event => onStake(Number(event.target.value))} /></label></p>
    <p>1 加隆：意思一下 · 10 加隆：钱包尖叫</p>
    <p>{stake < 4 ? "很好，输了也只需要叹一口气。" : stake < 8 ? "现在你已经有理由比球员还紧张了。" : "我们欣赏你的勇气。你的钱包有不同意见。"}</p>
    <button className="wager-primary" disabled={!team} onClick={onSubmit}>就押这个</button>
    <button className="wager-secondary" onClick={onReturn}>收起纸条</button>
    {error && <p role="alert">{error}</p>}
  </dialog>;
}

export function QuidditchResult({ won, stake, onContinue }: { won: boolean; stake: number; onContinue: () => void }) {
  return <dialog ref={element => { if (element && !element.open) element.showModal(); }}
    onCancel={event => event.preventDefault()} className="hogwarts-scene hogwarts-wager" aria-labelledby="match-result-title">
    {won && <div className="wager-confetti" aria-hidden="true">✦ 🎉 ✧ 🍺 ✦</div>}
    <h2 id="match-result-title">{won ? "恭喜，你押中了！" : "别灰心！"}</h2>
    <p>{won ? `斯莱特林赢了。你押的 ${stake} 加隆已经光荣退役，但你赢得了一杯黄油啤酒。请到三把扫帚找斯莱特林那桌领取，趁他们还在高兴。` : `斯莱特林赢了。你押的 ${stake} 加隆和格兰芬多的比分一样，都回不来了。本纸条不提供饮料，但可以垫杯子。至少还有点用。`}</p>
    <button className={won ? "wager-primary wager-ticket" : "wager-secondary"} onClick={onContinue}>{won ? "收下饮料券" : "把纸条折起来"}</button>
  </dialog>;
}
