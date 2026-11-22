import { expect, test } from "vitest";
import { getJuyeonEndingLetter, displayJuyeonLetterParagraph } from "./juyeonLetterContent";
import { juyeonEndings } from "./juyeonStory";
import { endingLetterReadyMs } from "./JuyeonEndingLetter";

test.each(['together','friends','unspoken'] as const)('%s uses only its own exact authored letter and retains the following narration step',kind=>{
  const copy=getJuyeonEndingLetter(kind);
  const beat=juyeonEndings[kind].beats.find(b=>b.endingGate);
  if(beat?.kind!=='lines')throw Error('Missing authored ending');
  expect(copy.paragraphs).toEqual(beat.lines.slice(1,6).map(l=>l.body));
  expect(copy.paragraphs).toHaveLength(5);
  expect(copy.resumeLineIndex).toBe(6);
  expect(copy.afterReading).toBe(beat.lines[6].body);
  expect(beat.lines[6].speaker).toBeUndefined();
  expect(endingLetterReadyMs(copy.paragraphs.length)).toBe(16000);
});
test('the three letters are different complete letters without invented additions',()=>{
  const letters=(['together','friends','unspoken'] as const).map(kind=>getJuyeonEndingLetter(kind).paragraphs.join('\n'));
  expect(new Set(letters).size).toBe(3);
  expect(letters[0]).toContain('「有些话，我想了很久。」');
  expect(letters[1]).toContain('「跟你在一起的时候，总会发生一些原本没想到的事情。」');
  expect(letters[2]).toContain('「也希望以后还能常常见到你。」');
});

test('letter display removes only outer quotation marks without changing content or the manuscript',()=>{
  expect(displayJuyeonLetterParagraph('「我想说「谢谢」，{{playerName}}。」','星遥')).toBe('我想说「谢谢」，星遥。');
  expect(displayJuyeonLetterParagraph('新年快乐。','星遥')).toBe('新年快乐。');
  expect(getJuyeonEndingLetter('together').paragraphs[0]).toBe('「有些话，我想了很久。」');
});
