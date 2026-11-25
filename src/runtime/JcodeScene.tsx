import { useCallback, useState, type ReactNode } from "react";
import { nextAlbumNotice } from "./albumNotices";
import { WishCard } from "./WishCard";
import { younghoonDays, younghoonEndings, younghoonStage } from "./younghoonStory";
import { SceneDialogue, sceneParts } from "./SceneDialogue";
import { QuidditchPaper } from "./QuidditchPaper";
import { spendGalleons } from "./MagicalShops";
import { jcodeDays, jcodeEndings, jcodeEndingFor, type JcodeEndingKind } from "./jcodeStory";

type Cursor = { position: number; accepted?: boolean };
export type Progress = { juyeonEndingLetter?: { kind: JcodeEndingKind; startedAt: number; done?: boolean }; juyeonGreeting?: { startedAt: number; done?: boolean }; juyeonStarChart?: { startedAt: number; done?: boolean }; truthParchmentUntil?: number; starWishUntil?: number; starWishEntry?: { draft: string; submitted?: string; foldUntil?: number; done?: boolean }; day: number; beat: number; option?: number; cursor: Cursor; clues: string[]; affinity: number; team?: string; attended?: Record<string, boolean>; time?: string; open: boolean; done?: boolean; ending?: JcodeEndingKind; wishSubmitted?: boolean; choiceHistory?: Record<string, number>; mailHistory?: { day: number; time: string; lines: { speaker?: string; body: string }[] }[]; wagerStake?: number; wagerClaimed?: boolean; mailBacklog?: Record<number, { beat: number; option?: number; cursor: Cursor }> };
const first = (day: number): Progress => ({ day, beat: 0, cursor: { position: 0 }, clues: [], affinity: 0, open: false });

export function useJcodeProgress(key: string, enabled: boolean, previewDay?: number, previewEnding?: JcodeEndingKind, younghoon = false, sunwoo = false, juyeon = false, eric = false) {
  const storageKey = `hogwarts-${eric ? "eric" : juyeon ? "juyeon" : sunwoo ? "sunwoo" : younghoon ? "younghoon" : "jcode"}-v1:${key}`;
  const [progress, setProgress] = useState<Progress>(() => {
    if (!enabled) return first(1);
    if (previewEnding) return { ...first(31), open: true, beat: younghoon || sunwoo || juyeon || eric ? 0 : jcodeDays[30].beats.length - 1, ending: previewEnding };
    if (previewDay) return { ...first(previewDay), open: true };
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) as Progress : first(1);
    } catch { return first(1); }
  });
  const update = useCallback((patch: Partial<Progress>) => {
    setProgress(previous => {
      const next = { ...previous, ...patch };
      try { if (!previewDay) localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* The current session can still continue. */ }
      return next;
    });
  }, [storageKey, previewDay]);
  return { progress, update };
}

type Props = {
  younghoon?: boolean;
  onMail?: () => void;
  onClue?: (id: string) => void;
  progress: Progress;
  update: (patch: Partial<Progress>) => void;
  identityKey: string;
  affinity: number;
  onFinish: () => void;
  note: (name: string, text: string, outgoing: boolean, key?: number) => ReactNode;
  player: string;
  highlight: (body: string) => ReactNode;
};

export function JcodeScene({ progress, update, identityKey, affinity, onFinish, note, player, highlight, younghoon, onMail, onClue }: Props) {
  const day = (younghoon ? younghoonDays : jcodeDays)[progress.day - 1];
  const beat = day.beats[progress.beat];
  const stage = day.beats.slice(0, progress.beat + 1).reverse().find(beat => beat.kind === "lines" && beat.schedule);
  const schedule = younghoon ? younghoonStage(progress.day, progress.beat, progress.cursor.position).schedule : stage?.kind === "lines" ? stage.schedule ?? day.schedule : day.schedule;
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
  if (beat?.kind === "mail") return <button className="hogwarts-activity" onClick={onMail}>打开猫头鹰信箱</button>;
  const clue = beat?.kind === "clue" ? nextAlbumNotice([beat.clue], [], false) : undefined;
  const ending = progress.ending ?? jcodeEndingFor(affinity);
  if (younghoon && beat?.kind === "ending" && !progress.ending) return <dialog
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}
    className="hogwarts-scene" aria-label="最终选择">
    <h2>最终选择</h2><div className="hogwarts-device-choices">
      {(["together", "friends", "unspoken"] as const).map(kind => <button key={kind}
        onClick={() => update({ ending: kind, cursor: { position: 0, accepted: true } })}>{younghoonEndings[kind].reply}</button>)}
    </div></dialog>;
  const lines = beat?.kind === "ending" ? (younghoon ? younghoonEndings : jcodeEndings)[ending].lines : beat?.kind === "lines" ? beat.lines
    : beat?.kind === "team" ? beat.options[progress.team === "斯莱特林" ? 1 : 0]
    : beat?.kind === "choice" && progress.option !== undefined
      ? beat.options[progress.option].lines : [];
  const dialogue = lines.map((line, index) => line.speaker
    ? note(line.speaker === "你" ? player : line.speaker, line.body, line.speaker === "你", index)
    : <p key={index} className="hogwarts-narration">{highlight(line.body)}</p>);
  if (younghoon && day.day === 21 && beat?.kind === "lines" && !progress.wishSubmitted &&
    sceneParts(dialogue).steps[progress.cursor.position]?.text.startsWith("你们分别写好卡片。")) {
    return <WishCard onSubmit={() => update({ wishSubmitted: true })} />;
  }
  return <dialog key={clue?.id ?? "story"} ref={node => { if (node && !node.open) node.showModal(); }}
    onCancel={event => event.preventDefault()} className={`hogwarts-scene${clue ? " hogwarts-clue" : ""}`} aria-labelledby="jcode-scene-title">
    <h2 id="jcode-scene-title">{clue ? "魔法相册解锁新内容" : younghoon ? <>金泳勋 <small>· YOUNGHOON</small></> : <>裴俊英 <small>· JACOB</small></>}</h2>
    {clue ? <>
      <p>在魔法相册中查看「{clue.title}」。</p>
      <button onClick={() => { onClue?.(clue.id); next({ clues: [...new Set([...progress.clues, clue.id])] }); }}>继续</button>
    </> : <>
      <p>{schedule}</p>
      {!beat ? <button className="hogwarts-continue-day" onClick={onFinish}>{day.day === 31 ? "查看结局" : "继续今天的行程"}</button>
        : beat.kind === "wager" ? <button onClick={() => setWagerOpen(true)}>打开竞猜纸条</button>
        : beat.kind === "choice" && progress.option === undefined ? <div className="hogwarts-device-choices">
          {beat.options.map((option, index) => <button key={index} onClick={() => update({
            option: index, cursor: { position: 0, accepted: true },
            affinity: progress.affinity + (option.affinity ?? 0),
          })}>{option.body}</button>)}
        </div> : <SceneDialogue key={progress.beat} checkpoint={progress.cursor}
          onCheckpoint={cursor => update(beat.kind === "ending" ? { cursor, ending } : { cursor })} onComplete={() => next(beat.kind === "ending" ? { ending } : {})}>
          {younghoon && beat.kind === "ending" && note(player, younghoonEndings[ending].reply, true, -2)}
          {beat.kind === "choice" && note(player, beat.options[progress.option!].body, true, -1)}
          {dialogue}
          <button onClick={() => next()}>继续</button>
        </SceneDialogue>}
    </>}
  </dialog>;
}
