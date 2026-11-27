import { JacobGingerbreadPhoto } from "./JacobGingerbreadPhoto";
import { JacobChristmasChecklist, jacobChecklist21Anchor, jacobChecklistAnchor, jacobChecklistStep } from "./JacobChristmasChecklist";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SceneDialogue } from "./SceneDialogue";
import { QuidditchPaper } from "./QuidditchPaper";
import { spendGalleons } from "./MagicalShops";
import { jacobExpandedDay, jacobEndingFor, jacobCondition, jacobNextBeat, jacobScore, jacobText, type JacobDay, type JacobProgress } from "./jcodeExpandedStory";
import type { Progress } from "./JcodeScene";
import "./JacobExpandedScene.css";
type Props = { progress: Progress; update: (patch: Partial<Progress>) => void; identityKey: string; score: number; player: string; mailOpen: boolean; reviewing?: boolean; onMail: () => void; onFinish: () => void; onClue: (id: string) => void; note: (name: string, body: string, outgoing: boolean, key?: number) => ReactNode; highlight: (body: string) => ReactNode };
export function JacobExpandedScene({ progress: base, update: baseUpdate, identityKey, score, player, mailOpen, reviewing, onMail, onFinish, onClue, note, highlight }: Props) {
  const p = base as JacobProgress, update = baseUpdate as (patch: Partial<JacobProgress>) => void;
  const kind = p.ending ?? jacobEndingFor(score), story = jacobExpandedDay(p.day, kind) as unknown as JacobDay;
  const index = jacobNextBeat(story, p.beat, p), beat = story.beats[index];
  const [team, setTeam] = useState(""); const [stake, setStake] = useState(1);const [error, setError] = useState("");const [paper, setPaper] = useState(true);const paid = useRef(false);
  useEffect(() => { if (p.beat !== index) update({ beat: index, option: undefined, cursor: { position: 0 } }); }, [p.beat, index, update]);
  const text = (body: string) => jacobText(body, p, player);
  const lines = (beat?.kind === "choice" && p.option !== undefined ? beat.options![p.option].lines : beat?.lines ?? []).filter(line => !line.when || line.when.every(c => jacobCondition(c, p)));
  const gingerbreadPhoto = p.day === 21 && beat?.kind === "choice" && p.option !== undefined && beat.options!.some(option => option.lines.some(line => line.speaker === "裴俊英" && line.body === "现在完成了。"));
  const checklistDay = p.day === 21 ? 21 : 16;
  const checklistAnchor = p.day === 21 ? jacobChecklist21Anchor : jacobChecklistAnchor;
  const checklistRead = p.day === 21 ? p.jacobChecklist21Read : p.jacobChecklistRead;
  const checklistStartedAt = p.day === 21 ? p.jacobChecklist21StartedAt : p.jacobChecklistStartedAt;
  const checklistPosition = [16, 21].includes(p.day) && beat?.kind === "lines" ? jacobChecklistStep(lines, checklistAnchor) : -1;
  const next = (patch: Partial<JacobProgress> = {}) => {
    const mail = beat?.channel === "mail" ? [...(beat.kind === "choice" && p.option !== undefined ? [{ speaker: "你", body: text(beat.options![p.option].body) }] : []), ...lines.map(l => ({ ...l, body: text(l.body) }))] : [];
    update({ beat: index + 1, option: undefined, cursor: { position: 0 }, ...(mail.length ? { mailHistory: [...(p.mailHistory ?? []), { day: p.day, time: beat.time, lines: mail }] } : {}), ...patch });
  };
  if (p.beat !== index) return null;
  if (gingerbreadPhoto && p.jacobGingerbreadPhotoOpen) return <JacobGingerbreadPhoto onContinue={() => next({ jacobGingerbreadPhotoOpen: false, jacobGingerbreadPhotoRead: true })} />;
  if (beat?.channel === "mail" && !mailOpen) return <button className="hogwarts-activity" onClick={onMail}>打开猫头鹰信箱</button>;
  if (beat?.kind === "wager" && paper) return <QuidditchPaper team={team} stake={stake} error={error} onTeam={setTeam} onStake={setStake} onReturn={() => setPaper(false)} onSubmit={() => {
    if (paid.current) return;if (!spendGalleons(identityKey, stake)) { setError("钱包里的加隆不够。");return; }paid.current = true;next({ team, wagerStake: stake });
  }} />;
  const clue = beat?.kind === "clue" ? beat.clue : undefined;
  const card = (beat?.kind === "greeting-card" ? p.jacobCard : undefined) ?? { color: "奶油白", decoration: "星星", draft: "" };
  const displayTime = beat?.time === "24:00" ? "00:00" : beat?.time ?? story.time;
  const displayDate = beat?.time === "24:00" ? p.day === 31 ? "1月1日" : `12月${p.day + 1}日` : `12月${p.day}日`;
  const content = <>
    <h2 id="jacob-expanded-title">{clue ? "魔法相册解锁新内容" : <>裴俊英 <small>· JACOB</small></>}</h2>
    {clue ? <><p>在魔法相册中查看「{clue.title}」。</p><button onClick={() => { onClue(clue.id);next({ clues: [...new Set([...p.clues, clue.id])] }); }}>继续</button></>
      : <><p>{`${displayDate} · ${displayTime} · ${beat?.place ?? story.place}`}</p>
      {!beat ? <button onClick={onFinish}>{reviewing ? "返回信箱" : p.day === 31 ? "查看结局" : "继续今天的行程"}</button>
        : beat.kind === "wager" ? <button onClick={() => setPaper(true)}>打开竞猜纸条</button>
        : beat.kind === "greeting-card" ? <form className="jacob-card-maker" data-paper={card.color} onSubmit={event => { event.preventDefault();if (card.draft.trim()) next({ jacobCard: { ...card, submitted: true } }); }}>
          <h3>制作圣诞贺卡</h3><span className="jacob-card-decoration" aria-hidden="true">{({ 星星: "✧", 雪花: "❄", 冬青叶: "❦", 驯鹿: "驯鹿" })[card.decoration]}</span><label>羊皮纸颜色<select aria-label="羊皮纸颜色" value={card.color} onChange={e => update({ jacobCard: { ...card, color: e.target.value } })}>{["奶油白", "浅蓝色", "浅绿色", "淡粉色"].map(c => <option key={c}>{c}</option>)}</select></label>
          <label>装饰图案<select aria-label="装饰图案" value={card.decoration} onChange={e => update({ jacobCard: { ...card, decoration: e.target.value } })}>{["星星", "雪花", "冬青叶", "驯鹿"].map(c => <option key={c}>{c}</option>)}</select></label>
          <textarea aria-label="贺卡内容" placeholder="写下你想说的话……" value={card.draft} onChange={e => update({ jacobCard: { ...card, draft: e.target.value } })} />
          <button type="submit" disabled={!card.draft.trim()}>收好贺卡，圣诞节再交换</button>
        </form>
        : beat.kind === "trading-cards" ? <div className="jacob-trading-cards">{["纽特·斯卡曼德", "忒修斯·斯卡曼德", "阿不思·邓布利多"].map(name => <button key={name} onClick={() => next({ jacobTradingCard: name })}><span className="jacob-card-image-slot" data-card={name} role="img" aria-label={`${name}巧克力蛙卡片`} /><span>{name}</span></button>)}</div>
        : beat.kind === "drink" ? <div className="hogwarts-device-choices">{["热巧克力", "热苹果汁", "肉桂牛奶"].map(name => <button key={name} onClick={() => next({ jacobFlags: { ...p.jacobFlags, ["drink-" + name]: true } })}>{name}</button>)}</div>
        : beat.kind === "choice" && p.option === undefined ? <div className="hogwarts-device-choices">{beat.options!.map((o, oi) => <button key={oi} onClick={() => {
          if (p.jacobChoices?.[beat.id] !== undefined) return;const raw = (p.jacobRawAffinity ?? 0) + o.rawAffinity;
          update({ option: oi, cursor: { position: 0, accepted: true }, jacobRawAffinity: raw, affinity: jacobScore(raw), jacobFlags: { ...p.jacobFlags, ...o.effects }, jacobChoices: { ...p.jacobChoices, [beat.id]: oi }, choiceHistory: { ...p.choiceHistory, [`${p.day}:${index}`]: oi } });
        }}>{text(o.body)}</button>)}</div>
        : <SceneDialogue key={`${p.day}:${index}`} instantNarration checkpoint={p.cursor} onCheckpoint={cursor => update({ cursor })} onComplete={() => { if (gingerbreadPhoto && !p.jacobGingerbreadPhotoRead) update({ jacobGingerbreadPhotoOpen: true });else next(); }}>
          {beat.kind === "choice" && note(player, text(beat.options![p.option!].body), true, -1)}
          {lines.map((l, i) => l.speaker ? note(l.speaker === "你" ? player : l.speaker, text(l.body), l.speaker === "你", i) : <p className="hogwarts-narration" key={i}>{highlight(text(l.body))}{l.body === checklistAnchor && checklistPosition >= 0 && p.cursor.position === checklistPosition && !checklistRead && <JacobChristmasChecklist day={checklistDay} startedAt={checklistStartedAt} onStart={time => update(p.day === 21 ? { jacobChecklist21StartedAt: time } : { jacobChecklistStartedAt: time })} onComplete={() => update({ ...(p.day === 21 ? { jacobChecklist21Read: true, jacobChecklist21StartedAt: undefined } : { jacobChecklistRead: true, jacobChecklistStartedAt: undefined }), cursor: { position: p.cursor.position + 1 } })} />}</p>)}
          <button onClick={() => next()}>继续</button>
        </SceneDialogue>}
      </>}
  </>;
  return beat?.channel === "mail" && mailOpen && !clue ? <section className="sunwoo-mail-scene" aria-labelledby="jacob-expanded-title">{content}</section>
    : <dialog ref={node => { if (node && !node.open) node.showModal(); }} onCancel={e => e.preventDefault()} className={`hogwarts-scene${clue ? " hogwarts-clue" : ""}`} aria-labelledby="jacob-expanded-title">{content}</dialog>;
}
