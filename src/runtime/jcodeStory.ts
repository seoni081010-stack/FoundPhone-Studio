import { sharedRules } from "./sharedRules";

export type JcodeLine = { speaker?: string; body: string };
export type JcodeClue = { id: string; title: string; body: string; unlocked: true };
type Option = { body: string; affinity?: number; lines: JcodeLine[] };
export type JcodeBeat = { kind: "lines"; lines: JcodeLine[] }
  | { kind: "choice"; options: Option[] }
  | { kind: "wager" }
  | { kind: "team"; options: [JcodeLine[], JcodeLine[]] }
  | { kind: "clue"; clue: JcodeClue }
  | { kind: "ending" };

const sources = import.meta.glob("../../story-archive/jcode-day*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
const optionPattern = /^([AB])[.｜]「(.*)」(?:\s+心动 \+(\d+))?$/;
const mergePattern = /^(?:### 分支汇合|【共同剧情】|(?:——|### )两组选项后|——(?:竞猜|兑奖)后继续|### 玩家固定回答)/;
const structuralPattern = /^(?:### (?:分支汇合|选择[一二三]（A\/B）)|固定(?:回答|回复)[一二三四]$|本日伏笔：|> 本日|【(?:旁白|面对面场景|玩家选项|共同剧情)】|玩家选项：|(?:### )?玩家选择[一二三]|选择[一二三]：|——两组选项后|### (?:两组选项后|剧情继续)|---$|（A\/B 两条分支汇合后）$)/;
const speakerPattern = /^(裴俊英|你|一年级学生|另一个学生|同学|学生|平斯夫人|家养小精灵)[：:]\s*(.*)$/;
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
    if (line === "魔法相册·线索更新") {
      flush();
      const title = lines[i++].replace(/^线索④｜/, "");
      const end = find(i, /^---$/);
      beats.push({ kind: "clue", clue: { id: `jcode-${day}`, title, body: lines.slice(i, end).join("\n\n"), unlocked: true } });
      i = end;
      continue;
    }
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
    const scored = line.match(/^A｜(?:心动|好感度)\s*\+(\d+)$/);
    if (scored) {
      flush();
      const bIndex = find(i, /^B｜(?:心动|好感度)\s*\+\d+$/);
      const end = find(bIndex + 1, mergePattern);
      const bScore = lines[bIndex]?.match(/\+(\d+)$/);
      if (!bScore || end === lines.length) throw new Error(`Day ${day}: incomplete scored choices`);
      const options = [readLines(i, bIndex), readLines(bIndex + 1, end)].map(([reply, ...rest], index) => {
        if (reply?.speaker !== "你") throw new Error(`Day ${day}: option missing player dialogue`);
        return { body: reply.body, affinity: Number(index ? bScore[1] : scored[1]), lines: rest };
      });
      beats.push({ kind: "choice", options });
      i = end;
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

export type JcodeEndingKind = "together" | "friends" | "unspoken";
const endingOrder: JcodeEndingKind[] = ["together", "friends", "unspoken"];
export const jcodeEndings = {} as Record<JcodeEndingKind, { title: string; lines: JcodeLine[] }>;
export function jcodeEndingFor(affinity: number): JcodeEndingKind {
  if (affinity >= sharedRules.confessionAffinity) return "together";
  return affinity >= sharedRules.friendsBelowAffinity ? "friends" : "unspoken";
}

export const jcodeDays = Object.values(sources).flatMap(source =>
  source.split(/^## Day /m).slice(1).map(section => {
    const [heading, schedule, ...body] = section.split(/^## /m)[0].split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const [number, title] = heading.split("｜");
    const day = Number(number);
    const displaySchedule = tidy(schedule);
    const details = displaySchedule.split(" · ");
    const lines = body.map(tidy);
    const endingStart = lines.findIndex(line => line.startsWith("### 结局一"));
    if (endingStart !== -1) {
      const endings = lines.splice(endingStart).join("\n").split(/^### 结局.+$/m).slice(1);
      endings.forEach((ending, index) => {
        const content = ending.split("\n").filter(Boolean);
        const title = content.find(line => line.startsWith("END "));
        if (!title) throw new Error("Missing Jcode ending title");
        jcodeEndings[endingOrder[index]] = {
          title, lines: content.filter(line => line !== title && !structuralPattern.test(line)).map(parseLine),
        };
      });
    }
    const beats = parseBeats(lines, day);
    if (endingStart !== -1) beats.push({ kind: "ending" });
    return { day, title, schedule: displaySchedule, time: details.length === 3 ? details[1] : "14:00", place: details.at(-1)!, beats };
  })).sort((a, b) => a.day - b.day);
