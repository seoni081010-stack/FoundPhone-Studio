import { juyeonEndings } from "./juyeonStory";
import type { JcodeEndingKind } from "./jcodeStory";

/** Read the selected ending's actual manuscript paragraphs; never synthesize letter copy. */
export function getJuyeonEndingLetter(kind: JcodeEndingKind) {
  const story = juyeonEndings[kind];
  const beat = story.beats.find(beat => beat.endingGate);
  if (!beat || beat.kind !== "lines") throw new Error("Missing Juyeon ending letter");
  const firstSpeech = beat.lines.findIndex(line => Boolean(line.speaker));
  const paragraphs: string[] = [];
  let resumeLineIndex = 0;
  beat.lines.slice(0, firstSpeech).forEach((line, index) => {
    if (line.body.startsWith("「") && line.body.endsWith("」")) { paragraphs.push(line.body); resumeLineIndex = index + 1; }
  });
  if (!paragraphs.length || resumeLineIndex >= firstSpeech) throw new Error("Missing letter reading transition");
  return { paragraphs, resumeLineIndex, afterReading: beat.lines[resumeLineIndex].body };
}
