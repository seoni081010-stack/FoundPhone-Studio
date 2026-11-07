import { QuidditchPaper, QuidditchResult } from "./QuidditchPaper";
import { albumNoticeKey, readAlbumNotices, saveAlbumNotices, albumSceneRead, nextAlbumNotice } from "./albumNotices";
import { routeMatchContent, type MatchLine } from "./routeMatchContent";
import { routeDateContent } from "./routeDateContent";
import { acceptsInvitation, availableDateDays as sharedDateDays, isHoliday, sharedRules } from "./sharedRules";
import { qDayPreviewProgress, qFirstDayMail, qProgressKey, characterRouteWork, gateRouteDays, hyunjaeDay31Preview, qAlbumClues, qDays, qEndingCopy, qLetters, qSceneSpeakers, readQProgress } from "./routeWork";
import { SceneDialogue } from "./SceneDialogue";
import { HogwartsEnding } from "./HogwartsEnding";
import { MaraudersMap } from "./MaraudersMap";
import dateOptions from "../../stories/template/hogwarts-dates.json";
import { affinityKey, characterStatus, HogwartsCharacters, jealousyKey } from "./HogwartsCharacters";
import { dailyLessons, HogwartsSchedule } from "./HogwartsSchedule";
import { MagicalShops, useWeeklyAllowance, spendGalleons, giftAffinity, savedGiftAffinity } from "./MagicalShops";
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

// Entries are the places named in the route, not an inferred daily timetable.
const hyunjaeEncounterPlaces: Partial<Record<number, string>> = {
  1: "魔法史", 3: "城堡楼梯", 4: "图书馆", 6: "庭院与拱门", 7: "长廊", 8: "大礼堂",
  9: "长廊", 11: "大礼堂", 16: "城堡楼梯", 18: "门厅",
  22: "大礼堂", 24: "大礼堂", 25: "大礼堂", 26: "城堡楼梯",
  27: "大礼堂", 28: "庭院与拱门", 31: "长廊",
};

type Props = { previewDay?: number; onRestart: () => void; work: Work; contacts: readonly { id: string; name: string; house: string; year: number }[]; identity?: { name: string; house: string; year: number; loveInterest: string; avatar?: string; runId?: string } | null };
export function HogwartsDevice({ work: original, identity, contacts, onRestart, previewDay }: Props) {
  const selectedLeadId = identity?.loveInterest ?? "hyunjae";
  const dateRoute = routeDateContent[selectedLeadId];
  const dateScenes = dateRoute?.venues ?? {};
  const isQ = selectedLeadId === "q";
  const hyunjaePreview = selectedLeadId === "hyunjae" && previewDay === sharedRules.confessionDay;
  const qStorageKey = qProgressKey(identity);
  const identityKey = previewDay ? `review-${selectedLeadId}-day${previewDay}` : identity ? identity.runId ?? [identity.name, identity.house, identity.year].join("-") : "";
  const [restoredQ] = useState(() => previewDay && isQ ? qDayPreviewProgress(original, previewDay) : readQProgress(qStorageKey));
  const [qChoiceHistory, setQChoiceHistory] = useState(() => isQ ? restoredQ.choices : []);
  const [qReadDays, setQReadDays] = useState(() => isQ ? restoredQ.readDays : []);
  const startingAffinity = characterStatus(selectedLeadId, identity?.year ?? 5, identity?.house ?? "", {}).affinity;
  const legacyFriends = isQ && restoredQ.choices.includes("q-ending-friends");
  const route = useMemo(() => characterRouteWork(original, selectedLeadId, startingAffinity, legacyFriends),
    [original, selectedLeadId, startingAffinity, legacyFriends]);
  const work = useMemo(() => gateRouteDays(route), [route]);
  const [state, setState] = useState<Runtime>(() => {
    const initial = initialRuntime(work);
    initial.variables.hyunjae_player_house = identity?.house ?? "unspecified";
    initial.variables.hyunjae_player_year = identity?.year ?? 5;
    // Gifts must be in the score before replay reaches the ending gate.
    if (isQ && !previewDay) initial.variables.q_affection = Math.min(100, savedGiftAffinity(identityKey, "q"));
    if (hyunjaePreview) return hyunjaeDay31Preview(work, initial);
    let runtime = dispatch(work, initial, "start");
    if (isQ) {
      for (const target of restoredQ.choices) runtime = choose(work, runtime, target);
      runtime.variables.q_mail_unlocked = restoredQ.mailUnlocked;
      if (restoredQ.jealousy !== undefined) runtime.variables.q_jealousy = restoredQ.jealousy;
    }
    return runtime;
  });
  const [relationshipNotice, setRelationshipNotice] = useState("");
  useEffect(() => {
    if (!relationshipNotice) return;
    const timer = window.setTimeout(() => setRelationshipNotice(""), sharedRules.relationshipNoticeMs);
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
  const albumStorageKey = albumNoticeKey(identity);
  const [restoredAlbum] = useState(() => hyunjaePreview
    ? { acknowledged: ["photo-snow", "photo-ball-mistletoe"], completedDays: [] }
    : readAlbumNotices(albumStorageKey));
  const [completedSceneDays, setCompletedSceneDays] = useState<number[]>(() => [...new Set([
    ...restoredAlbum.completedDays, ...(isQ ? restoredQ.readDays : []),
  ])]);
  const [acknowledgedClues, setAcknowledgedClues] = useState<string[]>(() => [...new Set([
    ...restoredAlbum.acknowledged, ...(isQ ? restoredQ.acknowledgedClues : []),
  ])]);
  const [matchStep, setMatchStep] = useState<"bet" | "ready" | "result" | "pub" | "buy" | "stay" | "done">(() => isQ ? restoredQ.match?.step ?? "bet" : "bet");
  const [team, setTeam] = useState(() => isQ ? restoredQ.match?.team ?? "" : "");
  const [stake, setStake] = useState(() => isQ ? restoredQ.match?.stake ?? 1 : 1);
  const [matchError, setMatchError] = useState("");
  const [matchDialog, setMatchDialog] = useState(false);
  const [matchConversation, setMatchConversation] = useState<"intro" | "reaction" | undefined>(() => previewDay === 12 ? "intro" : isQ ? restoredQ.match?.conversation : undefined);
  const [matchIntroRead, setMatchIntroRead] = useState(false);
  const [visitedMatchPub, setVisitedMatchPub] = useState(() => isQ && restoredQ.match?.visitedPub === true);
  const [mailRead, setMailRead] = useState<Record<string, number>>(() => isQ ? restoredQ.mailRead ?? {} : {});
  const won = team === "斯莱特林";
  const [sceneOpen, setSceneOpen] = useState(Boolean(previewDay && previewDay !== 12));
  const [seenScene, setSeenScene] = useState(() => isQ && restoredQ.readDays.includes(new Date(`${state.date}T12:00:00Z`).getUTCDate()) ? state.messages.scene?.at(-1)?.id ?? "" : "");
  const entries = (state.messages[isQ ? "scene" : "owlpost"] ?? []).filter(item => !item.hidden);
  const date = new Date((state.date || "2026-12-01") + "T12:00:00Z");
  const day = date.getUTCDate();
  const availableDateDays = sharedDateDays(day);

  const nextDay = state.choices.find(choice =>
    work.nodes.find(node => node.id === choice.target)?.actions.some(action =>
      action.type === "date" && String(action.value) > (state.date || "")));
  const startTime = sharedRules.dayStartTime;
  const [lessonTime, setLessonTime] = useState<string | undefined>(() => isQ ? restoredQ.time : hyunjaePreview ? "23:45" : undefined);
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
  const authoredLines = (lines: readonly string[]) => lines.map((part, index) => {
    const line = part.match(/^([^：:]{1,30})[：:](.+)$/);
    return line && qSceneSpeakers.has(line[1])
      ? note(line[1] === "你" ? identity?.name ?? "我" : line[1], line[2], line[1] === "你", index)
      : <p key={index} className="hogwarts-narration">{highlightMistletoe(part)}</p>;
  });
  const matchLine = (key: MatchLine, outgoing: boolean) => {
    const text = routeMatchContent[selectedLeadId]?.[key];
    return text ? note(outgoing ? identity?.name ?? "我" : contacts.find(contact => contact.id === selectedLeadId)?.name ?? "", text, outgoing) : null;
  };
  const finalMemoryId = "photo-new-year";
  const finalSceneRead = day === sharedRules.confessionDay && state.endings.length > 0
    && (isQ ? qReadDays : completedSceneDays).includes(day);
  const finalMemoryAcknowledged = acknowledgedClues.includes(finalMemoryId);
  const [finished, setFinished] = useState(isQ && finalSceneRead && finalMemoryAcknowledged);
  const finalMemoryOpen = finalSceneRead && !sceneOpen && !finalMemoryAcknowledged;
  const [showEnding, setShowEnding] = useState(!restoredQ.reviewingEnding);
  const sharedEnding = state.endings.includes(`${selectedLeadId}-together`) ? {
    kind: "together" as const, title: "恋人结局 · 雪停之前", text: "他在石拱门下牵住了你的手。你们谁都没催着走。等窗外的雪停下来，你才发现，刚才还冻得发僵的那只手，已经暖了。",
    memory: "再经过那道石拱门时，他看见了槲寄生，这次什么也没说，只是牵住了你的手。",
  } : state.endings.includes(`${selectedLeadId}-friends`) ? {
    kind: "friends" as const, title: "朋友结局 · 窗边那个位置", text: "把话说开以后，你们还是并肩走了回去。快到楼梯口，他问下次去三把扫帚还给不给他留位置。你说：「留啊。但窗边那个归我。」他笑了：「我就知道。」",
    memory: "雪落在长廊外，你们说好下次去三把扫帚，还是坐窗边。",
  } : {
    kind: "unspoken" as const, title: "暧昧结局 · 明年第一个", text: "走到长廊尽头，你们就该往不同的方向走了。他多站了一会儿，说：「明年我还是想第一个来找你。」你说：「那你得来早点。」",
    memory: "长廊里很安静，他说，明年还是想第一个来找你。",
  };
  const ending = isQ ? { kind: sharedEnding.kind, ...qEndingCopy(sharedEnding.kind) } : sharedEnding;
  const finalMemory = {
    id: finalMemoryId,
    title: isQ ? "西廊窗边" : "跨年长廊",
    body: ending.memory,
    unlocked: finalSceneRead,
  };
  const [attended, setAttended] = useState<Record<string, boolean>>(() => isQ
    ? restoredQ.legacy && identity
      ? Object.fromEntries(dailyLessons(identity.year, identity.house, 1).map(lesson => [[1, lesson.time, lesson.subject].join("-"), true]))
      : restoredQ.attended : {});
  const lead = contacts.find(contact => contact.id === identity?.loveInterest);
  const sameHouse = lead?.house === identity?.house;
  const sameYear = lead?.year === identity?.year;
  const journalIntro = sameHouse
    ? sameYear ? "你们平时一起上课，偶尔会聊几句作业。老师说下节课要换教室时，你还问过他该往哪边走。"
      : "你常在公共休息室看见他。偶尔有人问壁炉旁还有没有空位，你们会搭上一两句话。"
    : sameYear ? "你知道他和你同年级。有时两院的课排在一起，你会在教室里见到他。"
      : "你见过他几次。大多是在门厅或楼梯上，擦肩就过去了。";
  useWeeklyAllowance(finished ? "" : identityKey, day);
  // The authored route stores both channels in owlpost. Keep the original text
  // and mark which opening scenes are delivered by owl.
  const owlDays = sharedRules.owlPostDays;
  const delivery = state.variables.story_delivery;
  const hyunjaeSnowDay = selectedLeadId === "hyunjae" && day === sharedRules.firstSnowDay;
  const owlToday = isQ ? delivery === "mail" : hyunjaeSnowDay ? delivery !== "scene" : owlDays.includes(day);
  const qToday = qDays.find(entry => entry.day === day);
  const sceneTime = isQ ? String(state.variables.scene_time ?? "17:00") : undefined;
  const qMailStage = qToday?.stages.find(stage => stage.channel === "mail");
  const mailArrived = !isQ || !qMailStage || (lessonTime ?? startTime) >= qMailStage.time;
  const qMatch = qToday?.match;
  const waitingToMeet = isQ && delivery === "travel";
  let entryDay = 1;
  const conversation = entries.map(entry => {
    const heading = entry.body.match(/^12月(\d+)日｜/);
    if (heading) entryDay = Number(heading[1]);
    return { ...entry, day: entryDay, body: entry.body.replace(/^12月\d+日｜/, "") };
  });
  const isHyunjaeLetterDay = (date: number) => date === 2 || date === 5;
  const isNote = (body: string) =>
    body.split("\n").every(line => /^(李贤在|你)[：:]/.test(line));
  const [extraMail, setExtraMail] = useState<{ recipient: string; body: string; outgoing: boolean; day: number; order: number }[]>(() => isQ ? restoredQ.extraMail : []);
  const addMail = (recipient: string, body: string, outgoing: boolean) =>
    setExtraMail(previous => [...previous, { recipient, body, outgoing, day, order: entries.length + thread(recipient).length }]);
  const thread = (contact: string): { body: string; outgoing: boolean; narration?: boolean; day: number; order: number }[] => [
    ...(isQ && contact === selectedLeadId ? qLetters(state.messages.owlpost ?? []).filter(entry => entry.day !== day || mailArrived) : []),
    ...conversation.flatMap((entry, order) => {
      if (isQ || contact !== "hyunjae") return [];
      const authoredLetter = entry.body.startsWith("来信｜");
      if (authoredLetter && entry.day === day && !hyunjaeSnowDay && !completedSceneDays.includes(day)) return [];
      if (!authoredLetter && !owlDays.includes(entry.day)) return [];
      if (authoredLetter || isHyunjaeLetterDay(entry.day)) return entry.body.replace(/^来信｜/, "").split("\n").map((line, index) => ({
        body: line.replace(/^(李贤在|你)[：:]/, ""),
        outgoing: /^你[：:]/.test(line),
        narration: !/^(李贤在|你)[：:]/.test(line),
        day: entry.day, order: order + index / (entry.body.length + 1),
      }));
      return isNote(entry.body)
        ? entry.body.split(/(?<=[；;。！？?！]|\s)(?=(?:李贤在|你)[：:])/).map(line => ({
          body: line.replace(/^(李贤在|你)[：:]/, "").replace(/[；;]$/, ""),
          outgoing: /^你[：:]/.test(line), day: entry.day, order: order + .5,
        })) : [];
    }),
    ...extraMail.filter(entry => entry.recipient === contact),
  ].sort((a, b) => a.day - b.day || a.order - b.order);
  const currentThread = thread(recipient);
  const unreadMail = (contact: string) => Math.max(0, thread(contact).filter(entry => !entry.outgoing && !entry.narration).length - (mailRead[contact] ?? 0));
  useEffect(() => {
    if (active !== "owlpost" || !recipient) return;
    const count = currentThread.filter(entry => !entry.outgoing && !entry.narration).length;
    setMailRead(previous => previous[recipient] === count ? previous : { ...previous, [recipient]: count });
  }, [active, recipient, currentThread.length]);
  const scenes = conversation.filter(entry => entry.day === day && (isQ || !entry.body.startsWith("来信｜")) && (!owlToday || ((isQ || (!hyunjaeSnowDay && !isHyunjaeLetterDay(day))) && !isNote(entry.body))))
    .map((entry, index) => selectedLeadId === "hyunjae" && day === 18 && index === 0 ? { ...entry, body: state.variables.hyunjae_day17_choice === "a"
      ? "门厅里，李贤在手里捏着一张折好的羊皮纸。\n李贤在：你圣诞假期回家吗？\n你：不回啊，我还没逛够呢。你呢？\n李贤在：我也留。那今年城堡应该不会太无聊了。\n你：哦？我还有这本事？\n李贤在：因为你也在啊。"
      : "门厅里，李贤在手里捏着一张折好的羊皮纸。\n李贤在：你圣诞假期回家吗？\n你：不回啊，我还没逛够呢。你呢？\n李贤在：我也留。对了，昨天忘了问你。二十四号舞会，你有约了吗？\n你：还没。怎么，你要排队啊？\n李贤在：那要不要一起？\n你：好啊，那你排第一个。\n李贤在：那天我在大礼堂门口等你。"
    } : selectedLeadId === "hyunjae" && day === 18 && entry.body.startsWith("你：我留校啊，城堡想赶我也来不及了。") ? { ...entry, body: "你：我留校啊，城堡想赶我也来不及了。\n李贤在：那晚别站得离我太远。我怕第一支舞都跳完了，你还在甜点桌那边。" }
      : entry);
  const matchScenes = selectedLeadId === "hyunjae" && day === sharedRules.quidditchDay
    ? scenes.map((entry, index) => index === 0 && entry.body.includes("比赛开始后")
      ? { ...entry, body: entry.body.slice(entry.body.indexOf("比赛开始后")) } : entry) : scenes;
  const encounterReached = sceneOpen || Boolean(seenScene && scenes.some(entry => entry.id === seenScene));
  const encounterPlaces: Partial<Record<number, string>> = selectedLeadId === "hyunjae" ? hyunjaeEncounterPlaces : {};
  const storyPlace = encounterReached ? isQ ? String(state.variables.scene_place ?? "图书馆") : encounterPlaces[day] : undefined;
  // Public match locations take precedence over personal route encounters.
  const mapPlace = day === sharedRules.quidditchDay ? (visitedMatchPub ? "三把扫帚" : matchStep === "result" ? "回城堡的路上"
      : matchStep === "pub" ? "霍格沃茨城堡" : matchStep === "ready" || matchDialog ? "魁地奇球场" : undefined)
    : attendedDates.includes(day) ? (acceptedVenues[day] === "diagon-alley-walk" ? "丽痕书店" : plans[day])
    : isQ ? storyPlace    : day === sharedRules.firstSnowDay && state.variables.hyunjae_first_snow_together === true ? "庭院与拱门"
    : day === 17 && ["a", "b"].includes(String(state.variables.hyunjae_day17_choice)) ? "大礼堂"
    : day === sharedRules.ballDay && ["a", "b"].includes(String(state.variables.hyunjae_day24_choice)) ? "长廊"
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
      unlocked: albumSceneRead(day, sharedRules.firstSnowDay, completedSceneDays) && state.variables.hyunjae_first_snow_together === true,
    },
    {
      id: "photo-ball-mistletoe",
      title: "舞会后的石拱门",
      body: "舞会散场后，他在石拱门下放慢脚步，抬头看了一眼槲寄生，又看向你。",
      unlocked: albumSceneRead(day, sharedRules.ballDay, completedSceneDays) && state.variables.hyunjae_day24_choice === "a",
    },
  ].filter(clue => selectedLeadId === "hyunjae" && clue.unlocked)
    .concat(isQ ? qAlbumClues(qReadDays, state.completed) : [], finalMemory.unlocked ? [finalMemory] : []);
  // Let story dialogs finish first, then announce each new entry in album order.
  const pendingClue = nextAlbumNotice(albumClues.filter(clue => clue.id !== finalMemory.id), acknowledgedClues,
    Boolean(sceneOpen || matchDialog || matchConversation || dateReply || outing || destination || finalMemoryOpen || finished));
  useEffect(() => {
    if (previewDay) return;
    saveAlbumNotices(albumStorageKey, { acknowledged: acknowledgedClues, completedDays: completedSceneDays });
  }, [albumStorageKey, acknowledgedClues, completedSceneDays, previewDay]);
  const acknowledgeClue = (id: string) =>
    setAcknowledgedClues(previous => previous.includes(id) ? previous : [...previous, id]);
  const chosen = modules.find(m => m.id === active) ?? modules[0];
  const choices = !nextDay && state.choices.length > 0 ? <div className="hogwarts-device-choices">

    {state.choices.map(choice => <button key={choice.target} onClick={() => select(choice.target)}>{choice.label}</button>)}
  </div> : null;
  const select = (target: string) => {
    if (finished) return;
    const next = choose(work, state, target);
    if (isQ) {
      setQChoiceHistory(previous => [...previous, target]);
      if (sceneOpen && next.variables.scene_time !== state.variables.scene_time)
        setLessonTime(String(next.variables.scene_time));
    }
    if (target === "hy-day10-a" || target === "hy-day10-b") {
      next.variables.hyunjae_jealousy = Math.min(100, relationship("hyunjae", state).jealousy + (target.endsWith("-a") ? 3 : 1));
    }
    showRelationshipChange(identity?.loveInterest ?? "hyunjae", state, next);
    setState(next);
    if (hyunjaeSnowDay && delivery === "travel" && next.variables.story_delivery === "scene") {
      setActive("calendar");
      setSceneOpen(true);
    } else if (!isQ && !hyunjaeSnowDay && !isHyunjaeLetterDay(day) && owlToday && next.date === state.date && (next.messages.owlpost ?? []).slice((state.messages.owlpost ?? []).length).some(entry => !isNote(entry.body))) {
      setSceneOpen(true);
    }
  };
  function finishScene() {
    setSeenScene(scenes[scenes.length - 1]?.id ?? "");
    setSceneOpen(false);
    setCompletedSceneDays(previous => previous.includes(day) ? previous : [...previous, day]);
    if (isQ && state.variables.q_day1_complete === true && state.variables.q_mail_unlocked !== true) {
      setState(previous => ({ ...previous, variables: { ...previous.variables, q_mail_unlocked: true } }));
      setExtraMail(previous => [...previous, ...qFirstDayMail]);
      setLessonTime("20:00");

    }
    if (isQ) {
      setQReadDays(previous => previous.includes(day) ? previous : [...previous, day]);
      const endTime = qToday?.stages.filter(stage => stage.channel === "scene").at(-1)?.endTime;
      if (endTime) setLessonTime(endTime);
    }
    if (day === sharedRules.confessionDay && state.endings.length) {
      setActive("calendar");
      if (finalMemoryAcknowledged) setFinished(true);
    }
    if (day === sharedRules.quidditchDay) { setMatchStep("result"); setMatchDialog(true); }
  }
  useEffect(() => {
    if (!isQ || previewDay) return;
    try {
      localStorage.setItem(qStorageKey, JSON.stringify({
        version: 2, choices: qChoiceHistory, readDays: qReadDays, attended,
        time: lessonTime ?? startTime, extraMail, acknowledgedClues, mailUnlocked: state.variables.q_mail_unlocked === true,
        jealousy: state.variables.q_jealousy, reviewingEnding: finished && !showEnding,
        match: { step: matchStep, team, stake, visitedPub: visitedMatchPub, conversation: matchConversation }, mailRead,
      }));
    } catch { setRelationshipNotice("这次进度没能保存在浏览器中，刷新后可能需要重新阅读。"); }
  }, [isQ, qStorageKey, qChoiceHistory, qReadDays, attended, lessonTime, startTime, extraMail, acknowledgedClues,
    state.variables.q_mail_unlocked, state.variables.q_jealousy, matchStep, team, stake, visitedMatchPub, mailRead, matchConversation, finished, showEnding, previewDay]);
  function openScene() {
    if (finished) return;
    if (day === sharedRules.quidditchDay) {
      setLessonTime("14:00");
      if (matchStep === "bet") { setMatchConversation("intro"); return; }
      if (matchConversation === "reaction") return;
    }
    resumeStoryScene();
  }
  function resumeStoryScene() {
    setMatchConversation(undefined);
    if (waitingToMeet && state.choices[0]) select(state.choices[0].target);
    if (isQ) setLessonTime(qToday?.stages.find(stage => stage.channel === "scene")?.time ?? sceneTime);
    else if (day === sharedRules.quidditchDay) setLessonTime("14:00");
    setSceneOpen(true);
  }
  if (finished && showEnding) {
    const character = contacts.find(contact => contact.id === selectedLeadId) ?? { id: "hyunjae", name: "李贤在" };
    const stats = relationship(character.id, state);
    return <HogwartsEnding kind={ending.kind} title={ending.title} text={ending.text} character={character}
      affinity={stats.affinity} jealousy={stats.jealousy} onRestart={onRestart} onBack={() => { setActive("calendar"); setShowEnding(false); }} />;
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
              <span className="hogwarts-contact-copy"><strong>{contact.name}</strong>{unreadMail(contact.id) > 0 && <span aria-label="有未读来信"> · 新来信</span>}<small>{
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
            {message.narration ? <p className="hogwarts-narration">{message.body}</p> : note(message.outgoing ? identity?.name ?? "我" : contacts.find(contact => contact.id === recipient)?.name ?? "", message.body, message.outgoing)}
          </div>)}
          {recipient === selectedLeadId && owlToday && mailArrived && <>{choices}{!sceneOpen && relationshipHint}</>}
          {!finished && <form onSubmit={event => {
            event.preventDefault();
            if (!draft.trim()) return;
            addMail(recipient, draft.trim(), true);
            setDraft("");
          }}>
            <input aria-label="纸条内容" value={draft} onChange={event => setDraft(event.target.value)} maxLength={sharedRules.messageMaxLength} />
            <button disabled={!draft.trim()}>寄出纸条</button>
          </form>}
          </>}
        </section> : active === "calendar" && identity ? <section>
          {isQ && owlToday && qMailStage && <button className="hogwarts-activity"
            disabled={finished || (!mailArrived && dailyLessons(identity.year, identity.house, day).filter(lesson => lesson.time < qMailStage.time).some(lesson => !attended[[day, lesson.time, lesson.subject].join("-")]))}
            onClick={() => { if (!mailArrived) setLessonTime(qMailStage.time); setRecipient("q"); setActive("owlpost"); }}>
            {mailArrived ? "查看池昌民的来信" : `${qMailStage.time} 午餐 · 查看池昌民的来信`}
          </button>}
          <HogwartsSchedule readOnly={finished} year={identity.year} house={identity.house} day={day} interaction={owlToday ? "猫头鹰信箱" : undefined}
            sceneLabel={isQ ? qToday?.label ?? "傍晚 · 去图书馆找池昌民" : {3: "晚上下楼", 4: "去图书馆", 12: matchStep === "ready" ? "14:00 看魁地奇比赛" : `去看台找${lead?.name ?? ""}`, [sharedRules.confessionDay]: "夜里 · 去长廊"}[day]}
            onScene={(!finalSceneRead || finished) && !owlToday && (scenes.length > 0 || waitingToMeet) && !nextDay ? () => {
              openScene();
            } : undefined}
            attended={attended} onAttend={(id, time, last) => {
              setAttended(previous => ({ ...previous, [id]: true }));
              setLessonTime(isQ && day === 1 && last ? "17:00" : time);
              if (last && !sharedRules.manualSceneDays.includes(day) && !owlToday && scenes.length > 0 && !nextDay) {
                openScene();
              }
            }}
            onEnd={!previewDay && nextDay && (day !== sharedRules.quidditchDay || matchStep === "done") && (!scenes.length || seenScene === scenes[scenes.length - 1]?.id) ? () => { select(nextDay.target); setLessonTime(sharedRules.dayStartTime); setSeenScene(""); setDestination(undefined); } : undefined} />
          {isQ && day === 1 && state.variables.q_mail_unlocked === true && <p><button onClick={() => { setActive("owlpost"); setRecipient("q"); }}>查看池昌民的来信</button></p>}
          {owlToday && !nextDay && <button disabled={finished} onClick={() => { setRecipient(selectedLeadId); setActive("owlpost"); }}>{day === sharedRules.firstSnowDay ? `查看${lead?.name ?? ""}的新纸条` : "打开猫头鹰信箱"}</button>}
          {isHoliday(day) && <section aria-label="假期自由活动">
            <h3>自由活动</h3>
            {freeTimeScenes.map(scene => <button className="hogwarts-activity" type="button" key={scene.place} disabled={finished}
              onClick={() => { setFreeTimeResult(""); setDestination(scene); }}>{scene.place}</button>)}
          </section>}
          {plans[day] && <p>今日约会：{plans[day]} <button className="hogwarts-activity" disabled={finished || attendedDates.includes(day)} onClick={() => setOuting(true)}>{attendedDates.includes(day) ? "已赴约" : "去赴约"}</button></p>}
          {day === sharedRules.quidditchDay && matchStep === "pub" && <button className="hogwarts-activity" disabled={finished} onClick={() => { setVisitedMatchPub(true); setMatchDialog(true); }}>和{lead?.name}去三把扫帚</button>}
          {selectedLeadId !== "hyunjae" && !isQ && <p>这条路线的正文还在写作中。</p>}
          {finished && <button className="hogwarts-activity" type="button" onClick={() => setShowEnding(true)}>查看结局</button>}
        </section> : active === "date" ? <section className="hogwarts-date">
          <p>周末与假期约会</p>
          <label>约谁见面 <select disabled={finished} value={dateContact} onChange={event => setDateContact(event.target.value)}>
            <option value="">选择一位朋友</option>
            {contacts.filter(contact => contact.id === identity?.loveInterest).map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select></label>
          <p><label>约会日期 <select disabled={finished} value={availableDateDays.includes(dateDay) ? dateDay : 0} onChange={event => setDateDay(Number(event.target.value))}>
            <option value={0}>选择日期</option>
            {availableDateDays.map(value => <option key={value} value={value} disabled={Boolean(plans[value])}>12月{value}日</option>)}
          </select></label></p>
          <p><label>去哪里 <select disabled={finished} value={dateVenue} onChange={event => setDateVenue(event.target.value)}>
            <option value="">选择地点</option>
            {dateOptions.venues.map(venue => <option key={venue.id} value={venue.id}
>
              {venue.name}（{venue.region}）
            </option>)}
          </select></label></p>
          <button className="hogwarts-send-invite" disabled={finished || dateContact !== selectedLeadId || !dateScenes[dateVenue] || Boolean(plans[dateDay]) || !availableDateDays.includes(dateDay)}
            onClick={() => {
              const accepted = dateContact === selectedLeadId && acceptsInvitation(relationship(selectedLeadId, state).affinity);
              const reply = accepted ? dateScenes[dateVenue].reply : dateRoute.declines[(day - 1) % dateRoute.declines.length];
              const venue = dateOptions.venues.find(item => item.id === dateVenue);
              if (accepted) {
                setPlans(previous => ({ ...previous, [dateDay]: (lead?.name ?? "") + " · " + venue?.name }));
                setAcceptedVenues(previous => ({ ...previous, [dateDay]: dateVenue }));
              }
              addMail(selectedLeadId, "邀约：12月" + dateDay + "日 · " + venue?.name, true);
              addMail(selectedLeadId, reply, false);
              setDateReply(reply);
            }}>发送邀请</button>
          {dateContact && !dateRoute && <p>这位角色的邀约剧情还在准备中。</p>}
          <p className="hogwarts-date-hint">每天都能发邀请，赴约日期可选周末或12月22日起的假期。</p>
          {Object.entries(plans).filter(([value]) => Number(value) >= day).map(([value, plan]) => <p key={value}>12月{value}日 · {plan}</p>)}
        </section> : active === "market" && identity ? <MagicalShops readOnly={finished} identityKey={identityKey} leadId={identity.loveInterest} contacts={contacts} onGift={(recipient, item, liked) => {
            const leadId = identity.loveInterest;
            const affection = relationship(leadId, state).affinity;
            const key = affinityKey(recipient);
            const variables = { ...state.variables,
              [key]: Math.min(100, Number(state.variables[key] ?? state.variables["friendship_" + recipient] ?? 0) + giftAffinity(liked)),
            };
            const jealous = recipient !== leadId && affection > sharedRules.giftJealousyAffinity;
            if (jealous) variables[jealousyKey(leadId)] = Math.min(100, relationship(leadId, state).jealousy + (affection >= sharedRules.strongJealousyAffinity ? 5 : 3));
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
                addMail("hyunjae", affection >= sharedRules.strongJealousyAffinity
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
              onEncounter={!finished && isQ && identity && dailyLessons(identity.year, identity.house, day).every(lesson => attended[[day, lesson.time, lesson.subject].join("-")]) && (waitingToMeet || (sceneTime && (lessonTime ?? startTime) >= sceneTime)) ? openScene : undefined} />
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
        <h2>{outing ? plans[day] : `${lead?.name ?? ""}的猫头鹰回信`}</h2>
        <SceneDialogue key={outing ? `outing-${day}-${acceptedVenues[day]}` : "mail"}>
        {outing ? dateScenes[acceptedVenues[day]]?.scene.map((line, index) => index === 0
          ? <p key={index} className="hogwarts-narration">{line}</p>
          : note(index === 2 ? identity?.name ?? "我" : lead?.name ?? "", line, index === 2, index))
          : <div className="date-mail-reply">{note(lead?.name ?? "", dateReply, false)}</div>}
        <button onClick={() => { if (outing) setAttendedDates(previous => [...previous, day]); setDateReply(""); setOuting(false); }}>{outing ? "完成赴约" : "返回"}</button>
        </SceneDialogue>
      </dialog>}
      {matchConversation && !matchDialog && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="match-conversation-title">
        <h2 id="match-conversation-title">{lead?.name ?? "比赛日"}</h2>
        <SceneDialogue key={`match-conversation-${matchConversation}`}>
          {matchConversation === "intro" ? <>
            {!matchIntroRead && <>
              {isQ && qMatch ? authoredLines(qMatch.opening) : <>
                {selectedLeadId === "hyunjae" && <>
                  <p className="hogwarts-narration">早餐的大礼堂比平时吵得多。</p>
                  <p className="hogwarts-narration">李贤在忙完级长的事，在看台上找到你。</p>
                </>}
                {matchLine("opening", false)}
              </>}
              <p className="hogwarts-narration">一张羊皮纸飘到你面前，落款是弗雷德和乔治。</p>
            </>}
            {matchIntroRead && <p className="hogwarts-narration">你将羊皮纸折好，暂时放在手边。</p>}
            <button onClick={() => { setMatchIntroRead(true); setMatchConversation(undefined); setMatchDialog(true); }}>展开羊皮纸</button>
          </> : <>
            {isQ && qMatch && authoredLines(team === "格兰芬多" ? qMatch.gryffindor : qMatch.slytherin)}
            <button onClick={resumeStoryScene}>继续看比赛</button>
          </>}
        </SceneDialogue>
      </dialog>}
      {matchDialog && matchStep === "bet" && <QuidditchPaper team={team} stake={stake} error={matchError}
        onTeam={setTeam} onStake={setStake}
        onReturn={() => { setMatchError(""); setMatchDialog(false); setMatchConversation("intro"); }}
        onSubmit={() => {
          if (!spendGalleons(identityKey, stake)) { setMatchError("钱包里的加隆不够。"); return; }
          setMatchError(""); setMatchStep("ready"); setMatchDialog(false);
          if (isQ && qMatch) setMatchConversation("reaction");
          else resumeStoryScene();
        }} />}
      {matchDialog && matchStep === "result" && <QuidditchResult won={won} stake={stake}
        onContinue={() => { setMatchStep("pub"); setMatchDialog(false); }} />}
      {matchDialog && !["bet", "result"].includes(matchStep) && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="match-pub-title">
          <h2 id="match-pub-title">三把扫帚</h2>
          <SceneDialogue key="match-pub">
          <p className="hogwarts-narration">斯莱特林那桌还在复盘最后一球。{selectedLeadId === "hyunjae" ? "李贤在找到一张靠窗的小桌，把里面的位置留给你。" : ""}</p>
          {won ? <>
            <p className="hogwarts-narration">斯莱特林那桌给你送来一杯黄油啤酒。{selectedLeadId === "hyunjae" ? "他也给自己点了一杯。" : ""}</p>
            {isQ && qMatch && authoredLines(qMatch.won)}
            {matchLine("wonConcern", false)}
            {matchLine("wonPlayerReply", true)}
            {matchLine("wonTease", false)}
          </> : <>
            {isQ && qMatch && authoredLines(qMatch.lost)}
            {matchLine("lossConcern", false)}
            {matchLine("lossPlayerReply", true)}
            {matchLine("lossDrink", false)}
            {matchStep === "pub" && <>
              <button onClick={() => { if (spendGalleons(identityKey, sharedRules.matchDrinkPrice)) { setMatchError(""); setMatchStep("buy"); } else setMatchError("钱包里的加隆不够。"); }}>自己买一杯 · 5 加隆</button>
              <button onClick={() => { setMatchError(""); setMatchStep("stay"); }}>陪他坐一会儿</button>
            </>}
            {matchStep === "buy" && <div data-scene-segment="match-pub-buy">
              {matchLine("buyPlayerReply", true)}
              <p className="hogwarts-narration">{selectedLeadId === "hyunjae" ? "两杯黄油啤酒端上来，他拿自己的杯子碰了碰你的。" : "黄油啤酒端上来了。"}</p>
              {matchLine("buyToast", false)}
              {matchLine("buyPlayerQuestion", true)}
              {matchLine("buyAnswer", false)}
            </div>}
            {matchStep === "stay" && <div data-scene-segment="match-pub-stay">
              {matchLine("stayPlayerReply", true)}
              <p className="hogwarts-narration">{selectedLeadId === "hyunjae" ? "他把杯子往自己那边挪了挪，给你腾出放围巾的地方。" : "你在桌旁坐下来。"}</p>
              {matchLine("stayAnswer", false)}
              {matchLine("stayPlayerQuestion", true)}
              {matchLine("stayTease", false)}
              <p className="hogwarts-narration">斯莱特林那桌又敲了一下杯子。{selectedLeadId === "hyunjae" ? "你们对视一眼，都笑了。" : ""}</p>
            </div>}
          </>}
          {isQ && qMatch && (won || matchStep !== "pub") && authoredLines(qMatch.closing)}
          {(won || matchStep !== "pub") && <button onClick={() => { setMatchStep("done"); setMatchDialog(false); }}>返回今日行程</button>}
          </SceneDialogue>
        {matchError && <p role="alert">{matchError}</p>}
      </dialog>}
      {finalMemoryOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onCancel={event => event.preventDefault()} className="hogwarts-scene hogwarts-clue" aria-labelledby="final-memory-title">
        <h2 id="final-memory-title">魔法相册解锁新内容</h2>
        <p>{finalMemory.title}</p>
        <p className="hogwarts-narration">{highlightMistletoe(finalMemory.body)}</p>
        <button type="button" onClick={() => { acknowledgeClue(finalMemory.id); setFinished(true); setShowEnding(true); }}>查看结局</button>
      </dialog>}
      {pendingClue && <dialog key={pendingClue.id} ref={element => { if (element && !element.open) element.showModal(); }} onCancel={event => event.preventDefault()} className="hogwarts-scene hogwarts-clue" aria-labelledby="album-clue-title">
        <h2 id="album-clue-title">魔法相册解锁新内容</h2><p>在魔法相册中查看「{pendingClue.title}」。</p>
        <button onClick={() => acknowledgeClue(pendingClue.id)}>继续</button>
      </dialog>}
      {sceneOpen && !matchDialog && !matchConversation && <dialog ref={element => { if (element && !element.open) element.showModal(); }} onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="scene-title">
        <h2 id="scene-title">{lead?.name ?? ""} <small>· {selectedLeadId.toUpperCase()}</small></h2>
        <SceneDialogue key={`story-${day}`}>
        {matchScenes.map(scene => <div key={scene.id} data-scene-segment={scene.id}>{scene.body.split("\n").map((part, index) => {
          const line = part.match(/^([^：:]{1,30})[：:](.+)$/);
          const speaker = line?.[1];
          const player = speaker === "你" || speaker === "我" || speaker === identity?.name;
          if (line && (player || contacts.some(contact => contact.name === speaker) || (isQ && qSceneSpeakers.has(speaker ?? "")))) return note(player ? identity?.name ?? "我" : line[1], line[2], player, index);
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
