import { useEffect, useRef, useState, type ReactNode } from "react";
import { SceneDialogue } from "./SceneDialogue";
import { QuidditchPaper, QuidditchResult } from "./QuidditchPaper";
import { spendGalleons } from "./MagicalShops";
import { dailyMenu } from "./HogwartsSchedule";
import { hyunjaeDay, hyunjaeEndingFor, hyunjaeNextBeat, hyunjaeText, type HyDay, type HyIdentity, type HyProgress } from "./hyunjaeExpandedStory";
import type { Progress } from "./JcodeScene";
import "./HyunjaeExpandedScene.css";

type Props = {
  progress: Progress; update: (patch: Partial<Progress>) => void; identityKey: string;
  score: number; player: string; identity: HyIdentity; mailOpen: boolean; reviewing?: boolean;
  onMail: () => void; onFinish: () => void; onClue: (id: string) => void; onWagerResult: () => void;
  note: (name: string, body: string, outgoing: boolean, key?: number) => ReactNode;
  highlight: (body: string) => ReactNode;
};
export function HyunjaeExpandedScene({ progress: base, update: baseUpdate, identityKey, score, player, identity, mailOpen, reviewing, onMail, onFinish, onClue, onWagerResult, note, highlight }: Props) {
  const p = base as HyProgress;
  const update = baseUpdate as (patch: Partial<HyProgress>) => void;
  const ending = p.ending ?? hyunjaeEndingFor(score);
  const story = hyunjaeDay(p.day, ending) as unknown as HyDay;
  const index = hyunjaeNextBeat(story, p.beat, p, identity);
  const beat = story.beats[index];
  const [team, setTeam] = useState("");
  const [stake, setStake] = useState(1);
  const [error, setError] = useState("");
  const [paper, setPaper] = useState(true);
  const submitted = useRef(false);
  useEffect(() => {
    if (index !== p.beat) update({ beat: index, option: undefined, cursor: { position: 0 } });
  }, [index, p.beat, update]);
  useEffect(() => {
    if (p.day === 19 && p.hyunjaeVoucherAt19 === undefined) update({ hyunjaeVoucherAt19: p.team === "斯莱特林" && !p.wagerClaimed });
  }, [p.day, p.hyunjaeVoucherAt19, p.team, p.wagerClaimed, update]);
  const text = (body: string) => hyunjaeText(body, p, player);
  const lines = (beat?.kind === "lines" ? beat.lines ?? [] : beat?.kind === "choice" && p.option !== undefined ? beat.options![p.option].lines : [])
    .map(line => ({ ...line, body: text(line.body) })).filter(line => line.body.length > 0 && !(p.day === 7 && line.body === "他一本正经地说完，自己先笑了。" && p.hyunjaeChoices?.["06:3A"] !== 0));
  const treePhoto = p.day === 17 && lines.some(line => line.body === "你收到了一张魔法照片。");
  const next = (patch: Partial<HyProgress> = {}) => {
    const mail = beat?.channel === "mail" ? [
      ...(beat.kind === "choice" && p.option !== undefined ? [{ speaker: "你", body: text(beat.options![p.option].body) }] : []), ...lines, ...(treePhoto ? [{ body: "照片｜圣诞树", photo: true }] : []),
    ] : [];
    update({ beat: index + 1, option: undefined, cursor: { position: 0 },
      ...(mail.length ? { mailHistory: [...(p.mailHistory ?? []), { day: p.day, time: beat.time, lines: mail }] } : {}),
      ...(p.day === 19 && beat?.when.includes("voucher-held") ? { wagerClaimed: true } : {}), ...patch });
  };
  if (index !== p.beat) return null;
  if (beat?.channel === "mail" && !mailOpen) return <button className="hogwarts-activity" onClick={onMail}>打开猫头鹰信箱</button>;
  if (beat?.kind === "wager" && paper) return <QuidditchPaper team={team} stake={stake} error={error} onTeam={setTeam} onStake={setStake}
    onReturn={() => setPaper(false)} onSubmit={() => {
      if (submitted.current) return;
      if (!spendGalleons(identityKey, stake)) { setError("钱包里的加隆不够。"); return; }
      submitted.current = true; next({ team, wagerStake: stake });
    }} />;
  if (beat?.kind === "wager-result") return <QuidditchResult won={p.team === "斯莱特林"} stake={p.wagerStake ?? 1} onContinue={() => { onWagerResult(); next(); }} />;
  const clue = beat?.kind === "clue" ? beat.clue : undefined;
  const wish = beat?.kind === "wish";
  const content = <>
    <h2 id="hyunjae-expanded-title">{clue ? "魔法相册解锁新内容" : wish ? "寄给冬天的愿望" : <>李贤在 <small>· HYUNJAE</small></>}</h2>
    {clue ? <><p>在魔法相册中查看「{clue.title}」。</p><button onClick={() => { onClue(clue.id); next({ clues: [...new Set([...p.clues, clue.id])] }); }}>继续</button></>
      : wish ? <form className="hyunjae-wish" onSubmit={event => { event.preventDefault(); if (p.hyunjaeWish?.draft.trim()) next({ hyunjaeWish: { draft: p.hyunjaeWish.draft, submitted: p.hyunjaeWish.draft, via: p.hyunjaeChoices?.["17:2"] === 0 ? "tree" : "message" } }); }}>
        <p lang="en">Make a wish</p><p>这是一个只属于你的秘密。</p>
        <textarea autoFocus aria-label="你的愿望" placeholder="写下你的愿望……" value={p.hyunjaeWish?.draft ?? ""} onChange={event => update({ hyunjaeWish: { draft: event.target.value } })} />
        <button disabled={!p.hyunjaeWish?.draft.trim()} type="submit">将愿望挂上圣诞树</button>
      </form> : <>
        <p>{`12月${story.day}日 · ${beat?.time ?? story.beats.at(-1)?.time ?? story.time} · ${beat?.channel === "mail" ? "猫头鹰信箱" : beat?.place ?? story.place}`}</p>
        {!beat ? <button className="hogwarts-continue-day" onClick={onFinish}>{reviewing ? "返回信箱" : p.day === 31 ? "查看结局" : "继续今天的行程"}</button>
          : beat.kind === "wager" ? <button onClick={() => setPaper(true)}>打开竞猜纸条</button>
          : beat.kind === "meal" ? <div className="hyunjae-meal"><p>{beat.meal === "breakfast" ? "早餐" : "午餐"}</p><p>{dailyMenu(p.day)[beat.meal === "breakfast" ? "breakfast" : "lunch"].filter(name => p.hyunjaeChoices?.["08:3"] !== 1 || !/煎|肉|辣/.test(name)).slice(0, 3).join(" · ")}</p><button onClick={() => next()}>继续</button></div>
          : beat.kind === "choice" && p.option === undefined ? <div className="hogwarts-device-choices">
            {beat.options!.map((option, optionIndex) => {
              if (beat.id === "31:final" && p.ending && (p.ending === "friends" ? optionIndex !== 2 : optionIndex === 2)) return null;
              return <button key={optionIndex} onClick={() => {
                if (p.hyunjaeChoices?.[beat.id!] !== undefined) return;
                const gain = option.affinity;
                const directFriend = beat.id === "31:final" && optionIndex === 2;
                update({ ...(directFriend ? { beat: index + 1 } : {}), option: directFriend ? undefined : optionIndex, cursor: { position: 0, accepted: true }, affinity: p.affinity + gain,
                  hyunjaeChoices: { ...p.hyunjaeChoices, [beat.id!]: optionIndex }, choiceHistory: { ...p.choiceHistory, [`${p.day}:${index}`]: optionIndex },
                  ...(beat.id === "31:final" ? { ending: p.ending ?? (optionIndex === 2 ? "friends" : hyunjaeEndingFor(score + gain)) } : {}) });
              }}>{text(option.body)}</button>;
            })}
          </div> : <SceneDialogue key={`${p.day}:${index}`} instantNarration checkpoint={p.cursor} onCheckpoint={cursor => update({ cursor })} onComplete={() => next()}>
            {beat.kind === "choice" && note(player, text(beat.options![p.option!].body), true, -1)}
            {lines.map((line, i) => line.speaker ? note(line.speaker === "你" ? player : line.speaker, line.body, line.speaker === "你", i) : <p className="hogwarts-narration" key={i}>
              {highlight(line.body)}
              {treePhoto && line.body === "你收到了一张魔法照片。" && <img src="./hyunjae-christmas-photo.svg" alt="会动的圣诞树照片" width={320} height={220} style={{ display: "block", maxWidth: "100%", height: "auto" }} />}
              {p.day === 29 && beat.id === "29:3A" && p.option === 1 && line.body === "你指向回廊的一侧。" && <span className="hyunjae-lamp" data-color={p.hyunjaeChoices?.["29:1"] === 0 ? "silver" : "blue"} role="img" aria-label={p.hyunjaeChoices?.["29:1"] === 0 ? "银白色的魔法灯" : "蓝色的魔法灯"}>✧</span>}
            </p>)}
            <button onClick={() => next()}>继续</button>
          </SceneDialogue>}
      </>}
  </>;
  return beat?.channel === "mail" && mailOpen && !clue && !wish ? <section className="sunwoo-mail-scene hyunjae-mail-scene" aria-labelledby="hyunjae-expanded-title">{content}</section>
    : <dialog ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}
      className={`hogwarts-scene${clue ? " hogwarts-clue" : ""}${wish ? " hyunjae-wish-dialog" : ""}`} aria-labelledby="hyunjae-expanded-title">{content}</dialog>;
}
