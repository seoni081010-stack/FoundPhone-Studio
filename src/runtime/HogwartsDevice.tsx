import { HogwartsCharacters } from "./HogwartsCharacters";
import { HogwartsSchedule } from "./HogwartsSchedule";
import { MagicalShops } from "./MagicalShops";
import { useMemo, useState } from "react";
import { BookOpen, Feather, ScrollText, Map, Images, Heart, ArrowLeft, WandSparkles } from "lucide-react";
import { initialRuntime, type Runtime, type Work } from "../schema";
import { dispatch, choose } from "../engine";
import "./HogwartsDevice.css";

const modules = [
  { id: "owlpost", name: "猫头鹰信箱", subtitle: "书信与便笺", Icon: Feather },
  { id: "encounter", name: "当面相遇", subtitle: "今日剧情", Icon: Heart },
  { id: "schoolbook", name: "校园手册", subtitle: "课程与活动", Icon: BookOpen },
  { id: "wizardjournal", name: "巫师手札", subtitle: "私密记录", Icon: ScrollText },
  { id: "magicphotos", name: "魔法相册", subtitle: "会动的回忆", Icon: Images },
  { id: "maraudersmap", name: "活点地图", subtitle: "城堡探索", Icon: Map },
  { id: "calendar", name: "日历", subtitle: "课表与每日进度", Icon: BookOpen },
  { id: "market", name: "魔法商店与古灵阁", subtitle: "购物与金库", Icon: Heart },
] as const;
type Props = { work: Work; identity?: { name: string; house: string; year: number; loveInterest: string } | null };
export function HogwartsDevice({ work: original, identity }: Props) {
  const work = useMemo(() => {
    const boundaries = original.nodes.filter(node => node.actions.some(action =>
      action.type === "date" && /^2026-12-(?!01$)\d{2}$/.test(String(action.value))));
    const gate = (id: string) => "end-day:" + id;
    const ids = new Set(boundaries.map(node => node.id));
    return {
      ...original,
      nodes: [
        ...original.nodes.map(node => ({ ...node, next: node.next.map(id => ids.has(id) ? gate(id) : id) })),
        ...boundaries.map(node => ({ ...node, id: gate(node.id), type: "choice" as const,
          actions: [], conditions: [], next: [node.id] })),
      ],
    };
  }, [original]);
  const [state, setState] = useState<Runtime>(() => { const initial = initialRuntime(work); initial.variables.hyunjae_player_house = identity?.house ?? "unspecified"; initial.variables.hyunjae_player_year = identity?.year ?? 5; return dispatch(work, initial, "start"); });
  const [active, setActive] = useState("owlpost");
  const [opened, setOpened] = useState(false);
  const entries = (state.messages.owlpost ?? []).filter(item => !item.hidden);
  const date = new Date((state.date || "2026-12-01") + "T12:00:00Z");
  const day = date.getUTCDate();
  const nextDay = state.choices.find(choice =>
    work.nodes.find(node => node.id === choice.target)?.actions.some(action =>
      action.type === "date" && String(action.value) > (state.date || "")));
  const [lessonTime, setLessonTime] = useState<string>();
  const [finished, setFinished] = useState(false);
  const [attended, setAttended] = useState<Record<string, boolean>>({});
  const identityKey = identity ? [identity.name, identity.house, identity.year].join("-") : "";
  // The authored route stores both channels in owlpost. Keep the original text
  // and mark which opening scenes are delivered by owl.
  const owlDays = [2, 5, 6, 13, 15, 17, 19, 20, 30];
  const owlToday = owlDays.includes(day);
  let entryDay = 1;
  const conversation = entries.map(entry => {
    const heading = entry.body.match(/^12月(\d+)日｜/);
    if (heading) entryDay = Number(heading[1]);
    return { ...entry, day: entryDay, body: entry.body.replace(/^12月\d+日｜/, "") };
  });
  const isNote = (body: string) =>
    /^(李贤在|你)[：:]/.test(body) &&
    !/你们一起去了大礼堂|李贤在先问|他笑了一下|停了一下，他又说/.test(body);
  const letters = conversation.filter(entry => owlDays.includes(entry.day) && isNote(entry.body));
  const scenes = conversation.filter(entry => entry.day === day && (!owlToday || !isNote(entry.body)));
  const chosen = modules.find(m => m.id === active) ?? modules[0];
  const choices = !nextDay && state.choices.length > 0 ? <div className="hogwarts-device-choices">
    <p>{owlToday ? "写张纸条回复" : "你会怎么回答？"}</p>
    {state.choices.map(choice => <button key={choice.target} onClick={() => select(choice.target)}>{choice.label}</button>)}
  </div> : null;
  const select = (target: string) => {
    setState(previous => choose(work, previous, target));
  };
  return <div className="hogwarts-device-stage">
    <div className="hogwarts-device" aria-label="霍格沃茨魔法卷宗">
      <div className="hogwarts-device-top"><WandSparkles size={17}/><span>12月{day}日 · {new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date)} · D{day}/31</span><span>{lessonTime ?? state.time}</span></div>
      <header className="hogwarts-device-header">
        <div className="hogwarts-device-seal">H</div>
        <div><small>THE ENCHANTED FOLIO</small><h1>霍格沃茨魔法卷宗</h1><p>{identity?.name || "年轻的巫师"} · {state.date || "2026-12-01"}</p></div>
      </header>
      {!opened ? <main className="hogwarts-device-home">
        <p className="hogwarts-device-section">魔法物品</p>
        <div className="hogwarts-device-grid">
          {modules.filter(m => (identity && (m.id === "calendar" || m.id === "market" || m.id === "encounter")) || work.apps.some(a => a.id === m.id && a.installed)).map(m => <button key={m.id} className="hogwarts-device-tile" onClick={() => {setActive(m.id);setOpened(true);}}><span className="hogwarts-device-icon"><m.Icon size={25}/></span><strong>{m.name}</strong><small>{m.subtitle}</small></button>)}
        </div>
        <p className="hogwarts-device-note">羊皮纸会记住你的每一次选择。魔法故事正在继续。</p>
      </main> : <main className="hogwarts-device-page">
        <button className="hogwarts-device-back" onClick={() => setOpened(false)}><ArrowLeft size={17}/> 返回卷宗</button>
        <h2><chosen.Icon size={22}/> {chosen.name}</h2>
        {active === "owlpost" ? <section className="hogwarts-device-letters">
          <h3>李贤在 <small>· 猫头鹰纸条</small></h3>
          {letters.length === 0 && <p>暂时没有新的猫头鹰纸条。</p>}
          {letters.map(letter => <div key={letter.id} className="hogwarts-note-thread">
            <small>12月{letter.day}日</small>
            {letter.body.split(/(?<=[；;。！？?！]|\s)(?=(?:李贤在|你)[：:])/).map((line, index) =>
              <p key={index} className={/^你[：:]/.test(line) ? "hogwarts-note-sent" : "hogwarts-note-received"}>{line}</p>)}
          </div>)}
          {owlToday && choices}
          {owlToday && scenes.length > 0 && <button onClick={() => setActive("encounter")}>查看当面相遇</button>}
        </section> : active === "encounter" ? <section className="hogwarts-device-letters">
          <h3>李贤在 <small>· HYUNJAE</small></h3>
          {scenes.length ? scenes.map(scene => <article className="hogwarts-device-letter" key={scene.id}>{scene.body}</article>) : <p>今天还没有当面剧情。</p>}
          {!owlToday && choices}
          {state.endings.length > 0 && <div className="hogwarts-device-ending">{state.endings.includes("hyunjae-together") ? "✦ 十二月的约定 · 恋人" : "✦ 十二月的约定 · 未说破的喜欢"}</div>}
        </section> : active === "calendar" && identity ? <section>
          <div className="hogwarts-month" aria-label="十二月月历">
            {Array.from({ length: 31 }, (_, index) => <span key={index} aria-current={index + 1 === day ? "date" : undefined}>{index + 1}</span>)}
          </div>
          <HogwartsSchedule year={identity.year} house={identity.house} day={day} interaction={owlToday ? "猫头鹰信箱" : "当面相遇"}
            attended={attended} onAttend={(id, time) => {
              setAttended(previous => ({ ...previous, [id]: true }));
              setLessonTime(time);
            }}
            onEnd={nextDay ? () => { select(nextDay.target); setLessonTime(undefined); } : day === 31 && state.endings.length && !finished ? () => setFinished(true) : undefined} />
          {finished && <p role="status">十二月已结束。</p>}
        </section> : active === "market" && identity ? <MagicalShops identityKey={identityKey} leadId={identity.loveInterest} />
          : <section className="hogwarts-device-letters">{active === "schoolbook" && identity && <details><summary>人物档案</summary><HogwartsCharacters year={identity.year} house={identity.house} identityKey={identityKey} /></details>}{(work.data[active] ?? []).map(item => <article className="hogwarts-device-letter" key={item.id}><strong>{item.title}</strong><p>{item.body}</p>{active === "maraudersmap" && <small>✦ 已标记在活点地图</small>}</article>)}{!(work.data[active] ?? []).length && <p>这页羊皮纸还没有写下新的内容。</p>}</section>}
      </main>}
      <footer className="hogwarts-device-footer"><span>✦</span><span>HOGWARTS SCHOOL OF WITCHCRAFT AND WIZARDRY</span><span>✦</span></footer>
    </div>
  </div>;
}
