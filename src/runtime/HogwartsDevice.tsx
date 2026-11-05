import { qFirstDayMail, qProgressKey, qRouteWork, savedQChoice } from "./qRoute";
import { SceneDialogue } from "./SceneDialogue";
import { HogwartsEnding } from "./HogwartsEnding";
import { MaraudersMap } from "./MaraudersMap";
import dateOptions from "../../stories/template/hogwarts-dates.json";
import { affinityKey, characterStatus, HogwartsCharacters, jealousyKey } from "./HogwartsCharacters";
import { dailyLessons, HogwartsSchedule } from "./HogwartsSchedule";
import { MagicalShops, useWeeklyAllowance, spendGalleons } from "./MagicalShops";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Feather, ScrollText, Map, Images, Heart, ArrowLeft } from "lucide-react";
import { initialRuntime, type Runtime, type Work } from "../schema";
import { dispatch, choose } from "../engine";
import "./HogwartsDevice.css";

const modules = [
  { id: "owlpost", name: "猫头鹰信箱", subtitle: "书信与便笺", Icon: Feather },
  { id: "schoolbook", name: "校园手册", subtitle: "课程与活动", Icon: BookOpen },
  { id: "wizardjournal", name: "巫师手札", subtitle: "私密记录", Icon: ScrollText },
  { id: "magicphotos", name: "魔法相册", subtitle: "会动的回忆", Icon: Images },
  { id: "maraudersmap", name: "活点地图", subtitle: "城堡探索", Icon: Map },
  { id: "calendar", name: "今日行程", subtitle: "课程与活动", Icon: BookOpen },
  { id: "date", name: "Date", subtitle: "周末约会", Icon: Heart },
  { id: "market", name: "魔法商店与古灵阁", subtitle: "购物与金库", Icon: Heart },
] as const;
const freeTimeScenes = [
  {
    place: "公共区域",
    arrival: "壁炉里的木柴啪地响了一声。放假后，靠窗那排椅子终于空了，桌上还留着一副巫师棋。",
    choices: [
      { label: "坐到壁炉边", result: "你把围巾搭上椅背。等冻僵的手指暖过来，窗台上又积了一薄层雪。" },
      { label: "摆一局巫师棋", result: "你刚把骑士放到棋盘上，它就抱怨：放假了还得加班？你把它挪到国王旁边，它立刻闭了嘴。" },
    ],
  },
  {
    place: "温室",
    arrival: "温室的玻璃蒙着水汽。门一开，潮湿的泥土味便盖过了外头的冷风。",
    choices: [
      { label: "看看架上的幼苗", result: "最小的那株缩着叶子。你把花盆往光里挪了挪，它慢吞吞地舒展开，像刚睡醒。" },
      { label: "给盆栽浇水", result: "你刚抬起水壶，最靠外的叶片就卷了起来。看样子，这盆今天已经喝够了。" },
    ],
  },
  {
    place: "城堡外散步",
    arrival: "庭院的石板上有一串新脚印，到了拱门底下就断了。风把雪从另一边吹进来。",
    choices: [
      { label: "绕庭院走一圈", result: "你专挑没人踩过的地方走。回头时，雪地里多了一串歪歪扭扭、只属于你的脚印。" },
      { label: "在拱门下躲一会儿风", result: "你站到背风的一侧，听见雪粒轻轻敲在石阶上。城堡里有人关了一扇窗。" },
    ],
  },
  {
    place: "对角巷",
    arrival: "丽痕书店的橱窗前挤了几个人。每隔几秒，橱窗里的书就自己翻一页，像怕人看得太慢。",
    choices: [
      { label: "进丽痕书店翻翻", result: "你抽出一本薄薄的旅行手册。封面上的小巫师看了看你鞋上的雪，默默把自己那双靴子系紧了。" },
      { label: "逛逛沿街的橱窗", result: "你看见一支羽毛笔在玻璃上写「圣诞快乐」。它漏写了一个字，又悄悄把整行擦掉重来。" },
    ],
  },
  {
    place: "霍格莫德镇",
    arrival: "三把扫帚的窗子亮着，隔着玻璃都能看见黄油啤酒杯上冒的热气。再往前走，就是蜂蜜公爵。",
    choices: [
      { label: "进三把扫帚暖一暖", result: "你在门边站了一会儿，等耳朵暖回来。靠窗那桌还在争论上场比赛的最后一球。" },
      { label: "看看蜂蜜公爵的新橱窗", result: "一只巧克力蛙在玻璃后连跳了三次，最后落回自己的盒子里，装作什么都没发生。" },
    ],
  },
];

const hyunjaeDates: Record<string, { reply: string; scene: string[] }> = {
  puddifoot: { reply: "好啊。先说好，你点的蛋糕要分我一口。", scene: ["他把蛋糕推到桌子正中，自己先拿起叉子。", "你不是说分我一口？我这才第一口。", "你管这叫一口？叉子都快拿不动了。", "……那剩下半块都归你。"] },
  "three-broomsticks": { reply: "去啊。你先到的话，帮我留个靠窗的位置。", scene: ["他端着两杯黄油啤酒回来，在你对面坐下。", "我刚才差点把这杯端给隔壁桌。", "那你怎么认出我的？", "你从我站起来就一直盯着这杯。"] },
  "hogs-head": { reply: "好。那里安静，你上次没讲完的事可以接着讲了。", scene: ["角落里只剩一张小桌，他把椅子往你这边拖了一点。", "行了，刚才说到哪儿了？", "你还记得啊？我都快忘了讲到哪儿了。", "记得。你每次讲到最好笑的地方就被人打断。"] },
  "diagon-alley-walk": { reply: "可以。丽痕书店见，你要是先到，别一个人把整间店逛完。", scene: ["你从书架上抽出一本书，发现他正从另一侧看着同一本。", "你也想看这个？", "我只是想看看你挑了什么。", "一起看呗。手慢点，我这页还差两行。"] },
  "leaky-cauldron": { reply: "好啊，正好我饿了。你想吃什么？我可以先帮你占座。", scene: ["他朝你招手，把菜单转到你面前。", "我看了半天，最后决定等你来选。", "这么信我？那我可要乱点了。", "嗯。选错了我也能帮你吃一半。"] },
  "florean-fortescue": { reply: "好！你挑一个口味，我挑一个，先别告诉我你选什么。", scene: ["两份冰淇淋端上来，居然是同一个口味。你们对视了一眼。", "等一下，你是不是偷听我点单了？", "喂，我先点的。你才可疑。", "那没办法了。下次再来一次，看看还会不会撞。"] },
};
// Entries are the places named in the route, not an inferred daily timetable.
const hyunjaeEncounterPlaces: Partial<Record<number, string>> = {
  1: "魔法史", 3: "城堡楼梯", 4: "图书馆", 7: "长廊", 8: "大礼堂",
  9: "长廊", 11: "大礼堂", 16: "城堡楼梯", 18: "门厅",
  22: "大礼堂", 24: "大礼堂", 25: "大礼堂", 26: "城堡楼梯",
  27: "大礼堂", 28: "庭院与拱门", 31: "长廊",
};

const hyunjaeDeclines = [
  "对不起啊，变形术的练习还没补完。我答应教授今天交，下次我早点留时间。",
  "今天可能去不了了，抱歉。格兰芬多那边临时要我换一轮巡查，等我忙完再找你。",
  "抱歉，我和同学约了整理魔咒学笔记，他还在等我。下次你再叫我，好不好？",
];
type Props = { onRestart: () => void; work: Work; contacts: readonly { id: string; name: string; house: string; year: number }[]; identity?: { name: string; house: string; year: number; loveInterest: string; avatar?: string; runId?: string } | null };
export function HogwartsDevice({ work: original, identity, contacts, onRestart }: Props) {
  const isQ = identity?.loveInterest === "q";
  const qStorageKey = qProgressKey(identity);
  const [restoredQChoice] = useState(() => isQ ? savedQChoice(qStorageKey) : null);
  const route = useMemo(() => isQ ? qRouteWork(original) : original, [original, isQ]);
  const work = useMemo(() => {
    const boundaries = route.nodes.filter(node => node.actions.some(action =>
      action.type === "date" && /^2026-12-(?!01$)\d{2}$/.test(String(action.value))));
    const gate = (id: string) => "end-day:" + id;
    const ids = new Set(boundaries.map(node => node.id));
    return {
      ...route,
      nodes: [
        ...route.nodes.map(node => ({ ...node, next: node.next.map(id => ids.has(id) ? gate(id) : id) })),
        ...boundaries.map(node => ({ ...node, id: gate(node.id), type: "choice" as const,
          actions: [], conditions: [], next: [node.id] })),
      ],
    };
  }, [route]);
  const [state, setState] = useState<Runtime>(() => {
    const initial = initialRuntime(work);
    initial.variables.hyunjae_player_house = identity?.house ?? "unspecified";
    initial.variables.hyunjae_player_year = identity?.year ?? 5;
    let runtime = dispatch(work, initial, "start");
    if (restoredQChoice !== null) {
      runtime = choose(work, runtime, `q-day01-${restoredQChoice}`);
      runtime.variables.q_mail_unlocked = true;
    }
    return runtime;
  });
  const [relationshipNotice, setRelationshipNotice] = useState("");
  useEffect(() => {
    if (!relationshipNotice) return;
    const timer = window.setTimeout(() => setRelationshipNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [relationshipNotice]);
  const relationship = (id: string, runtime: Runtime) =>
    characterStatus(id, identity?.year ?? 5, identity?.house ?? "", runtime.variables);
  const showRelationshipChange = (id: string, before: Runtime, after: Runtime) => {
    const previous = relationship(id, before);
    const current = relationship(id, after);
    const changes = [
      current.affinity > previous.affinity && `好感度 +${current.affinity - previous.affinity}`,
      current.jealousy > previous.jealousy && `嫉妒值 +${current.jealousy - previous.jealousy}`,
    ].filter(Boolean);
    if (changes.length) setRelationshipNotice(`${contacts.find(contact => contact.id === id)?.name ?? ""} · ${changes.join(" · ")}`);
  };
  const relationshipHint = relationshipNotice && <p className="hogwarts-narration" role="status" style={{ fontSize: ".9rem" }}>{relationshipNotice}</p>;
  const [active, setActive] = useState("calendar");
  const [acknowledgedClues, setAcknowledgedClues] = useState<string[]>([]);
  const [matchStep, setMatchStep] = useState<"bet" | "ready" | "result" | "pub" | "buy" | "stay" | "done">("bet");
  const [team, setTeam] = useState("");
  const [stake, setStake] = useState(1);
  const [matchError, setMatchError] = useState("");
  const [matchDialog, setMatchDialog] = useState(false);
  const [visitedMatchPub, setVisitedMatchPub] = useState(false);
  const won = team === "斯莱特林";
  const [sceneOpen, setSceneOpen] = useState(false);
  const [seenScene, setSeenScene] = useState("");
  const entries = (state.messages.owlpost ?? []).filter(item => !item.hidden);
  const date = new Date((state.date || "2026-12-01") + "T12:00:00Z");
  const day = date.getUTCDate();
  const availableDateDays = Array.from({ length: 32 - day }, (_, offset) => day + offset)
    .filter(value => value !== 12 && value !== 24 && (value >= 22 || dateOptions.dateDays.includes(new Date(Date.UTC(2026, 11, value)).getUTCDay())));

  const nextDay = state.choices.find(choice =>
    work.nodes.find(node => node.id === choice.target)?.actions.some(action =>
      action.type === "date" && String(action.value) > (state.date || "")));
  const [startTime] = useState(() => isQ ? restoredQChoice !== null ? "20:00" : "09:00" : new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [lessonTime, setLessonTime] = useState<string>();
  const [recipient, setRecipient] = useState("");
  const [dateReply, setDateReply] = useState("");
  const [outing, setOuting] = useState(false);
  const [dateContact, setDateContact] = useState("");
  const [dateDay, setDateDay] = useState(0);
  const [attendedDates, setAttendedDates] = useState<number[]>([]);
  const [dateVenue, setDateVenue] = useState("");
  const [destination, setDestination] = useState<(typeof freeTimeScenes)[number]>();
  const [freeTimeResult, setFreeTimeResult] = useState("");
  const [plans, setPlans] = useState<Record<number, string>>({});
  const [acceptedVenues, setAcceptedVenues] = useState<Record<number, string>>({});
  const [draft, setDraft] = useState("");
  const highlightMistletoe = (text: string) => text.split(/(槲寄生)/).map((word, index) =>
    word === "槲寄生" ? <strong key={index}>{word}</strong> : word);
  const note = (name: string, body: string, outgoing: boolean, key?: number) =>
    <div key={key} className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}>
      <span className="hogwarts-avatar" aria-hidden="true">{outgoing && identity?.avatar ? <img src={identity.avatar} alt="" /> : !outgoing && contacts.some(contact => contact.name === name) ? <img src={`./portraits/${contacts.find(contact => contact.name === name)?.id}.webp`} alt="" /> : name.slice(-1)}</span>
      <div><strong>{name}</strong><p>{body}</p></div>
    </div>;
  const [finished, setFinished] = useState(false);
  const [finalMemoryOpen, setFinalMemoryOpen] = useState(false);
  const [archiveStatus, setArchiveStatus] = useState("");
  const ending = state.endings.includes("hyunjae-together") ? {
    kind: "together" as const, title: "恋人结局 · 雪停之前", text: "他在石拱门下牵住了你的手。你们谁都没催着走。等窗外的雪停下来，你才发现，刚才还冻得发僵的那只手，已经暖了。",
    memory: "再经过那道石拱门时，他看见了槲寄生，这次什么也没说，只是牵住了你的手。",
  } : state.endings.includes("hyunjae-friends") ? {
    kind: "friends" as const, title: "朋友结局 · 窗边那个位置", text: "把话说开以后，你们还是并肩走了回去。快到楼梯口，他问下次去三把扫帚还给不给他留位置。你说：「留啊。但窗边那个归我。」他笑了：「我就知道。」",
    memory: "雪落在长廊外，你们说好下次去三把扫帚，还是坐窗边。",
  } : {
    kind: "unspoken" as const, title: "暧昧结局 · 明年第一个", text: "走到长廊尽头，你们就该往不同的方向走了。他多站了一会儿，说：「明年我还是想第一个来找你。」你说：「那你得来早点。」",
    memory: "长廊里很安静，他说，明年还是想第一个来找你。",
  };
  const [attended, setAttended] = useState<Record<string, boolean>>(() => isQ && restoredQChoice !== null && identity
    ? Object.fromEntries(dailyLessons(identity.year, identity.house, 1).map(lesson => [[1, lesson.time, lesson.subject].join("-"), true])) : {});
  const lead = contacts.find(contact => contact.id === identity?.loveInterest);
  const sameHouse = lead?.house === identity?.house;
  const sameYear = lead?.year === identity?.year;
  const journalIntro = sameHouse
    ? sameYear ? "你们平时一起上课，偶尔会聊几句作业。老师说下节课要换教室时，你还问过他该往哪边走。"
      : "你常在公共休息室看见他。偶尔有人问壁炉旁还有没有空位，你们会搭上一两句话。"
    : sameYear ? "你知道他和你同年级。有时两院的课排在一起，你会在教室里见到他。"
      : "你见过他几次。大多是在门厅或楼梯上，擦肩就过去了。";
  const identityKey = identity ? identity.runId ?? [identity.name, identity.house, identity.year].join("-") : "";
  useWeeklyAllowance(identityKey, day);
  // The authored route stores both channels in owlpost. Keep the original text
  // and mark which opening scenes are delivered by owl.
  const owlDays = isQ ? [] : [2, 5, 6, 13, 15, 17, 19, 20, 30];
  const owlToday = owlDays.includes(day);
  let entryDay = 1;
  const conversation = entries.map(entry => {
    const heading = entry.body.match(/^12月(\d+)日｜/);
    if (heading) entryDay = Number(heading[1]);
    return { ...entry, day: entryDay, body: entry.body.replace(/^12月\d+日｜/, "") };
  });
  const isNote = (body: string) =>
    body.split("\n").every(line => /^(李贤在|你)[：:]/.test(line));
  const [extraMail, setExtraMail] = useState<{ recipient: string; body: string; outgoing: boolean; day: number; order: number }[]>(() => isQ && restoredQChoice !== null ? qFirstDayMail : []);
  const addMail = (recipient: string, body: string, outgoing: boolean) =>
    setExtraMail(previous => [...previous, { recipient, body, outgoing, day, order: entries.length }]);
  const thread = (contact: string) => [
    ...conversation.flatMap((entry, order) => contact === "hyunjae" && owlDays.includes(entry.day) && isNote(entry.body)
      ? entry.body.split(/(?<=[；;。！？?！]|\s)(?=(?:李贤在|你)[：:])/).map(line => ({
        body: line.replace(/^(李贤在|你)[：:]/, "").replace(/[；;]$/, ""),
        outgoing: /^你[：:]/.test(line), day: entry.day, order: order + .5,
      })) : []),
    ...extraMail.filter(entry => entry.recipient === contact),
  ].sort((a, b) => a.day - b.day || a.order - b.order);
  const currentThread = thread(recipient);
  const soloSnow = day === 7 && !state.variables.hyunjae_first_snow_together;
  const scenes = conversation.filter(entry => entry.day === day && (!owlToday || !isNote(entry.body)))
    .map((entry, index) => day === 18 && index === 0 ? { ...entry, body: state.variables.hyunjae_day17_choice === "a"
      ? "门厅里，李贤在手里捏着一张折好的羊皮纸。\n李贤在：你圣诞假期回家吗？\n你：不回啊，我还没逛够呢。你呢？\n李贤在：我也留。那今年城堡应该不会太无聊了。\n你：哦？我还有这本事？\n李贤在：因为你也在啊。"
      : "门厅里，李贤在手里捏着一张折好的羊皮纸。\n李贤在：你圣诞假期回家吗？\n你：不回啊，我还没逛够呢。你呢？\n李贤在：我也留。对了，昨天忘了问你。二十四号舞会，你有约了吗？\n你：还没。怎么，你要排队啊？\n李贤在：那要不要一起？\n你：好啊，那你排第一个。\n李贤在：那天我在大礼堂门口等你。"
    } : day === 18 && entry.body.startsWith("你：我留校啊，城堡想赶我也来不及了。") ? { ...entry, body: "你：我留校啊，城堡想赶我也来不及了。\n李贤在：那晚别站得离我太远。我怕第一支舞都跳完了，你还在甜点桌那边。" }
      : soloSnow && index === 0 ? { ...entry, body: "走廊里。\n李贤在：你昨天后来去哪儿走了？我回去的时候，鞋里都是雪。" } : entry);
  const encounterReached = sceneOpen || Boolean(seenScene && scenes.some(entry => entry.id === seenScene));
  const storyPlace = encounterReached ? isQ ? "图书馆" : hyunjaeEncounterPlaces[day] : undefined;
  // The device clock starts at local time, so only use time set by in-game actions.
  const mapPlace = isQ ? storyPlace : attendedDates.includes(day) ? (acceptedVenues[day] === "diagon-alley-walk" ? "丽痕书店" : plans[day])
    : day === 12 ? (visitedMatchPub ? "三把扫帚" : matchStep === "result" ? "回城堡的路上"
      : matchStep === "pub" ? "霍格沃茨城堡" : matchStep === "ready" || matchDialog ? "魁地奇球场" : undefined)
    : day === 6 && state.variables.hyunjae_first_snow_together === true ? "庭院与拱门"
    : day === 17 && ["a", "b"].includes(String(state.variables.hyunjae_day17_choice)) ? "大礼堂"
    : day === 24 && ["a", "b"].includes(String(state.variables.hyunjae_day24_choice)) ? "长廊"
    : day === 29 && ["a", "b"].includes(String(state.variables.hyunjae_day29_choice)) ? "冬季灯展"
    : storyPlace ?? (encounterReached && [14, 21].includes(day) ? "霍格沃茨城堡" : undefined);
  const scheduledLesson = !mapPlace && lessonTime
    ? dailyLessons(7, "gryffindor", day).find(lesson => lesson.time === lessonTime)
    : undefined;
  const scheduledPlace = scheduledLesson && ({
    "保护神奇生物": "神奇动物课场地",
    "魔药学": "魔药学 · 地窖",
    "自习与作业": "图书馆",
    "毕业研究": "图书馆",
    "N.E.W.T.复习": "图书馆",
  }[scheduledLesson.subject] ?? scheduledLesson.subject);
  const albumClues = [
    {
      id: "photo-snow",
      title: "庭院初雪",
      body: "初雪落在庭院里，他伸手接住两片雪，抬头望向石拱门边的槲寄生。",
      unlocked: day > 6 && state.variables.hyunjae_first_snow_together === true,
    },
    {
      id: "photo-ball",
      title: "圣诞舞会",
      body: "跳第一支舞时，你们一抬头就撞上对方的视线，又同时移开眼，忍不住笑了。",
      unlocked: day > 24 && state.variables.hyunjae_danced_at_ball === true,
    },
    {
      id: "photo-ball-mistletoe",
      title: "舞会后的石拱门",
      body: "舞会散场后，他在石拱门下放慢脚步，抬头看了一眼槲寄生，又看向你。",
      unlocked: day > 24 && state.variables.hyunjae_day24_choice === "a",
    },
    {
      id: "photo-new-year",
      title: "跨年长廊",
      body: ending.memory,
      unlocked: finalMemoryOpen || finished,
    },
  ].filter(clue => !isQ && clue.unlocked);
  // Let story dialogs finish first, then announce each new entry in album order.
  const pendingClue = sceneOpen || matchDialog || dateReply || outing || destination
    ? undefined : albumClues.find(clue => clue.id !== "photo-new-year" && !acknowledgedClues.includes(clue.id));
  const acknowledgeClue = (id: string) =>
    setAcknowledgedClues(previous => previous.includes(id) ? previous : [...previous, id]);
  const chosen = modules.find(m => m.id === active) ?? modules[0];
  const choices = !nextDay && state.choices.length > 0 ? <div className="hogwarts-device-choices">

    {state.choices.filter((_, index) => !soloSnow || index === 1).map(choice => <button key={choice.target} onClick={() => select(choice.target)}>{choice.label}</button>)}
  </div> : null;
  const select = (target: string) => {
    const next = choose(work, state, target);
    if (target === "hy-day10-a" || target === "hy-day10-b") {
      next.variables.hyunjae_jealousy = Math.min(100, relationship("hyunjae", state).jealousy + (target.endsWith("-a") ? 3 : 1));
    }
    showRelationshipChange(identity?.loveInterest ?? "hyunjae", state, next);
    setState(next);
    if (owlToday && next.date === state.date && (next.messages.owlpost ?? []).slice((state.messages.owlpost ?? []).length).some(entry => !isNote(entry.body))) {
      setSceneOpen(true);
    }
  };
  function finishScene() {
    setSeenScene(scenes[scenes.length - 1]?.id ?? "");
    setSceneOpen(false);
    if (isQ && state.variables.q_day1_complete === true && state.variables.q_mail_unlocked !== true) {
      setState(previous => ({ ...previous, variables: { ...previous.variables, q_mail_unlocked: true } }));
      setExtraMail(previous => [...previous, ...qFirstDayMail]);
      setLessonTime("20:00");
      try {
        localStorage.setItem(qStorageKey, JSON.stringify({
          choice: state.variables.q_day1_choice, finished: true, mailRead: qFirstDayMail.length,
        }));
      } catch {
        setRelationshipNotice("这次进度没能保存在浏览器中，刷新后可能需要重新阅读。");
      }
    }
    if (day === 31 && state.endings.length) { setActive("magicphotos"); setFinalMemoryOpen(true); }
    if (day === 12) { setMatchStep("result"); setMatchDialog(true); }
  }
  if (finished) {
    const character = contacts.find(contact => contact.id === identity?.loveInterest) ?? { id: "hyunjae", name: "李贤在" };
    const stats = relationship(character.id, state);
    const archive = () => {
      try {
        const key = "foundphone-hogwarts-endings-v1";
        const records = JSON.parse(localStorage.getItem(key) ?? "{}");
        localStorage.setItem(key, JSON.stringify({ ...records, [identityKey || "default"]: {
          player: identity?.name, character: character.name, ...ending, ...stats,
        } }));
        setArchiveStatus("已归档到此浏览器。");
      } catch {
        setArchiveStatus("这次没能保存归档，请再试一次。");
      }
    };
    return <HogwartsEnding kind={ending.kind} title={ending.title} text={ending.text} character={character}
      affinity={stats.affinity} jealousy={stats.jealousy} onRestart={onRestart}
      onArchive={archive} archiveStatus={archiveStatus} />;
  }
  return <div className="hogwarts-device-stage">
    <div className="hogwarts-device" aria-label="Hogwarts Unspoken">
      <div className="hogwarts-device-top"><span>12月{day}日 {new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date)} <strong>D{day}/31</strong></span><span>{lessonTime ?? startTime}</span></div>
      <header className="hogwarts-device-header">
        <div className="hogwarts-device-seal">H</div>
        <div><small>HOGWARTS STUDENT</small><h1>Hogwarts Unspoken</h1><p><time dateTime={state.date || "2026-12-01"}>2026年12月{day}日</time></p></div>
      </header>
      <main className={active === "calendar" ? "hogwarts-device-page hogwarts-today" : "hogwarts-device-page"}>
        {active === "market" && relationshipHint}
        {active !== "calendar" && <button className="hogwarts-device-back" onClick={() => setActive("calendar")}><ArrowLeft size={17}/> 今日行程</button>}
        <h2>{active === "calendar" ? <><small>TODAY</small> 今日行程 <time className="hogwarts-agenda-date" dateTime={state.date || "2026-12-01"}>12月{day}日 {new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date)}</time></> : active === "owlpost" && !recipient ? <>消息 <small>MESSAGES</small></> : chosen.name}{active === "owlpost" && !recipient && <button className="hogwarts-shop-link" onClick={() => setActive("market")}>魔法商店 · 猫头鹰送礼</button>}</h2>
        {active === "owlpost" ? <section className="hogwarts-device-letters">
          {!recipient ? <>
            {contacts.map(contact => <button className="hogwarts-contact" key={contact.id} onClick={() => setRecipient(contact.id)}>
              <span className="hogwarts-avatar" aria-hidden="true"><img src={`./portraits/${contact.id}.webp`} alt="" /></span>
              <span className="hogwarts-contact-copy"><strong>{contact.name}</strong><small>{
                thread(contact.id).slice(-1)[0]?.body ||
                "还没有消息"
              }</small></span>
            </button>)}
          </> : <>
          <button onClick={() => { setRecipient(""); setDraft(""); }}>返回会话列表</button>
          <h3>{contacts.find(contact => contact.id === recipient)?.name}</h3>
          {currentThread.length === 0 && <p>暂时没有新的猫头鹰纸条。</p>}
          {currentThread.map((message, index) => <div key={index} className="hogwarts-note-thread">
            {(index === 0 || currentThread[index - 1].day !== message.day) && <small>12月{message.day}日</small>}
            {note(message.outgoing ? identity?.name ?? "我" : contacts.find(contact => contact.id === recipient)?.name ?? "", message.body, message.outgoing)}
          </div>)}
          {recipient === "hyunjae" && owlToday && <>{choices}{!sceneOpen && relationshipHint}</>}
          <form onSubmit={event => {
            event.preventDefault();
            if (!draft.trim()) return;
            addMail(recipient, draft.trim(), true);
            setDraft("");
          }}>
            <input aria-label="纸条内容" value={draft} onChange={event => setDraft(event.target.value)} maxLength={300} />
            <button disabled={!draft.trim()}>寄出纸条</button>
          </form>
          </>}
        </section> : active === "calendar" && identity ? <section>
          <HogwartsSchedule year={identity.year} house={identity.house} day={day} interaction={owlToday ? "猫头鹰信箱" : undefined}
            sceneLabel={isQ ? "傍晚 · 去图书馆找池昌民" : {3: "晚上下楼", 4: "去图书馆", 12: matchStep === "ready" ? "14:00 看魁地奇比赛" : "去看台找李贤在"}[day]}
            onScene={!owlToday && scenes.length > 0 && !nextDay ? () => {
              if (day === 12 && matchStep === "bet") setMatchDialog(true);
              else { if (isQ) setLessonTime("17:00"); else if (day === 12) setLessonTime("14:00"); setSceneOpen(true); }
            } : undefined}
            attended={attended} onAttend={(id, time, last) => {
              setAttended(previous => ({ ...previous, [id]: true }));
              setLessonTime(isQ && last ? "17:00" : time);
              if (last && !isQ && day !== 3 && day !== 4 && !owlToday && scenes.length > 0 && !nextDay) setSceneOpen(true);
            }}
            onEnd={nextDay && (day !== 12 || matchStep === "done") && (!scenes.length || seenScene === scenes[scenes.length - 1]?.id) ? () => { select(nextDay.target); setLessonTime(undefined); setDestination(undefined); } : undefined} />
          {isQ && state.variables.q_mail_unlocked === true && <p role="status">第一天已完成，后续剧情待续。<button onClick={() => { setActive("owlpost"); setRecipient("q"); }}>查看池昌民的来信</button></p>}
          {owlToday && !nextDay && <button onClick={() => { setRecipient("hyunjae"); setActive("owlpost"); }}>{day === 6 ? "查看李贤在的新纸条" : "打开猫头鹰信箱"}</button>}
          {day >= 22 && <section aria-label="假期自由活动">
            <h3>自由活动</h3>
            {freeTimeScenes.map(scene => <button className="hogwarts-activity" type="button" key={scene.place}
              onClick={() => { setFreeTimeResult(""); setDestination(scene); }}>{scene.place}</button>)}
          </section>}
          {plans[day] && <p>今日约会：{plans[day]} <button className="hogwarts-activity" disabled={attendedDates.includes(day)} onClick={() => setOuting(true)}>{attendedDates.includes(day) ? "已赴约" : "去赴约"}</button></p>}
          {day === 12 && matchStep === "pub" && <button className="hogwarts-activity" onClick={() => { setVisitedMatchPub(true); setMatchDialog(true); }}>和李贤在去三把扫帚</button>}
        </section> : active === "date" ? <section className="hogwarts-date">
          <p>周末与假期约会</p>
          <label>约谁见面 <select value={dateContact} onChange={event => setDateContact(event.target.value)}>
            <option value="">选择一位朋友</option>
            {contacts.filter(contact => contact.id === identity?.loveInterest).map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select></label>
          <p><label>约会日期 <select value={availableDateDays.includes(dateDay) ? dateDay : 0} onChange={event => setDateDay(Number(event.target.value))}>
            <option value={0}>选择日期</option>
            {availableDateDays.map(value => <option key={value} value={value} disabled={Boolean(plans[value])}>12月{value}日</option>)}
          </select></label></p>
          <p><label>去哪里 <select value={dateVenue} onChange={event => setDateVenue(event.target.value)}>
            <option value="">选择地点</option>
            {dateOptions.venues.map(venue => <option key={venue.id} value={venue.id}
>
              {venue.name}（{venue.region}）
            </option>)}
          </select></label></p>
          <button className="hogwarts-send-invite" disabled={dateContact !== "hyunjae" || !hyunjaeDates[dateVenue] || Boolean(plans[dateDay]) || !availableDateDays.includes(dateDay)}
            onClick={() => {
              const accepted = identity?.loveInterest === "hyunjae" && relationship("hyunjae", state).affinity > 45;
              const reply = accepted ? hyunjaeDates[dateVenue].reply : hyunjaeDeclines[(day - 1) % hyunjaeDeclines.length];
              const venue = dateOptions.venues.find(item => item.id === dateVenue);
              if (accepted) {
                setPlans(previous => ({ ...previous, [dateDay]: "李贤在 · " + venue?.name }));
                setAcceptedVenues(previous => ({ ...previous, [dateDay]: dateVenue }));
              }
              addMail("hyunjae", "邀约：12月" + dateDay + "日 · " + venue?.name, true);
              addMail("hyunjae", reply, false);
              setDateReply(reply);
            }}>发送邀请</button>
          {dateContact && dateContact !== "hyunjae" && <p>这位角色的邀约剧情还在准备中。</p>}
          <p className="hogwarts-date-hint">每天都能发邀请，赴约日期可选周末或12月22日起的假期。</p>
          {Object.entries(plans).filter(([value]) => Number(value) >= day).map(([value, plan]) => <p key={value}>12月{value}日 · {plan}</p>)}
        </section> : active === "market" && identity ? <MagicalShops identityKey={identityKey} leadId={identity.loveInterest} contacts={contacts} onGift={(recipient, item, liked) => {
            const leadId = identity.loveInterest;
            const affection = relationship(leadId, state).affinity;
            const key = affinityKey(recipient);
            const variables = { ...state.variables,
              [key]: Math.min(100, Number(state.variables[key] ?? state.variables["friendship_" + recipient] ?? 0) + (liked ? 5 : 2)),
            };
            const jealous = recipient !== leadId && affection > 40;
            if (jealous) variables[jealousyKey(leadId)] = Math.min(100, relationship(leadId, state).jealousy + (affection >= 70 ? 5 : 3));
            const next = { ...state, variables };
            setState(next);
            showRelationshipChange(jealous ? leadId : recipient, state, next);
            if (recipient === identity.loveInterest && recipient === "hyunjae") {
              const reply = /围巾|手套|毛衣|厚袜|保暖帽/.test(item)
                ? `收到你的${item}了。明天巡查我就用上。你要是碰见我，记得看一眼。`
                : /羽毛笔|墨水|书签|羊皮/.test(item)
                  ? `你寄的${item}我收到了。刚才拿它写了两行巡查记录，第三行写的就是这张回信。`
                  : /糖|巧克力|蛋糕|馅饼|多味豆/.test(item)
                    ? `收到${item}了！我先尝一口。要是又苦得皱脸，这次你可看不见ㅋㅋ`
                    : `你挑的${item}我收到了。我刚放到床头了。明天见面记得问我喜不喜欢，我想当面告诉你。`;
              addMail("hyunjae", reply, false);

            } else if (recipient !== identity.loveInterest) {
              if (leadId === "hyunjae" && jealous) {
                const name = contacts.find(contact => contact.id === recipient)?.name;
                addMail("hyunjae", affection >= 70
                  ? `你给${name}寄了${item}啊。我刚才还想装作只是路过问一下。算了，有一点吃醋。`
                  : `${name}刚才给我看了你送的${item}。我就是问问……下次你去挑礼物，叫我一声呗。`, false);
              }
            }
          }} />
          : active === "wizardjournal" && identity ? <section>
            {(work.data.wizardjournal ?? []).map(item => <p key={item.id}>{item.id === "journal-route" ? journalIntro : item.body}</p>)}
            <HogwartsCharacters year={identity.year} house={identity.house} variables={state.variables} />
            <button className="hogwarts-open-map" onClick={() => setActive("maraudersmap")}>打开活点地图</button>
          </section>
          : active === "maraudersmap" ? <MaraudersMap day={day} time={lessonTime ?? startTime} selectedId={identity?.loveInterest}
              place={isQ ? mapPlace : identity?.loveInterest === "hyunjae" ? mapPlace ?? scheduledPlace : undefined}
              activity={identity?.loveInterest === "hyunjae" ? scheduledLesson?.subject : undefined}
              onEncounter={isQ && identity && dailyLessons(identity.year, identity.house, day).every(lesson => attended[[day, lesson.time, lesson.subject].join("-")]) && lessonTime === "17:00" ? () => setSceneOpen(true) : undefined} />
          : active === "magicphotos" ? <section className="hogwarts-device-letters">
            {albumClues.map(clue => <details className="hogwarts-device-letter" key={clue.id}>
              <summary>{clue.title}</summary>
              <p>{highlightMistletoe(clue.body)}</p>
            </details>)}
            {!albumClues.length && <p>这页羊皮纸还没有写下新的内容。</p>}
          </section> : <section className="hogwarts-device-letters">
            {(work.data[active] ?? []).map(item => <article className="hogwarts-device-letter" key={item.id}>
              <strong>{item.title}</strong><p>{item.body}</p>
            </article>)}
            {!(work.data[active] ?? []).length && <p>这页羊皮纸还没有写下新的内容。</p>}
          </section>}
      </main>
      {destination && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onClose={() => setDestination(undefined)} className="hogwarts-scene" aria-labelledby="free-time-title">
        <h2 id="free-time-title">{destination.place}</h2>
        <SceneDialogue>
        <p className="hogwarts-narration">{destination.arrival}</p>
        {freeTimeResult ? <p className="hogwarts-narration" role="status">{freeTimeResult}</p>
          : <div className="hogwarts-device-choices">{destination.choices.map(choice =>
            <button type="button" key={choice.label} onClick={() => setFreeTimeResult(choice.result)}>{choice.label}</button>
          )}</div>}
        <button className="hogwarts-continue-day" type="button" onClick={() => setDestination(undefined)}>返回今日行程</button>
        </SceneDialogue>
      </dialog>}
      {(dateReply || outing) && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onClose={() => { setDateReply(""); setOuting(false); }} className="hogwarts-scene">
        <h2>{outing ? plans[day] : "李贤在的猫头鹰回信"}</h2>
        <SceneDialogue key={outing ? `outing-${day}-${acceptedVenues[day]}` : "mail"}>
        {outing ? hyunjaeDates[acceptedVenues[day]]?.scene.map((line, index) => index === 0
          ? <p key={index} className="hogwarts-narration">{line}</p>
          : note(index === 2 ? identity?.name ?? "我" : "李贤在", line, index === 2, index))
          : <div className="date-mail-reply">{note("李贤在", dateReply, false)}</div>}
        <button onClick={() => { if (outing) setAttendedDates(previous => [...previous, day]); setDateReply(""); setOuting(false); }}>{outing ? "完成赴约" : "返回"}</button>
        </SceneDialogue>
      </dialog>}
      {matchDialog && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onCancel={event => event.preventDefault()} className="hogwarts-scene hogwarts-wager">
        {matchStep === "bet" ? <>
          <small className="wager-stamp">弗雷德 &amp; 乔治 · 看台特刊</small><h2>谁的扫帚先得意？</h2>
          <SceneDialogue key="match-bet">
          <p className="hogwarts-narration">李贤在忙完级长的事，在看台上找到你。一张羊皮纸从座位缝里冒出来，落款是弗雷德和乔治。</p>
          {note("李贤在", "你来得还挺早。", false)}
          <div className="wager-teams">{["格兰芬多", "斯莱特林"].map(name => <button key={name} data-team={name} aria-pressed={team === name} onClick={() => setTeam(name)}>{name}{team === name ? " ✓" : ""}</button>)}</div>
          <p><label>押 {stake} 加隆 <input type="range" min="1" max="10" value={stake} onChange={event => setStake(Number(event.target.value))} /></label></p>
          <p>1 加隆：意思一下 · 10 加隆：钱包尖叫</p>
          <p>{stake < 4 ? "很好，输了也只需要叹一口气。" : stake < 8 ? "现在你已经有理由比球员还紧张了。" : "我们欣赏你的勇气。你的钱包有不同意见。"}</p>
          <button className="wager-primary" disabled={!team} onClick={() => {
            if (!spendGalleons(identityKey, stake)) { setMatchError("钱包里的加隆不够。"); return; }
            setMatchError(""); setMatchStep("ready"); setMatchDialog(false);
          }}>就押这个</button>
          <button className="wager-secondary" onClick={() => { setMatchError(""); setMatchDialog(false); }}>返回行程</button>
          </SceneDialogue>
        </> : matchStep === "result" ? <>
          {won && <div className="wager-confetti" aria-hidden="true">✦ 🎉 ✧ 🍺 ✦</div>}
          <h2>{won ? "恭喜，你押中了！" : "别灰心！"}</h2>
          <p>{won ? `斯莱特林赢了。你押的 ${stake} 加隆已经光荣退役，但你赢得了一杯黄油啤酒。请到三把扫帚找斯莱特林那桌领取，趁他们还在高兴。` : `斯莱特林赢了。你押的 ${stake} 加隆和格兰芬多的比分一样，都回不来了。本纸条不提供饮料，但可以垫杯子。至少还有点用。`}</p>
          <button className={won ? "wager-primary wager-ticket" : "wager-secondary"} onClick={() => { setMatchStep("pub"); setMatchDialog(false); }}>{won ? "收下饮料券" : "把纸条折起来"}</button>
        </> : <>
          <h2>三把扫帚</h2>
          <SceneDialogue key="match-pub">
          <p className="hogwarts-narration">斯莱特林那桌还在复盘最后一球。李贤在找到一张靠窗的小桌，把里面的位置留给你。</p>
          {won ? <>
            <p className="hogwarts-narration">斯莱特林那桌给你送来一杯黄油啤酒。他也给自己点了一杯。</p>
            {note("李贤在", "你刚才在看台上那么紧张，我还以为你押的是我们。", false)}
            {note(identity?.name ?? "我", "我就不能一边替你紧张，一边押他们赢吗？", true)}
            {note("李贤在", "可以。那你喝第一口的时候，能不能稍微替我难过一下？", false)}
          </> : <>
            {note("李贤在", "我们输了球，你输了加隆。现在只剩一个问题了。", false)}
            {note(identity?.name ?? "我", "什么？", true)}
            {note("李贤在", "你还喝不喝黄油啤酒？我反正要喝一杯。", false)}
            {matchStep === "pub" && <>
              <button onClick={() => { if (spendGalleons(identityKey, 5)) { setMatchError(""); setMatchStep("buy"); } else setMatchError("钱包里的加隆不够。"); }}>自己买一杯 · 5 加隆</button>
              <button onClick={() => { setMatchError(""); setMatchStep("stay"); }}>陪他坐一会儿</button>
            </>}
            {matchStep === "buy" && <>
              {note(identity?.name ?? "我", "买。都到这儿了，我总不能只喝西北风吧。", true)}
              <p className="hogwarts-narration">两杯黄油啤酒端上来，他拿自己的杯子碰了碰你的。</p>
              {note("李贤在", "敬今天最有眼光的观众。", false)}
              {note(identity?.name ?? "我", "你确定要夸我？我刚押错了。", true)}
              {note("李贤在", "我说的是你选了靠窗的位置。球赛那件事，我们明天再提。", false)}
            </>}
            {matchStep === "stay" && <>
              {note(identity?.name ?? "我", "我不点了。陪你坐一会儿吧。", true)}
              <p className="hogwarts-narration">他把杯子往自己那边挪了挪，给你腾出放围巾的地方。</p>
              {note("李贤在", "行。那你陪我听听，他们打算把最后一球讲几遍。", false)}
              {note(identity?.name ?? "我", "这已经是第四遍了。", true)}
              {note("李贤在", "你还真数了？", false)}
              <p className="hogwarts-narration">斯莱特林那桌又敲了一下杯子。你们对视一眼，都笑了。</p>
            </>}
          </>}
          {(won || matchStep !== "pub") && <button onClick={() => { setMatchStep("done"); setMatchDialog(false); }}>返回今日行程</button>}
          </SceneDialogue>
        </>}
        {matchError && <p role="alert">{matchError}</p>}
      </dialog>}
      {finalMemoryOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onCancel={event => event.preventDefault()} className="hogwarts-scene hogwarts-clue" aria-labelledby="final-memory-title">
        <p>魔法相册解锁最后一条回忆</p>
        <h2 id="final-memory-title">跨年长廊</h2>
        <p className="hogwarts-narration">{highlightMistletoe(ending.memory)}</p>
        <button type="button" onClick={() => { setFinalMemoryOpen(false); setFinished(true); }}>读完了 · 查看结局</button>
      </dialog>}
      {pendingClue && <dialog key={pendingClue.id} ref={element => { if (element && !element.open) element.showModal(); }} onClose={() => acknowledgeClue(pendingClue.id)} className="hogwarts-scene hogwarts-clue" aria-labelledby="album-clue-title">
        <h2 id="album-clue-title">魔法相册解锁新内容</h2><p>在魔法相册中查看「{pendingClue.title}」。</p>
        <button onClick={() => acknowledgeClue(pendingClue.id)}>继续</button>
      </dialog>}
      {sceneOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }} onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="scene-title">
        <h2 id="scene-title">{isQ ? "池昌民" : "李贤在"} <small>· {isQ ? "Q" : "HYUNJAE"}</small></h2>
        <SceneDialogue key={`story-${day}`}>
        {scenes.map(scene => <div key={scene.id}>{scene.body.split("\n").map((part, index) => {
          const line = part.match(/^([^：:]{1,30})[：:](.+)$/);
          const speaker = line?.[1];
          const player = speaker === "你" || speaker === "我" || speaker === identity?.name;
          if (line && (player || contacts.some(contact => contact.name === speaker))) return note(player ? identity?.name ?? "我" : line[1], line[2], player, index);
          return part && <p key={index} className="hogwarts-narration">{highlightMistletoe(part)}</p>;
        })}</div>)}
        {!owlToday && choices}
        {relationshipHint}
        {(!choices || owlToday) && <button className="hogwarts-continue-day" onClick={finishScene}>继续今天的行程</button>}
        </SceneDialogue>
      </dialog>}
      <nav className="hogwarts-dock" aria-label="学生手机应用">
        {modules.filter(module => ["magicphotos", "owlpost", "wizardjournal", "date"].includes(module.id)).sort((a, b) => ["magicphotos", "owlpost", "wizardjournal", "date"].indexOf(a.id) - ["magicphotos", "owlpost", "wizardjournal", "date"].indexOf(b.id)).map(module =>
          <button key={module.id} aria-pressed={active === module.id} onClick={() => setActive(active === module.id ? "calendar" : module.id)}>
            <span><module.Icon size={19} /></span>{module.id === "market" ? "魔法商店" : module.name}
          </button>)}
      </nav>
    </div>
  </div>;
}
