export type JcodeLine = { speaker?: string; body: string };
export type JcodeClue = { id: string; title: string; body: string; unlocked: true };
type Option = { body: string; affinity?: number; lines: JcodeLine[] };
export type JcodeBeat = { kind: "lines"; lines: JcodeLine[] }
  | { kind: "choice"; options: Option[] }
  | { kind: "wager" }
  | { kind: "team"; options: [JcodeLine[], JcodeLine[]] }
  | { kind: "clue"; clue: JcodeClue };

const sources = import.meta.glob("../../story-archive/jcode-day*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
const optionPattern = /^([AB])[.｜]「(.*)」(?:\s+心动 \+(\d+))?$/;
const mergePattern = /^(?:【共同剧情】|(?:——|### )两组选项后|——(?:竞猜|兑奖)后继续|### 玩家固定回答)/;
const structuralPattern = /^(?:【(?:旁白|面对面场景|玩家选项|共同剧情)】|玩家选项：|(?:### )?玩家选择[一二三]|选择[一二三]：|——两组选项后|### (?:两组选项后|剧情继续)|---$|（A\/B 两条分支汇合后）$)/;
const speakerPattern = /^(裴俊英|你|一年级学生|另一个学生|同学|学生|平斯夫人)[：:]\s*(.*)$/;
const tidy = (line: string) => line.replace(/^\*\*(.*)\*\*$/, "$1");
const unquote = (line: string) => line.replace(/^「(.*)」$/, "$1");
function parseLine(line: string): JcodeLine {
  const speech = line.match(speakerPattern);
  if (speech) return { speaker: speech[1], body: unquote(speech[2]) };
  if (/^(?:固定回答｜)?「.*」$/.test(line)) return { speaker: "你", body: unquote(line.replace(/^固定回答｜/, "")) };
  return { body: line.replace(/^> /, "") };
}

function parseBeats(lines: string[], day: number): JcodeBeat[] {
  const beats: JcodeBeat[] = [];
  let pending: JcodeLine[] = [];
  const flush = () => {
    if (pending.length) beats.push({ kind: "lines", lines: pending });
    pending = [];
  };
  const readLines = (start: number, end: number) =>
    lines.slice(start, end).filter(line => !structuralPattern.test(line)).map(parseLine);
  const find = (start: number, pattern: RegExp) => {
    const index = lines.findIndex((line, index) => index >= start && pattern.test(line));
    return index === -1 ? lines.length : index;
  };
  for (let i = 0; i < lines.length;) {
    const line = lines[i++];
    if (structuralPattern.test(line) || /^(?:【|### )玩家固定回答/.test(line)) continue;
    if (/^(?:【|### )魔法相册/.test(line)) {
      flush();
      const title = (line.match(/《(.+)》/) ?? lines[i++].match(/《(.+)》/))?.[1];
      if (!title) throw new Error(`Day ${day}: missing clue title`);
      const end = find(i, /^(?:【旁白】|### 剧情继续|---$)/);
      beats.push({ kind: "clue", clue: { id: `jcode-${day}`, title, body: lines.slice(i, end).map(line => line.replace(/^\*(.*)\*$/, "$1")).join("\n\n"), unlocked: true } });
      i = end;
      continue;
    }
    if (line.startsWith("——此处触发")) {
      flush();
      beats.push({ kind: "wager" });
      continue;
    }
    if (/^若(?:玩家选择格兰芬多|竞猜获胜)：$/.test(line)) {
      flush();
      const award = line.includes("获胜");
      const second = find(i, /^若(?:玩家选择斯莱特林|竞猜未中)：$/);
      const end = find(second + 1, /^——(?:竞猜|兑奖)后继续——$/);
      if (end === lines.length) throw new Error("Incomplete Quidditch branches");
      const a = readLines(i, second), b = readLines(second + 1, end);
      beats.push({ kind: "team", options: award ? [b, a] : [a, b] });
      i = end + 1;
      continue;
    }
    const a = line.match(optionPattern);
    if (a?.[1] === "A") {
      flush();
      const bIndex = find(i, /^B[.｜]「/);
      const b = lines[bIndex]?.match(optionPattern);
      if (!b) throw new Error(`Day ${day}: missing option B`);
      let branches: [JcodeLine[], JcodeLine[]];
      if (bIndex === i && !/^若选择 A：$/.test(lines[bIndex + 1])) {
        branches = [[], []];
        i = bIndex + 1;
      } else {
        const explicit = bIndex === i;
        const startB = explicit ? find(bIndex + 2, /^若选择 B：$/) : bIndex;
        const end = find(startB + 1, day === 3 ? /^【旁白】$/ : mergePattern);
        if (end === lines.length) throw new Error(`Day ${day}: missing branch merge`);
        branches = [readLines(explicit ? bIndex + 2 : i, startB), readLines(startB + 1, end)];
        i = end;
      }
      beats.push({ kind: "choice", options: [a, b].map((match, index) => ({
        body: match[2], affinity: match[3] ? Number(match[3]) : undefined, lines: branches[index],
      })) });
      continue;
    }
    pending.push(parseLine(line));
  }
  flush();
  return beats;
}

export const jcodeDays = Object.values(sources).flatMap(source =>
  source.split(/^## Day /m).slice(1).map(section => {
    const [heading, schedule, ...body] = section.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const [number, title] = heading.split("｜");
    const day = Number(number);
    const details = schedule.split(" · ");
    return { day, title, schedule, time: details.length === 3 ? details[1] : "14:00", place: details.at(-1)!, beats: parseBeats(body.map(tidy), day) };
  })).sort((a, b) => a.day - b.day);
