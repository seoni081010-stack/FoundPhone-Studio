import { useEffect, useState, type ReactNode } from "react";
import { TruthParchment } from "./TruthParchment";
import { SceneDialogue } from "./SceneDialogue";
import { QuidditchPaper, QuidditchResult } from "./QuidditchPaper";
import { spendGalleons } from "./MagicalShops";
import { nextAlbumNotice } from "./albumNotices";
import type { Progress } from "./JcodeScene";
import { sunwooDay, sunwooEndingFor, sunwooName, type SunwooLine } from "./sunwooStory";

type Props = {
  progress: Progress; update: (patch: Partial<Progress>) => void; identityKey: string;
  score: number; player: string; mailOpen: boolean; reviewing?: boolean; onMail: () => void; onFinish: () => void;
  onWagerResult: () => void; onClue: (id: string) => void; note: (name: string, body: string, outgoing: boolean, key?: number) => ReactNode;
  highlight: (body: string) => ReactNode;
};
export function SunwooScene({progress, update, identityKey, score, player, mailOpen, onMail, onFinish, onClue, note, highlight, onWagerResult, reviewing}: Props) {
  const ending = progress.ending ?? sunwooEndingFor(score);
  const story = sunwooDay(progress.day, ending);
  const beat = story.beats[progress.beat];
  const [team, setTeam] = useState("");
  const [stake, setStake] = useState(1);
  const [error, setError] = useState("");
  const [paper, setPaper] = useState(true);
  const endingGate = progress.day === 31 && beat?.time === "00:05";
  useEffect(() => {
    if (endingGate && !progress.ending) update({ ending });
  }, [endingGate, progress.ending, ending, update]);
  const lines: SunwooLine[] = beat?.kind === "lines" ? beat.lines
    : beat?.kind === "choice" && progress.option !== undefined ? beat.options[progress.option].lines
    : beat?.kind === "team" ? beat.options[progress.team === "斯莱特林" ? 1 : 0] : [];
  // Keep the existing narration block and cursor numbering, so older saves still resume correctly.
  const truthMoment = progress.day === 5 && progress.cursor.position === 0
    && lines[0]?.body === "金善旴将羊皮纸转过来。";
  const truthUntil = truthMoment ? progress.truthParchmentUntil : undefined;
  useEffect(() => {
    if (progress.day === 5) {
      const image = new Image();
      image.src = `${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`;
    }
  }, [progress.day]);
  useEffect(() => {
    if (truthMoment && truthUntil === undefined) update({ truthParchmentUntil: Date.now() + 2500 });
  }, [truthMoment, truthUntil, update]);
  useEffect(() => {
    if (!truthMoment || !truthUntil) return;
    const timer = window.setTimeout(() => update({ truthParchmentUntil: 0, cursor: { position: 1 } }), Math.max(0, truthUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [truthMoment, truthUntil, update]);
  const next = (patch: Partial<Progress> = {}) => {
    const mailLines = beat?.channel === "mail" ? [
      ...(beat.kind === "choice" && progress.option !== undefined ? [{ speaker: "你", body: beat.options[progress.option].body }] : []),
      ...lines,
    ] : [];
    update({ beat: progress.beat + 1, option: undefined, cursor: { position: 0 },
      ...(mailLines.length ? { mailHistory: [...(progress.mailHistory ?? []), { day: story.day, time: beat.time, lines: mailLines }] } : {}), ...patch });
  };
  if ((beat?.channel === "mail" || reviewing) && !mailOpen) return <button className="hogwarts-activity" onClick={onMail}>打开猫头鹰信箱</button>;
  if (beat?.kind === "wager" && paper) return <QuidditchPaper team={team} stake={stake} error={error} onTeam={setTeam} onStake={setStake}
    onReturn={() => setPaper(false)} onSubmit={() => {
      if (!spendGalleons(identityKey, stake)) { setError("钱包里的加隆不够。"); return; }
      next({ team, wagerStake: stake });
    }} />;
  if (beat?.kind === "wager-result") return <QuidditchResult won={progress.team === "斯莱特林"} stake={progress.wagerStake ?? 1} onContinue={() => { onWagerResult(); next(); }} />;
  const clue = beat?.kind === "clue" ? nextAlbumNotice([beat.clue], [], false) : undefined;
  const content = <>
    <h2 id="sunwoo-scene-title">{clue ? "魔法相册解锁新内容" : <>金善旴 <small>· SUNWOO</small></>}</h2>
    {clue ? <>
      <p>在魔法相册中查看「{clue.title}」。</p>
      <button onClick={() => { onClue(clue.id); next({ clues: [...new Set([...progress.clues, clue.id])] }); }}>继续</button>
    </> : <>
      <p>{`12月${story.day}日 · ${beat?.time ?? story.beats.at(-1)?.time ?? story.time} · ${beat?.channel === "mail" ? "猫头鹰信箱" : beat?.place ?? story.place}`}</p>
      {!beat ? <button className="hogwarts-continue-day" onClick={onFinish}>{reviewing ? "返回信箱" : story.day === 31 ? "查看结局" : "继续今天的行程"}</button>
        : beat.kind === "wager" ? <button onClick={() => setPaper(true)}>打开竞猜纸条</button>
        : beat.kind === "choice" && progress.option === undefined ? <div className="hogwarts-device-choices">
          {beat.options.map((option,index) => <button key={index} onClick={() => update({ option:index,
            affinity: progress.affinity + (option.affinity ?? 0), cursor:{position:0,accepted:true},
            choiceHistory: { ...progress.choiceHistory, [`${story.day}:${progress.beat}`]: index },
          })}>{sunwooName(option.body,player)}</button>)}
        </div> : <SceneDialogue key={progress.beat} instantNarration checkpoint={progress.cursor} onCheckpoint={cursor => update({cursor})} onComplete={() => next()}>
          {beat.kind === "choice" && note(player,sunwooName(beat.options[progress.option!].body,player),true,-1)}
          {lines.map((line,index) => line.speaker ? note(line.speaker === "你" ? player : line.speaker,sunwooName(line.body,player),line.speaker === "你",index)
            : <p className="hogwarts-narration" key={index}>{highlight(sunwooName(line.body,player))}</p>)}
          <button onClick={() => next()}>继续</button>
        </SceneDialogue>}
    </>}
  </>;
  const scene = (beat?.channel === "mail" || reviewing) && mailOpen ? <section className="sunwoo-mail-scene" aria-labelledby="sunwoo-scene-title">{content}</section>
    : <dialog ref={node => { if(node && !node.open) node.showModal(); }} onCancel={event=>event.preventDefault()}
      className={`hogwarts-scene${clue ? " hogwarts-clue" : ""}`} aria-labelledby="sunwoo-scene-title">{content}</dialog>;
  return <>{scene}{truthMoment && truthUntil !== 0 && <TruthParchment until={truthUntil} />}</>;
}
