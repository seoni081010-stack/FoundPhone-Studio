import { useId } from "react";
import type { JcodeLine } from "./jcodeStory";
import "./EricBirthdayCard.css";

export function ericBirthdayMoment(lines: JcodeLine[]) {
  const card = lines.findIndex(line => line.body === "那里夹着一张你亲手写下的生日贺卡。");
  const resume = lines.findIndex((line,index) => index > card && line.body === "他安静地看了很久，手指轻轻抚过贺卡上的字迹。");
  if (card < 0 || resume < 0) return undefined;
  let start = card;
  while (start > 0 && !lines[start - 1].speaker) start--;
  let position = -1, previousSpeech = true;
  for (const line of lines.slice(0,start + 1)) {
    if (line.speaker || previousSpeech) position++;
    previousSpeech = Boolean(line.speaker);
  }
  return { position, before: lines.slice(start,card + 1), leadIn: [...lines.slice(0,card + 1),...lines.slice(resume + 1)], after: [...lines.slice(0,start),...lines.slice(resume)] };
}
export type EricBirthdayEntry = { draft: string; opened?: boolean; submitted?: string; done?: boolean };
export function EricBirthdayCard({ entry, onDraft, onSubmit, onContinue }: {
  entry: EricBirthdayEntry; onDraft: (draft: string) => void; onSubmit: () => void; onContinue: () => void;
}) {
  const inputId = useId();
  const submitted = entry.submitted !== undefined;
  return <dialog className="eric-birthday-card" aria-label="写给 Eric Sohn 的生日贺卡"
    ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => event.preventDefault()}>
    <form className="eric-birthday-sheet" onSubmit={event => { event.preventDefault(); if (!submitted && entry.draft.trim()) onSubmit(); }}>
      <h2>To Eric Sohn</h2>
      {submitted ? <p className="eric-birthday-message">{entry.submitted}</p> : <textarea id={inputId} aria-label="生日祝福" rows={6}
        value={entry.draft} onChange={event => onDraft(event.target.value)} placeholder="在这里写下你的祝福……" />}
      <footer>{submitted ? <button key="continue" type="button" onClick={onContinue}>继续</button>
        : <button key="submit" type="submit" disabled={!entry.draft.trim()}>提交</button>}</footer>
    </form>
  </dialog>;
}
