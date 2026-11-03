import { HogwartsCharacters } from "./HogwartsCharacters";
import { HogwartsSchedule } from "./HogwartsSchedule";
import { MagicalShops } from "./MagicalShops";
import { useMemo, useState } from "react";
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
  { id: "market", name: "魔法商店与古灵阁", subtitle: "购物与金库", Icon: Heart },
] as const;
type Props = { work: Work; contacts: readonly { id: string; name: string }[]; identity?: { name: string; house: string; year: number; loveInterest: string } | null };
export function HogwartsDevice({ work: original, identity, contacts }: Props) {
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
  const [active, setActive] = useState("calendar");
  const [sceneOpen, setSceneOpen] = useState(false);
  const [seenScene, setSeenScene] = useState("");
  const entries = (state.messages.owlpost ?? []).filter(item => !item.hidden);
  const date = new Date((state.date || "2026-12-01") + "T12:00:00Z");
  const day = date.getUTCDate();
  const nextDay = state.choices.find(choice =>
    work.nodes.find(node => node.id === choice.target)?.actions.some(action =>
      action.type === "date" && String(action.value) > (state.date || "")));
  const [startTime] = useState(() => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [lessonTime, setLessonTime] = useState<string>();
  const [region, setRegion] = useState<number>();
  const [recipient, setRecipient] = useState("");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Record<string, string[]>>({});
  const note = (name: string, body: string, outgoing: boolean, key?: number) =>
    <div key={key} className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}>
      <span className="hogwarts-avatar" aria-hidden="true">{name.slice(-1)}</span>
      <div><strong>{name}</strong><p>{body}</p></div>
    </div>;
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

    {state.choices.map(choice => <button key={choice.target} onClick={() => select(choice.target)}>{choice.label}</button>)}
  </div> : null;
  const select = (target: string) => {
    const next = choose(work, state, target);
    setState(next);
    if (owlToday && next.date === state.date && (next.messages.owlpost ?? []).slice(entries.length).some(entry => !isNote(entry.body))) {
      setSceneOpen(true);
    }
  };
  return <div className="hogwarts-device-stage">
    <div className="hogwarts-device" aria-label="Hogwarts Unspoken">
      <div className="hogwarts-device-top"><span>12月{day}日 · {new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date)} · D{day}/31</span><span>{lessonTime ?? startTime}</span></div>
      <header className="hogwarts-device-header">
        <div className="hogwarts-device-seal">H</div>
        <div><small>HOGWARTS STUDENT</small><h1>Hogwarts Unspoken</h1><p>{identity?.name || "年轻的巫师"} · {state.date || "2026-12-01"}</p></div>
      </header>
      <main className={active === "calendar" ? "hogwarts-device-page hogwarts-today" : "hogwarts-device-page"}>
        {active !== "calendar" && <button className="hogwarts-device-back" onClick={() => setActive("calendar")}><ArrowLeft size={17}/> 今日行程</button>}
        <h2>{active === "calendar" ? <><small>TODAY</small> 今日行程</> : chosen.name}</h2>
        {active === "owlpost" ? <section className="hogwarts-device-letters">
          {!recipient ? <>
            <button onClick={() => setActive("market")}>魔法商店 · 猫头鹰送礼</button>
            {contacts.map(contact => <button className="hogwarts-contact" key={contact.id} onClick={() => setRecipient(contact.id)}>
              <span className="hogwarts-avatar">{contact.name.slice(-1)}</span>{contact.name}
            </button>)}
          </> : <>
          <button onClick={() => { setRecipient(""); setDraft(""); }}>返回会话列表</button>
          <h3>{contacts.find(contact => contact.id === recipient)?.name}</h3>
          {letters.length === 0 && <p>暂时没有新的猫头鹰纸条。</p>}
          {recipient === "hyunjae" && letters.map(letter => <div key={letter.id} className="hogwarts-note-thread">
            <small>12月{letter.day}日</small>
            {letter.body.split(/(?<=[；;。！？?！]|\s)(?=(?:李贤在|你)[：:])/).map((line, index) =>
              note(/^你[：:]/.test(line) ? identity?.name ?? "我" : "李贤在", line.replace(/^(李贤在|你)[：:]/, "").replace(/[；;]$/, ""), /^你[：:]/.test(line), index))}
          </div>)}
          {recipient === "hyunjae" && owlToday && choices}
          {(sent[recipient] ?? []).map((body, index) => note(identity?.name ?? "我", body, true, index))}
          <form onSubmit={event => {
            event.preventDefault();
            if (!draft.trim()) return;
            setSent(previous => ({ ...previous, [recipient]: [...(previous[recipient] ?? []), draft.trim()] }));
            setDraft("");
          }}>
            <input aria-label="纸条内容" value={draft} onChange={event => setDraft(event.target.value)} maxLength={300} />
            <button disabled={!draft.trim()}>寄出纸条</button>
          </form>
          </>}
        </section> : active === "calendar" && identity ? <section>
          <HogwartsSchedule year={identity.year} house={identity.house} day={day} interaction={owlToday ? "猫头鹰信箱" : undefined}
            onScene={!owlToday && scenes.length > 0 && !nextDay ? () => setSceneOpen(true) : undefined}
            attended={attended} onAttend={(id, time, last) => {
              setAttended(previous => ({ ...previous, [id]: true }));
              setLessonTime(time);
              if (last && !owlToday && scenes.length > 0 && !nextDay) setSceneOpen(true);
            }}
            onEnd={nextDay && (!scenes.length || seenScene === scenes[scenes.length - 1]?.id) ? () => { select(nextDay.target); setLessonTime(undefined); } : day === 31 && state.endings.length && !finished ? () => setFinished(true) : undefined} />
          {finished && <p role="status">十二月已结束。</p>}
        </section> : active === "market" && identity ? <MagicalShops identityKey={identityKey} leadId={identity.loveInterest} />
          : active === "wizardjournal" && identity ? <section>
            {(work.data.wizardjournal ?? []).map(item => <p key={item.id}>{item.body}</p>)}
            <HogwartsCharacters year={identity.year} house={identity.house} identityKey={identityKey} />
            <button onClick={() => setActive("maraudersmap")}>打开活点地图</button>
          </section>
          : active === "maraudersmap" ? <section className="hogwarts-map" aria-label="霍格沃茨城堡示意图">
            {[
              ["城堡高层", "天文塔、图书馆、黑魔法防御术教室、魔咒学教室、魔法史教室、古代如尼文教室、算术占卜教室、占卜学教室、麻瓜研究教室"],
              ["城堡主层", "门厅、大礼堂、长廊、变形术教室"],
              ["城堡地窖", "魔药学教室"],
              ["城堡外侧", "庭院、拱门、草药学温室、魁地奇球场、保护神奇生物课场地、禁林边缘"],
            ].map(([area, places], index) => <div key={area}>
              <button aria-expanded={region === index} onClick={() => setRegion(region === index ? undefined : index)}>{area}</button>
              {region === index && <svg viewBox="0 0 340 330" role="img" aria-label={area + "地图"} className="hogwarts-floorplan">
                <path d="M170 32V298 M35 165H305" stroke="#8a6545" strokeWidth="12" fill="none" />
                {places.split("、").map((place, position) => {
                  const x = position % 2 ? 182 : 10;
                  const y = 12 + Math.floor(position / 2) * 62;
                  const marked = scenes.some(scene => scene.id === seenScene && scene.body.includes(place));
                  return <g key={place}>
                    {place === "魁地奇球场" ? <ellipse cx={x + 74} cy={y + 24} rx="74" ry="24" /> : <rect x={x} y={y} width="148" height="48" rx="5" />}
                    <text x={x + 74} y={y + 28} textAnchor="middle">{place}{marked ? " 👣" : ""}</text>
                  </g>;
                })}
              </svg>}
            </div>)}
          </section> : <section className="hogwarts-device-letters">{(work.data[active] ?? []).filter(item => active !== "magicphotos" || (item.title === "庭院初雪" ? state.variables.hyunjae_first_snow_together === true : day > 24)).map(item => <article className="hogwarts-device-letter" key={item.id}><strong>{item.title}</strong><p>{item.body}</p></article>)}{!(work.data[active] ?? []).length && <p>这页羊皮纸还没有写下新的内容。</p>}</section>}
      </main>
      {sceneOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }} onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="scene-title">
        <h2 id="scene-title">李贤在 <small>· HYUNJAE</small></h2>
        {scenes.map(scene => {
          const text = scene.body.replace(/(把书递给你|接过去了|李贤在笑了|还是伸手拿走|他(?:压低声音|说|问|笑着说))：/g, "$1。李贤在：")
            .replace(/(你接过书，摸出一颗糖递给他)：/g, "$1。你：");
          return <div key={scene.id}>{text.split(/(?=李贤在：|你：)/).flatMap((part, index) => {
            const line = part.match(/^(李贤在|你)：(.*)$/s);
            if (!line) return part && <p key={index} className="hogwarts-narration">{part}</p>;
            const [speech, aside] = line[2].split(/(?=嘴上这么说|李贤在笑了。|还是伸手拿走。)/, 2);
            return <div key={index}>
              {note(line[1] === "你" ? identity?.name ?? "我" : "李贤在", speech, line[1] === "你")}
              {aside && <p className="hogwarts-narration">{aside}</p>}
            </div>;
          })}</div>;
        })}
        {!owlToday && choices}
        {state.endings.length > 0 && <p>{state.endings.includes("hyunjae-together") ? "十二月的约定 · 恋人" : "十二月的约定 · 未说破的喜欢"}</p>}
        {(!choices || owlToday) && <button onClick={() => { setSeenScene(scenes[scenes.length - 1]?.id ?? ""); setSceneOpen(false); }}>继续今天的行程</button>}
      </dialog>}
      <nav className="hogwarts-dock" aria-label="学生手机应用">
        {modules.filter(module => ["magicphotos", "market", "owlpost", "wizardjournal"].includes(module.id)).map(module =>
          <button key={module.id} aria-pressed={active === module.id} onClick={() => setActive(active === module.id ? "calendar" : module.id)}>
            <span><module.Icon size={19} /></span>{module.id === "market" ? "魔法商店" : module.name}
          </button>)}
      </nav>
    </div>
  </div>;
}
