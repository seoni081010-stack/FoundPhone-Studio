import { useState, type ReactNode } from "react";
import { SceneDialogue } from "./SceneDialogue";
import { QuidditchPaper } from "./QuidditchPaper";
import { spendGalleons } from "./MagicalShops";
import { jcodeDays, jcodeEndings, jcodeEndingFor, type JcodeEndingKind } from "./jcodeStory";

type Cursor = { position: number; accepted?: boolean };
type Progress = { day: number; beat: number; option?: number; cursor: Cursor; clues: string[]; affinity: number; team?: string; attended?: Record<string, boolean>; time?: string; open: boolean; done?: boolean; ending?: JcodeEndingKind };
const first = (day: number): Progress => ({ day, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: false });

export function useJcodeProgress(key: string, enabled: boolean, previewDay?: number, previewEnding?: JcodeEndingKind) {
  const storageKey = `hogwarts-jcode-v1:${key}`;
  const [progress, setProgress] = useState<Progress>(() => {
    if (!enabled) return first(1);
    if (previewEnding) return { ...first(31), open: true, beat: jcodeDays[30].beats.length - 1, ending: previewEnding };
    if (previewDay) return { ...first(previewDay), open: true };
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) as Progress : first(1);
    } catch { return first(1); }
  });
  const update = (patch: Partial<Progress>) => {
    const next = { ...progress, ...patch };
    try { if (!previewDay) localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* The current session can still continue. */ }
    setProgress(next);
  };
  return { progress, update };
}

type Props = {
  progress: Progress;
  update: (patch: Partial<Progress>) => void;
  identityKey: string;
  affinity: number;
  onFinish: () => void;
  note: (name: string, text: string, outgoing: boolean, key?: number) => ReactNode;
  player: string;
  highlight: (body: string) => ReactNode;
};

export function JcodeScene({ progress, update, identityKey, affinity, onFinish, note, player, highlight }: Props) {
  const day = jcodeDays[progress.day - 1];
  const beat = day.beats[progress.beat];
  const [team, setTeam] = useState("");
  const [stake, setStake] = useState(1);
  const [error, setError] = useState("");
  const [wagerOpen, setWagerOpen] = useState(true);
  const next = (patch: Partial<Progress> = {}) => update({ beat: progress.beat + 1, option: undefined, cursor: { position: 0 }, ...patch });
  if (beat?.kind === "wager" && wagerOpen) return <QuidditchPaper team={team} stake={stake} error={error}
    onTeam={setTeam} onStake={setStake} onReturn={() => setWagerOpen(false)} onSubmit={() => {
      if (!spendGalleons(identityKey, stake)) { setError("钱包里的加隆不够。"); return; }
      next({ team });
    }} />;
  const clue = beat?.kind === "clue" ? beat.clue : undefined;
  const ending = progress.ending ?? jcodeEndingFor(affinity);
  const lines = beat?.kind === "ending" ? jcodeEndings[ending].lines : beat?.kind === "lines" ? beat.lines
    : beat?.kind === "team" ? beat.options[progress.team === "斯莱特林" ? 1 : 0]
    : beat?.kind === "choice" && progress.option !== undefined
      ? beat.options[progress.option].lines : [];
  return <dialog key={clue?.id ?? "story"} ref={node => { if (node && !node.open) node.showModal(); }}
    onCancel={event => event.preventDefault()} className={`hogwarts-scene${clue ? " hogwarts-clue" : ""}`} aria-labelledby="jcode-scene-title">
    <h2 id="jcode-scene-title">{clue ? "魔法相册解锁新内容" : <>裴俊英 <small>· JACOB</small></>}</h2>
    {clue ? <>
      <p>在魔法相册中查看「{clue.title}」。</p>
      <button onClick={() => next({ clues: [...new Set([...progress.clues, clue.id])] })}>继续</button>
    </> : <>
      <p>{day.schedule}</p>
      {!beat ? <button className="hogwarts-continue-day" onClick={onFinish}>{day.day === 31 ? "查看结局" : "继续今天的行程"}</button>
        : beat.kind === "wager" ? <button onClick={() => setWagerOpen(true)}>打开竞猜纸条</button>
        : beat.kind === "choice" && progress.option === undefined ? <div className="hogwarts-device-choices">
          {beat.options.map((option, index) => <button key={index} onClick={() => update({
            option: index, cursor: { position: 0, accepted: true },
            affinity: progress.affinity + (option.affinity ?? 0),
          })}>{option.body}</button>)}
        </div> : <SceneDialogue key={progress.beat} instantNarration checkpoint={progress.cursor}
          onCheckpoint={cursor => update(beat.kind === "ending" ? { cursor, ending } : { cursor })} onComplete={() => next(beat.kind === "ending" ? { ending } : {})}>
          {beat.kind === "choice" && note(player, beat.options[progress.option!].body, true, -1)}
          {lines.map((line, index) => line.speaker
            ? note(line.speaker === "你" ? player : line.speaker, line.body, line.speaker === "你", index)
            : <p key={index} className="hogwarts-narration">{highlight(line.body)}</p>)}
          <button onClick={() => next()}>继续</button>
        </SceneDialogue>}
    </>}
  </dialog>;
}
