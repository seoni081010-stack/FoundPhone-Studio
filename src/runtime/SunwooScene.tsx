import { EricChristmasCard, ericChristmasLeadIn } from "./EricChristmasCard";
import { EricBirthdayCard, ericBirthdayMoment } from "./EricBirthdayCard";
import { EricPaperStar, ERIC_STAR_DURATION, isEricPaperStarMoment, ericPaperStarLines } from "./EricPaperStar";
import { ericDay, ericVisibleLines } from "./ericStory";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StarWishPaper, starWishMoment, STAR_WISH_DURATION } from "./StarWishPaper";
import { WriteStarWish, WRITE_STAR_FOLD_DURATION } from "./WriteStarWish";
import { juyeonDay } from "./juyeonStory";
import { startJuyeonEndingLetter } from "./JuyeonEndingLetter";
import { getJuyeonEndingLetter } from "./juyeonLetterContent";
import { startJuyeonGreetingCard } from "./JuyeonGreetingCard";
import { JuyeonStarChart } from "./JuyeonStarChart";
import { TruthParchment } from "./TruthParchment";
import { SceneDialogue } from "./SceneDialogue";
import { QuidditchPaper, QuidditchResult } from "./QuidditchPaper";
import { spendGalleons } from "./MagicalShops";
import { nextAlbumNotice } from "./albumNotices";
import type { Progress } from "./JcodeScene";
import { sunwooDay, sunwooEndingFor, sunwooName, type SunwooLine } from "./sunwooStory";

type Props = {
  identity?: { house: string; year: number };
  route?: "sunwoo" | "juyeon" | "eric"; progress: Progress; update: (patch: Partial<Progress>) => void; identityKey: string;
  score: number; player: string; mailOpen: boolean; reviewing?: boolean; onMail: () => void; onFinish: () => void;
  onWagerResult: () => void; onClue: (id: string) => void; note: (name: string, body: string, outgoing: boolean, key?: number) => ReactNode;
  highlight: (body: string) => ReactNode;
};
export function SunwooScene({route = "sunwoo", progress, update, identityKey, score, player, mailOpen, onMail, onFinish, onClue, note, highlight, onWagerResult, reviewing}: Props) {
  const ending = progress.ending ?? sunwooEndingFor(score);
  const story = route === "eric" ? ericDay(progress.day, ending) : route === "juyeon" ? juyeonDay(progress.day, ending) : sunwooDay(progress.day, ending);
  const sceneId = `${route}-scene-title`;
  const beat = story.beats[progress.beat];
  const [team, setTeam] = useState("");
  const [stake, setStake] = useState(1);
  const [error, setError] = useState("");
  const [paper, setPaper] = useState(true);
  const endingGate = progress.day === 31 && (route !== "sunwoo" ? beat && "endingGate" in beat && beat.endingGate : beat?.time === "00:05");
  useEffect(() => {
    if (endingGate && !progress.ending) update({ ending });
  }, [endingGate, progress.ending, ending, update]);
  const lines: SunwooLine[] = beat?.kind === "lines" ? beat.lines
    : beat?.kind === "choice" && progress.option !== undefined ? beat.options[progress.option].lines
    : beat?.kind === "team" ? beat.options[progress.team === "斯莱特林" ? 1 : 0] : [];
  const christmasLeadIn = route === "eric" && progress.day === 24 ? ericChristmasLeadIn(lines) : undefined;
  const christmasOpen = christmasLeadIn && progress.ericChristmasCard && !progress.ericChristmasCard.done;
  const birthday = route === "eric" && progress.day === 22 ? ericBirthdayMoment(lines) : undefined;
  const birthdayEntry = progress.ericBirthdayCard;
  const birthdayOpen = birthday && progress.cursor.position === birthday.position && birthdayEntry?.opened && !birthdayEntry.done;
  const ericStarBeat = route === "eric" && progress.day === 8 && isEricPaperStarMoment(lines);
  const ericStarOpen = ericStarBeat && progress.cursor.position === 0 && !progress.ericPaperStar?.done;
  const ericStarStart = progress.ericPaperStar?.startedAt;
  useEffect(() => {
    if (ericStarOpen && !ericStarStart) update({ ericPaperStar: { startedAt: Date.now() } });
  }, [ericStarOpen, ericStarStart, update]);
  useEffect(() => {
    if (!ericStarOpen || !ericStarStart) return;
    const timer = window.setTimeout(() => update({ ericPaperStar: { startedAt: ericStarStart, done: true }, cursor: { position: 1 } }),
      Math.max(0, ericStarStart + ERIC_STAR_DURATION - Date.now()));
    return () => window.clearTimeout(timer);
  }, [ericStarOpen, ericStarStart, update]);
  // Keep the existing narration block and cursor numbering, so older saves still resume correctly.
  const truthMoment = route === "sunwoo" && progress.day === 5 && progress.cursor.position === 0
    && lines[0]?.body === "金善旴将羊皮纸转过来。";
  const truthUntil = truthMoment ? progress.truthParchmentUntil : undefined;
  useEffect(() => {
    if (route === "sunwoo" && progress.day === 5) {
      void document.fonts.load('italic 24px "Parchment Chinese"', "请勿直接接触墨迹。");
      void document.fonts.load('24px "Parchment English"', "Do not touch the ink directly.");
      const image = new Image();
      image.src = `${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`;
    }
  }, [progress.day, route]);
  useEffect(() => {
    if (truthMoment && truthUntil === undefined) update({ truthParchmentUntil: Date.now() + 2500 });
  }, [truthMoment, truthUntil, update]);
  useEffect(() => {
    if (!truthMoment || !truthUntil) return;
    const timer = window.setTimeout(() => update({ truthParchmentUntil: 0, cursor: { position: 1 } }), Math.max(0, truthUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [truthMoment, truthUntil, update]);
  const wish = route === "sunwoo" && progress.day === 19 && beat?.kind === "lines" ? starWishMoment(lines) : undefined;
  const wishMoment = wish !== undefined && progress.cursor.position === wish.position;
  const wishUntil = wishMoment ? progress.starWishUntil : undefined;
  useEffect(() => {
    if (wishMoment && wishUntil === undefined) update({ starWishUntil: Date.now() + STAR_WISH_DURATION });
  }, [wishMoment, wishUntil, update]);
  useEffect(() => {
    if (!wishMoment || !wishUntil || !wish) return;
    const timer = window.setTimeout(() => update({ starWishUntil: 0, cursor: { position: wish.position + 1 } }), Math.max(0, wishUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [wishMoment, wishUntil, wish, update]);
  const writeWish = route === "sunwoo" && progress.day === 19 && progress.cursor.position === 0
    && lines[0]?.body.startsWith("你们各自写完纸条。") && !progress.starWishEntry?.done;
  const entry = progress.starWishEntry;
  useEffect(() => {
    if (!writeWish || !entry?.foldUntil) return;
    const timer = window.setTimeout(() => update({ starWishEntry: { ...entry, done: true } }), Math.max(0, entry.foldUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [writeWish, entry, update]);
  useEffect(() => {
    if (route === "juyeon" && progress.day === 14) {
      const image = new Image(); image.src = `${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`;
    }
  }, [route, progress.day]);
  const chartTrigger = route === "juyeon" && progress.day === 14 && progress.cursor.position === 0
    && lines[0]?.body.includes("李柱延将一张羊皮纸铺在石桌上。");
  const chartOpen = chartTrigger && !progress.juyeonStarChart?.done;
  useEffect(() => {
    if (chartOpen && !progress.juyeonStarChart) update({ juyeonStarChart: { startedAt: Date.now() } });
  }, [chartOpen, progress.juyeonStarChart, update]);
  const greetingHost = useRef<HTMLDivElement>(null);
  // These four narration paragraphs are the existing step 7; keep all saved positions intact.
  const greetingTrigger = route === "juyeon" && progress.day === 25 && progress.cursor.position === 7
    && lines.some(line => line.body.startsWith("你打开礼物盒，在柔软的衬布下面找到折好的小卡片。"));
  const greetingOpen = greetingTrigger && !progress.juyeonGreeting?.done;
  useEffect(() => {
    if (route === "juyeon" && progress.day === 25) {
      void document.fonts.load('italic 25px "Greeting Chinese"');
      void document.fonts.load('25px "Greeting Latin"');
    }
  }, [route, progress.day]);
  useEffect(() => {
    if (greetingOpen && !progress.juyeonGreeting) update({ juyeonGreeting: { startedAt: Date.now() } });
  }, [greetingOpen, progress.juyeonGreeting, update]);
  const greetingStart = progress.juyeonGreeting?.startedAt;
  const greetingAcknowledge = useRef(() => {});
  greetingAcknowledge.current = () => {
    if (progress.juyeonGreeting && !progress.juyeonGreeting.done) update({ juyeonGreeting: { ...progress.juyeonGreeting, done: true } });
  };
  useEffect(() => {
    if (!greetingOpen || !greetingStart || !greetingHost.current) return;
    const card = startJuyeonGreetingCard({ container: greetingHost.current, playerName: player, startedAt: greetingStart,
      onContinueRequest: () => greetingAcknowledge.current() });
    return () => card.hide();
  }, [greetingOpen, greetingStart, player]);
  const letterHost = useRef<HTMLDivElement>(null);
  const letterBeat = route === "juyeon" && progress.day === 31 && beat && "endingGate" in beat && beat.endingGate;
  const letterOpen = letterBeat && progress.cursor.position === 0
    && !(progress.juyeonEndingLetter?.kind === ending && progress.juyeonEndingLetter.done);
  useEffect(() => {
    if (route === "juyeon" && progress.day === 31) {
      void document.fonts.load('italic 25px "Greeting Chinese"');
      void document.fonts.load('25px "Greeting Latin"');
      const image = new Image(); image.src = `${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`;
    }
  }, [route, progress.day]);
  useEffect(() => {
    if (letterOpen && progress.juyeonEndingLetter?.kind !== ending) update({ juyeonEndingLetter: { kind: ending, startedAt: Date.now() } });
  }, [letterOpen, progress.juyeonEndingLetter, ending, update]);
  const letterStart = progress.juyeonEndingLetter?.startedAt;
  const letterAcknowledge = useRef(() => {});
  letterAcknowledge.current = () => {
    if (progress.juyeonEndingLetter?.kind === ending && !progress.juyeonEndingLetter.done)
      update({ juyeonEndingLetter: { ...progress.juyeonEndingLetter, done: true } });
  };
  useEffect(() => {
    if (!letterOpen || !letterStart || !letterHost.current) return;
    const letter = startJuyeonEndingLetter({ container: letterHost.current, playerName: player, kind: ending, startedAt: letterStart,
      onContinueRequest: () => letterAcknowledge.current() });
    return () => letter.hide();
  }, [letterOpen, letterStart, player, ending]);
  // The printed paragraphs were just read in the overlay. Their following narration
  // remains the same existing step 0, preserving every saved dialogue position.
  const eligibleLines = route === "eric" ? ericVisibleLines(ericStarBeat ? ericPaperStarLines(lines) : lines, progress.choiceHistory) : lines;
  const birthdayLines = birthday ? birthdayEntry?.done ? birthday.after : birthday.leadIn : eligibleLines;
  const displayedLines = letterBeat && progress.juyeonEndingLetter?.kind === ending && progress.juyeonEndingLetter.done
    ? lines.slice(getJuyeonEndingLetter(ending).resumeLineIndex) : christmasLeadIn ?? birthdayLines;
  const next = (patch: Partial<Progress> = {}) => {
    const mailLines = beat?.channel === "mail" ? [
      ...(beat.kind === "choice" && progress.option !== undefined ? [{ speaker: "你", body: beat.options[progress.option].body }] : []),
      ...lines,
    ] : [];
    update({ beat: progress.beat + 1, option: undefined, cursor: { position: 0 },
      ...(mailLines.length ? { mailHistory: [...(progress.mailHistory ?? []), { day: story.day, time: beat.time, lines: mailLines }] } : {}), ...patch });
  };
  const completeLines = () => {
    if (christmasLeadIn && !progress.ericChristmasCard?.done) update({ ericChristmasCard: { startedAt: Date.now() } });
    else next();
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
    <h2 id={sceneId}>{clue ? "魔法相册解锁新内容" : route === "eric" ? <>孙英宰 <small>· Eric Sohn</small></> : route === "juyeon" ? <>李柱延 <small>· JUYEON</small></> : <>金善旴 <small>· SUNWOO</small></>}</h2>
    {clue ? <>
      <p>在魔法相册中查看「{clue.title}」。</p>
      <button onClick={() => { onClue(clue.id); next({ clues: [...new Set([...progress.clues, clue.id])] }); }}>继续</button>
    </> : <>
      <p>{`12月${story.day}日 · ${beat?.time ?? story.beats.at(-1)?.time ?? story.time} · ${beat?.channel === "mail" ? "猫头鹰信箱" : beat?.place ?? story.place}`}</p>
      {!beat ? <button className="hogwarts-continue-day" onClick={onFinish}>{reviewing ? "返回信箱" : story.day === 31 ? "查看结局" : "继续今天的行程"}</button>
        : beat.kind === "wager" ? <button onClick={() => setPaper(true)}>打开竞猜纸条</button>
        : beat.kind === "choice" && progress.option === undefined ? <div className="hogwarts-device-choices">
          {beat.options.map((option,index) => <button key={index} onClick={() => update({ option:index,
            affinity: progress.affinity + (progress.choiceHistory?.[`${story.day}:${progress.beat}`] === undefined ? option.affinity ?? 0 : 0), cursor:{position:0,accepted:true},
            choiceHistory: { ...progress.choiceHistory, [`${story.day}:${progress.beat}`]: index },
          })}>{sunwooName(option.body,player)}</button>)}
        </div> : writeWish ? null : christmasOpen ? <p className="hogwarts-narration">你轻轻拆开信封。<br />卡片里面是他熟悉的字迹。</p> : birthdayOpen ? <div>{birthday.before.map((line,index) => <p key={index} className="hogwarts-narration">{highlight(sunwooName(line.body,player))}</p>)}</div> : ericStarOpen ? <p className="hogwarts-narration">你也完成了自己的第一颗星星。</p> : letterOpen ? <p className="hogwarts-narration">{lines[0]?.body}</p> : greetingOpen ? <p className="hogwarts-narration">{highlight("你打开礼物盒，在柔软的衬布下面找到折好的小卡片。")}</p> : chartOpen ? <p className="hogwarts-narration">{highlight(sunwooName(lines[0].body.split("李柱延将一张羊皮纸铺在石桌上。")[0] + "李柱延将一张羊皮纸铺在石桌上。", player))}</p> : <SceneDialogue key={progress.beat} instantNarration checkpoint={progress.cursor} onCheckpoint={cursor => {
          if (birthday && !birthdayEntry?.done && progress.cursor.position === birthday.position && cursor.position === birthday.position + 1) {
            update({ ericBirthdayCard: { draft: "", ...birthdayEntry, opened: true } });
          } else update({cursor});
        }} onComplete={completeLines}>
          {beat.kind === "choice" && note(player,sunwooName(beat.options[progress.option!].body,player),true,-1)}
          {displayedLines.map((line,index) => line.speaker ? note(line.speaker === "你" ? player : line.speaker,sunwooName(line.body,player),line.speaker === "你",index)
            : <p className="hogwarts-narration" key={index}>{highlight(sunwooName(line.body,player))}</p>)}
          <button onClick={completeLines}>继续</button>
        </SceneDialogue>}
    </>}
  </>;
  const hostedContent = <>{content}<div ref={greetingHost} /><div ref={letterHost} /></>;
  const scene = (beat?.channel === "mail" || reviewing) && mailOpen && !clue ? <section className={route === "juyeon" ? "sunwoo-mail-scene juyeon-mail-scene" : route === "eric" ? "sunwoo-mail-scene eric-mail-scene" : "sunwoo-mail-scene"} aria-labelledby={sceneId}>{hostedContent}</section>
    : <dialog ref={node => { if(node && !node.open) node.showModal(); }} onCancel={event=>event.preventDefault()}
      className={`hogwarts-scene${clue ? " hogwarts-clue" : ""}`} aria-labelledby={sceneId}>{hostedContent}</dialog>;
  return <>{scene}{christmasOpen && progress.ericChristmasCard && <EricChristmasCard player={player} startedAt={progress.ericChristmasCard.startedAt}
    onContinue={() => next({ ericChristmasCard: { ...progress.ericChristmasCard!, done: true } })} />}{birthdayOpen && <EricBirthdayCard entry={birthdayEntry ?? { draft: "" }}
    onDraft={draft => { if (birthdayEntry?.submitted === undefined) update({ ericBirthdayCard: { ...birthdayEntry, draft } }); }}
    onSubmit={() => { if (birthdayEntry?.submitted === undefined && birthdayEntry?.draft.trim()) update({ ericBirthdayCard: { ...birthdayEntry, submitted: birthdayEntry.draft } }); }}
    onContinue={() => { if (birthdayEntry?.submitted !== undefined) update({ ericBirthdayCard: { ...birthdayEntry, done: true } }); }} />}{ericStarOpen && ericStarStart && <EricPaperStar startedAt={ericStarStart} />}{chartOpen && progress.juyeonStarChart && <JuyeonStarChart startedAt={progress.juyeonStarChart.startedAt}
    onContinue={() => update({ juyeonStarChart: { ...progress.juyeonStarChart!, done: true } })} />}{truthMoment && truthUntil !== 0 && <TruthParchment until={truthUntil} />}{writeWish && <WriteStarWish draft={entry?.draft ?? ""} submitted={entry?.submitted} foldUntil={entry?.foldUntil}
    onDraft={draft => update({ starWishEntry: { draft } })}
    onSubmit={() => { const submitted = entry?.draft.trim(); if (submitted && !entry?.submitted) update({ starWishEntry: { draft: submitted, submitted, foldUntil: Date.now() + WRITE_STAR_FOLD_DURATION } }); }} />}{wishMoment && wishUntil !== 0 && <StarWishPaper until={wishUntil} text={wish.text} />}</>;
}
